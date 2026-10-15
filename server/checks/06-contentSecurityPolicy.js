const { pass, fail, warn, header, parseCsp } = require('./helpers');

module.exports = {
  id: 6,
  key: 'contentSecurityPolicy',
  name: 'Content-Security-Policy (CSP)',
  category: 'headers',
  description: 'Verifies that a Content Security Policy is present and not weakened by unsafe sources, reducing the impact of XSS and injection attacks.',
  recommendation:
    'Add a Content-Security-Policy header that only allows trusted sources, and avoid \'unsafe-inline\' / \'unsafe-eval\' (use nonces or hashes instead). Start with:\n' +
    'Content-Security-Policy: default-src \'self\'; object-src \'none\'; base-uri \'self\'; frame-ancestors \'self\'\n' +
    'Nginx: add_header Content-Security-Policy "default-src \'self\'; object-src \'none\'" always;\n' +
    'Express: app.use(helmet.contentSecurityPolicy())',
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
    'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html',
    'https://csp-evaluator.withgoogle.com/'
  ],

  async run(ctx) {
    const value = header(ctx.main, 'content-security-policy');
    const reportOnly = header(ctx.main, 'content-security-policy-report-only');

    if (!value && !reportOnly) {
      return fail(this, 'Medium', 'No Content-Security-Policy header was returned.', { header: null });
    }
    if (!value) {
      return warn(this, 'Low', 'A CSP is only set in report-only mode, so it is not enforced.', { reportOnly },
        'Once the report-only policy produces no unexpected violations, send it as Content-Security-Policy to enforce it.');
    }

    const d = parseCsp(value);
    const scriptDirective = d['script-src'] ? 'script-src' : d['default-src'] ? 'default-src' : null;
    const scriptSources = scriptDirective ? d[scriptDirective].map((s) => s.toLowerCase()) : [];
    const usesNonceOrHash = scriptSources.some((s) => /^'(nonce|sha256|sha384|sha512)-/.test(s));
    const weaknesses = [];

    if (!scriptDirective) {
      weaknesses.push('No script-src or default-src directive, so scripts are not restricted.');
    } else {
      if (scriptSources.includes("'unsafe-inline'") && !usesNonceOrHash && !scriptSources.includes("'strict-dynamic'")) {
        weaknesses.push(`${scriptDirective} allows 'unsafe-inline' scripts.`);
      }
      if (scriptSources.includes("'unsafe-eval'")) weaknesses.push(`${scriptDirective} allows 'unsafe-eval'.`);
      if (scriptSources.includes('*')) weaknesses.push(`${scriptDirective} allows scripts from any origin (*).`);
      if (scriptSources.includes('data:')) weaknesses.push(`${scriptDirective} allows data: URIs.`);
      if (scriptSources.includes('http:') || scriptSources.includes('https:')) {
        weaknesses.push(`${scriptDirective} allows any host over a whole scheme (http: / https:).`);
      }
    }
    if (!d['object-src'] && !d['default-src']) weaknesses.push('object-src is not restricted (plugins/embeds).');

    const evidence = { header: value.length > 600 ? `${value.slice(0, 600)}...` : value, weaknesses };

    if (weaknesses.length) {
      return warn(this, 'Low', `A CSP is present but has ${weaknesses.length} weakness(es): ${weaknesses.join(' ')}`, evidence);
    }
    return pass(this, 'A Content-Security-Policy is enforced with no obvious weaknesses.', evidence);
  }
};
