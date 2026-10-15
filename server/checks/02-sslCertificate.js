const tls = require('tls');
const net = require('net');
const config = require('../config');
const { pass, fail, warn } = require('./helpers');
const { assertPublicHost } = require('../utils/ssrfGuard');

const ERROR_MESSAGES = {
  CERT_HAS_EXPIRED: 'The certificate has expired.',
  CERT_NOT_YET_VALID: 'The certificate is not valid yet.',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'The certificate is self-signed and not trusted by browsers.',
  SELF_SIGNED_CERT_IN_CHAIN: 'The certificate chain contains a self-signed (untrusted) certificate.',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'The certificate chain is incomplete (missing intermediate certificate).',
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 'The certificate was issued by an unknown or untrusted authority.',
  ERR_TLS_CERT_ALTNAME_INVALID: 'The certificate does not match the website\'s domain name.',
  CERT_REVOKED: 'The certificate has been revoked.'
};

function getCertificate(hostname, address, port) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: address,
      port,
      servername: net.isIP(hostname) ? undefined : hostname,
      rejectUnauthorized: false,
      minVersion: 'TLSv1',
      ciphers: 'DEFAULT:@SECLEVEL=0'
    });
    socket.setTimeout(config.requestTimeoutMs, () => socket.destroy(new Error('TLS handshake timed out')));
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      let identityError = null;
      if (cert && Object.keys(cert).length && !net.isIP(hostname)) {
        const err = tls.checkServerIdentity(hostname, cert);
        if (err) identityError = err.code || 'ERR_TLS_CERT_ALTNAME_INVALID';
      }
      const result = {
        cert,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError ? String(socket.authorizationError.code || socket.authorizationError) : null,
        identityError,
        protocol: socket.getProtocol(),
        cipher: socket.getCipher()?.name || null
      };
      socket.end();
      resolve(result);
    });
    socket.once('error', reject);
  });
}

const dn = (obj) => (obj ? obj.CN || obj.O || Object.values(obj).join(', ') : null);

module.exports = {
  id: 2,
  key: 'sslCertificate',
  name: 'SSL/TLS Certificate Validation',
  category: 'transport',
  description: 'Checks that the TLS certificate is trusted, matches the domain, is not expired, and that a modern TLS version is used.',
  recommendation:
    'Install a valid certificate from a trusted CA (e.g. Let\'s Encrypt) that covers this domain, include the full intermediate chain, enable automatic renewal, and disable TLS 1.0/1.1.\n' +
    'Nginx: ssl_protocols TLSv1.2 TLSv1.3;',
  references: [
    'https://www.ssllabs.com/ssltest/',
    'https://ssl-config.mozilla.org/',
    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/01-Testing_for_Weak_Transport_Layer_Security'
  ],

  async run(ctx) {
    const hostname = ctx.tlsHostname;
    const port = ctx.tlsPort;
    const [{ address }] = await assertPublicHost(hostname);

    let info;
    try {
      info = await getCertificate(hostname, address, port);
    } catch (err) {
      return fail(this, 'High', `No TLS connection could be established on port ${port} (${err.code || err.message}).`, {
        hostname,
        port,
        error: err.code || err.message
      });
    }

    const { cert } = info;
    if (!cert || !Object.keys(cert).length) {
      return fail(this, 'High', 'The server did not present a certificate.', { hostname, port });
    }

    const validTo = new Date(cert.valid_to);
    const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / 86400000);
    const evidence = {
      hostname,
      subject: dn(cert.subject),
      issuer: dn(cert.issuer),
      validFrom: new Date(cert.valid_from).toISOString(),
      validTo: validTo.toISOString(),
      daysRemaining,
      protocol: info.protocol,
      cipher: info.cipher,
      altNames: (cert.subjectaltname || '').split(', ').slice(0, 10).join(', '),
      trusted: info.authorized && !info.identityError,
      error: info.identityError || info.authorizationError
    };

    if (daysRemaining < 0) {
      return fail(this, 'High', `The certificate expired ${-daysRemaining} day(s) ago. Browsers will show a security warning.`, evidence);
    }
    if (info.identityError) {
      return fail(this, 'High', ERROR_MESSAGES.ERR_TLS_CERT_ALTNAME_INVALID, evidence);
    }
    if (!info.authorized) {
      const message = ERROR_MESSAGES[info.authorizationError] || `The certificate is not trusted (${info.authorizationError}).`;
      return fail(this, 'High', message, evidence);
    }
    if (info.protocol === 'TLSv1' || info.protocol === 'TLSv1.1') {
      return warn(this, 'Medium', `The server negotiated an outdated protocol (${info.protocol}). TLS 1.2 or newer should be used.`, evidence);
    }
    if (daysRemaining < 30) {
      return warn(this, 'Medium', `The certificate is valid but expires in ${daysRemaining} day(s).`, evidence,
        'Renew the certificate before it expires and enable automatic renewal (e.g. certbot renew via cron/systemd timer).');
    }

    return pass(this, `Valid certificate issued by ${evidence.issuer}, expires in ${daysRemaining} days, using ${info.protocol}.`, evidence);
  }
};
