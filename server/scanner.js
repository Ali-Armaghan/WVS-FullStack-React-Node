const config = require('./config');
const checks = require('./checks');
const { errorResult } = require('./checks/helpers');
const normalizeUrl = require('./utils/normalizeUrl');
const AppError = require('./utils/AppError');
const { assertPublicHost } = require('./utils/ssrfGuard');
const { safeRequest, tryRequest } = require('./utils/httpClient');

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new AppError('TIMEOUT', message, 422)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

function buildVariant(target, protocol) {
  const url = new URL(target.href);
  const keepPort = url.port && target.protocol === protocol;
  url.protocol = protocol;
  url.port = keepPort ? target.port : '';
  return url.href;
}

async function attempt(url) {
  try {
    return { ok: true, response: await safeRequest(url) };
  } catch (err) {
    if (err.code === 'BLOCKED_HOST') throw err;
    return { ok: false, error: err.message };
  }
}

async function buildContext(target) {
  const [https, http] = await Promise.all([
    attempt(buildVariant(target, 'https:')),
    attempt(buildVariant(target, 'http:'))
  ]);

  if (!https.ok && !http.ok) {
    throw new AppError('TARGET_UNREACHABLE', `The website could not be reached. ${https.error || http.error || ''}`.trim(), 422);
  }

  const main = https.ok ? https.response : http.response;
  const mainUrl = new URL(main.url);
  const tlsUrl = https.ok ? new URL(https.response.url) : new URL(buildVariant(target, 'https:'));

  return {
    target,
    https,
    http,
    main,
    origin: mainUrl.origin,
    tlsHostname: tlsUrl.hostname.replace(/^\[|\]$/g, ''),
    tlsPort: Number(tlsUrl.port) || 443,
    request: safeRequest,
    tryRequest
  };
}

async function runChecks(ctx) {
  const settled = await Promise.allSettled(
    checks.map((check) =>
      withTimeout(Promise.resolve().then(() => check.run(ctx)), config.checkTimeoutMs, 'The check timed out.')
    )
  );
  return settled.map((r, i) => (r.status === 'fulfilled' ? r.value : errorResult(checks[i], r.reason)));
}

/**
 * Runs all security checks against the given URL.
 * Returns { websiteUrl, finalUrl, results, durationMs }.
 */
async function runScan(input) {
  const started = Date.now();
  const target = normalizeUrl(input);
  await assertPublicHost(target.hostname);

  const scan = async () => {
    const ctx = await buildContext(target);
    const results = await runChecks(ctx);
    return { websiteUrl: target.href, finalUrl: ctx.main.url, results };
  };

  const result = await withTimeout(scan(), config.scanTimeoutMs, 'The scan took too long and was stopped.');
  return { ...result, durationMs: Date.now() - started };
}

module.exports = { runScan, buildVariant, withTimeout };
