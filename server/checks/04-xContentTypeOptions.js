const { pass, fail, header } = require('./helpers');

module.exports = {
  id: 4,
  key: 'xContentTypeOptions',
  name: 'X-Content-Type-Options',
  category: 'headers',
  description: 'Checks whether the site stops browsers from MIME-sniffing responses into a different content type.',
  recommendation:
    'Set "X-Content-Type-Options: nosniff" on all responses.\n' +
    'Nginx: add_header X-Content-Type-Options "nosniff" always;\n' +
    'Apache: Header always set X-Content-Type-Options "nosniff"\n' +
    'Express: app.use(helmet())',
  references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'],

  async run(ctx) {
    const value = header(ctx.main, 'x-content-type-options');
    if (value && value.trim().toLowerCase() === 'nosniff') {
      return pass(this, 'MIME-type sniffing is disabled (nosniff).', { header: value });
    }
    return fail(
      this,
      'Low',
      value ? `The header has an invalid value: "${value}".` : 'The X-Content-Type-Options header is missing.',
      { header: value }
    );
  }
};
