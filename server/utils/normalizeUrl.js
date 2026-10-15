const net = require('net');
const config = require('../config');
const AppError = require('./AppError');

const MAX_URL_LENGTH = 2048;

function invalid(message = 'Please enter a valid website URL, e.g. https://example.com') {
  return new AppError('INVALID_URL', message, 400);
}

/**
 * Turns user input like "example.com" into a validated URL object
 * ("https://example.com/"). Throws AppError(INVALID_URL) on bad input.
 */
function normalizeUrl(input) {
  if (typeof input !== 'string') throw invalid();

  let value = input.trim();
  if (!value) throw invalid('Please enter a website URL.');
  if (value.length > MAX_URL_LENGTH) throw invalid('The URL is too long.');
  if (/\s/.test(value)) throw invalid('The URL must not contain spaces.');

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:]+:\d+/.test(value)) {
      throw invalid('Only http:// and https:// URLs can be scanned.');
    }
    value = `https://${value}`;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw invalid('Only http:// and https:// URLs can be scanned.');
  }
  if (url.username || url.password) {
    throw invalid('URLs containing usernames or passwords are not allowed.');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host) throw invalid();
  if (!net.isIP(host) && !/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}\.?$/i.test(host) && !/^xn--/i.test(host)) {
    throw invalid('Please enter a full domain name, e.g. example.com');
  }

  if (url.port && !config.allowedPorts.includes(Number(url.port))) {
    throw invalid(`Port ${url.port} is not allowed. Allowed ports: ${config.allowedPorts.join(', ')}.`);
  }

  url.hash = '';
  return url;
}

module.exports = normalizeUrl;
