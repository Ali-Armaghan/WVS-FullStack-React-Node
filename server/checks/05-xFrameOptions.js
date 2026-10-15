const { pass, fail, warn, header, parseCsp } = require('./helpers');

module.exports = {
  id: 5,
  key: 'xFrameOptions',
  name: 'X-Frame-Options (Clickjacking)',
  category: 'headers',
  description: 'Determines whether the site is protected against clickjacking by blocking it from being embedded in frames on other sites.',
  recommendation:
    'Send "X-Frame-Options: DENY" (or SAMEORIGIN) and/or the CSP directive "frame-ancestors \'self\'".\n' +
    'Nginx: add_header X-Frame-Options "SAMEORIGIN" always;\n' +
    'Apache: Header always set X-Frame-Options "SAMEORIGIN"\n' +
    'Express: app.use(helmet.frameguard({ action: "sameorigin" }))',
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
    'https://owasp.org/www-community/attacks/Clickjacking'
  ],

  async run(ctx) {
    const xfo = header(ctx.main, 'x-frame-options');
    const frameAncestors = parseCsp(header(ctx.main, 'content-security-policy'))['frame-ancestors'];
    const evidence = { xFrameOptions: xfo, cspFrameAncestors: frameAncestors ? frameAncestors.join(' ') : null };

    if (frameAncestors && frameAncestors.length && !frameAncestors.includes('*')) {
      return pass(this, `Framing is restricted by CSP frame-ancestors (${frameAncestors.join(' ')}).`, evidence);
    }

    const value = (xfo || '').trim().toUpperCase();
    if (value === 'DENY' || value === 'SAMEORIGIN') {
      return pass(this, `Clickjacking protection is enabled (X-Frame-Options: ${value}).`, evidence);
    }
    if (value.startsWith('ALLOW-FROM')) {
      return warn(this, 'Low', 'X-Frame-Options uses the deprecated ALLOW-FROM value, which modern browsers ignore.', evidence,
        'Replace ALLOW-FROM with the CSP directive "frame-ancestors https://trusted.example".');
    }

    return fail(
      this,
      'Medium',
      xfo ? `X-Frame-Options has an invalid value ("${xfo}") and no CSP frame-ancestors is set.` : 'Neither X-Frame-Options nor CSP frame-ancestors is set, so the page can be embedded by any site (clickjacking risk).',
      evidence
    );
  }
};
