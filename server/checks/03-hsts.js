const { pass, fail, warn, header } = require('./helpers');

const MIN_MAX_AGE = 15552000; // 180 days

module.exports = {
  id: 3,
  key: 'hsts',
  name: 'Strict-Transport-Security (HSTS)',
  category: 'headers',
  description: 'Checks that the HSTS header tells browsers to always use HTTPS for this site.',
  recommendation:
    'Send the Strict-Transport-Security header on HTTPS responses with a long max-age.\n' +
    'Nginx: add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\n' +
    'Apache: Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"\n' +
    'Express: app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }))',
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
    'https://www.rfc-editor.org/rfc/rfc6797'
  ],

  async run(ctx) {
    if (!ctx.https.ok) {
      return fail(this, 'Medium', 'HSTS cannot be applied because the website is not served over HTTPS.', { header: null });
    }

    const value = header(ctx.https.response, 'strict-transport-security');
    if (!value) {
      return fail(this, 'Medium', 'The Strict-Transport-Security header is missing, so browsers may still connect over HTTP.', { header: null });
    }

    const maxAgeMatch = value.match(/max-age\s*=\s*"?(\d+)"?/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null;
    const includeSubDomains = /includesubdomains/i.test(value);
    const preload = /preload/i.test(value);
    const evidence = { header: value, maxAge, includeSubDomains, preload };

    if (maxAge === null) {
      return fail(this, 'Medium', 'The HSTS header has no valid max-age directive and will be ignored by browsers.', evidence);
    }
    if (maxAge === 0) {
      return fail(this, 'Medium', 'HSTS is disabled (max-age=0).', evidence);
    }
    if (maxAge < MIN_MAX_AGE) {
      return warn(this, 'Low', `HSTS max-age is only ${Math.round(maxAge / 86400)} day(s); at least 180 days (ideally 1 year) is recommended.`, evidence);
    }
    if (!includeSubDomains) {
      return warn(this, 'Low', 'HSTS is enabled but does not include subdomains (includeSubDomains is missing).', evidence);
    }

    return pass(this, `HSTS is enabled with max-age of ${Math.round(maxAge / 86400)} days${preload ? ' and preload' : ''}.`, evidence);
  }
};
