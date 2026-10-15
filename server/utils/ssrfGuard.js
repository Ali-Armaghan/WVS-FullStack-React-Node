const dns = require('dns');
const net = require('net');
const ipaddr = require('ipaddr.js');
const AppError = require('./AppError');

const BLOCKED_HOSTNAME = /(^|\.)(localhost|local|internal|intranet|lan|home\.arpa|localdomain)\.?$/i;

function blocked() {
  return new AppError('BLOCKED_HOST', 'Scanning private or internal addresses is not allowed.', 403);
}

/** True only for globally routable unicast addresses. */
function isPublicIp(address) {
  if (!ipaddr.isValid(address)) return false;
  let ip = ipaddr.parse(address);
  if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) {
    ip = ip.toIPv4Address();
  }
  return ip.range() === 'unicast';
}

function stripBrackets(hostname) {
  return hostname.replace(/^\[|\]$/g, '');
}

/**
 * Resolves the hostname and throws if it (or any address it resolves to)
 * is private, loopback, link-local, multicast or otherwise non-public.
 * Returns the resolved addresses.
 */
async function assertPublicHost(hostname) {
  const host = stripBrackets(hostname);

  if (BLOCKED_HOSTNAME.test(host)) throw blocked();

  if (net.isIP(host)) {
    if (!isPublicIp(host)) throw blocked();
    return [{ address: host, family: net.isIP(host) }];
  }

  let addresses;
  try {
    addresses = await dns.promises.lookup(host, { all: true, verbatim: true });
  } catch (err) {
    throw new AppError(
      'DNS_FAILURE',
      `The domain "${host}" could not be resolved. Please check the spelling.`,
      422
    );
  }

  if (!addresses.length || addresses.some((a) => !isPublicIp(a.address))) throw blocked();
  return addresses;
}

/**
 * Drop-in replacement for dns.lookup used by the HTTP(S) agents, so the IP is
 * re-validated at connect time (protects against DNS rebinding).
 */
function safeLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses.length || addresses.some((a) => !isPublicIp(a.address))) {
      return callback(blocked());
    }
    if (options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
}

module.exports = { assertPublicHost, safeLookup, isPublicIp };
