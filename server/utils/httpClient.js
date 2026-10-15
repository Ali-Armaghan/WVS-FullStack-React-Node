const http = require('http');
const https = require('https');
const axios = require('axios');
const config = require('../config');
const AppError = require('./AppError');
const { assertPublicHost, safeLookup } = require('./ssrfGuard');

const httpAgent = new http.Agent({ lookup: safeLookup, keepAlive: false });
// Certificate problems are reported by the TLS check, so other checks must still be able to connect.
const httpsAgent = new https.Agent({ lookup: safeLookup, keepAlive: false, rejectUnauthorized: false });

const client = axios.create({
  httpAgent,
  httpsAgent,
  maxRedirects: 0,
  responseType: 'stream',
  decompress: true,
  validateStatus: () => true,
  proxy: false,
  headers: {
    'User-Agent': config.userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
});

function readLimited(stream, maxBytes) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    };
    stream.on('data', (chunk) => {
      if (done) return;
      const remaining = maxBytes - size;
      chunks.push(chunk.length > remaining ? chunk.subarray(0, remaining) : chunk);
      size += chunk.length;
      if (size >= maxBytes) {
        finish();
        stream.destroy();
      }
    });
    stream.on('end', finish);
    stream.on('close', finish);
    stream.on('error', finish);
  });
}

function plainHeaders(headers) {
  const out = {};
  const source = typeof headers.toJSON === 'function' ? headers.toJSON() : headers;
  for (const [key, value] of Object.entries(source)) {
    out[key.toLowerCase()] = value;
  }
  if (out['set-cookie'] && !Array.isArray(out['set-cookie'])) {
    out['set-cookie'] = [out['set-cookie']];
  }
  return out;
}

function networkError(err, url) {
  if (err instanceof AppError) return err;
  const cause = err.cause instanceof AppError ? err.cause : null;
  if (cause) return cause;
  const code = err.code || err.cause?.code || err.name;
  const host = new URL(url).host;
  const messages = {
    ECONNREFUSED: `Connection to ${host} was refused.`,
    ENOTFOUND: `The domain ${host} could not be resolved.`,
    EAI_AGAIN: `The domain ${host} could not be resolved.`,
    ETIMEDOUT: `${host} did not respond in time.`,
    ECONNABORTED: `${host} did not respond in time.`,
    TimeoutError: `${host} did not respond in time.`,
    AbortError: `${host} did not respond in time.`,
    ECONNRESET: `The connection to ${host} was reset.`,
    EHOSTUNREACH: `${host} is unreachable.`
  };
  const wrapped = new AppError('REQUEST_FAILED', messages[code] || `Request to ${host} failed (${code || err.message}).`, 422);
  wrapped.networkCode = code;
  return wrapped;
}

/**
 * Performs a request against a public target with SSRF protection on every hop.
 * Returns { status, headers, body, url, redirectChain }. Throws AppError on failure.
 */
async function safeRequest(rawUrl, options = {}) {
  const {
    method = 'GET',
    headers = {},
    followRedirects = true,
    maxBytes = config.maxBodyBytes,
    timeoutMs = config.requestTimeoutMs,
    readBody = true
  } = options;

  let current = new URL(rawUrl);
  const redirectChain = [];

  for (let hop = 0; ; hop++) {
    if (current.protocol !== 'http:' && current.protocol !== 'https:') {
      throw new AppError('BLOCKED_REDIRECT', `Redirect to unsupported protocol ${current.protocol}`, 422);
    }
    if (current.port && !config.allowedPorts.includes(Number(current.port))) {
      throw new AppError('BLOCKED_REDIRECT', `Redirect to disallowed port ${current.port}`, 422);
    }
    await assertPublicHost(current.hostname);

    let response;
    let body = '';
    try {
      response = await client.request({
        url: current.href,
        method,
        headers,
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (readBody && method !== 'HEAD') {
        body = await readLimited(response.data, maxBytes);
      } else {
        response.data.destroy();
      }
    } catch (err) {
      throw networkError(err, current.href);
    }

    const resHeaders = plainHeaders(response.headers);
    const location = resHeaders.location;
    const isRedirect = response.status >= 300 && response.status < 400 && location;

    if (followRedirects && isRedirect) {
      if (hop >= config.maxRedirects) {
        throw new AppError('TOO_MANY_REDIRECTS', 'The website redirected too many times.', 422);
      }
      const next = new URL(location, current);
      redirectChain.push({ url: current.href, status: response.status, location: next.href });
      current = next;
      continue;
    }

    return { status: response.status, headers: resHeaders, body, url: current.href, redirectChain };
  }
}

/** Like safeRequest but resolves to null instead of throwing on network errors. */
async function tryRequest(url, options) {
  try {
    return await safeRequest(url, options);
  } catch (err) {
    if (err.code === 'BLOCKED_HOST') throw err;
    return null;
  }
}

module.exports = { safeRequest, tryRequest };
