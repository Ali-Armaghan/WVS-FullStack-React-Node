const { pass, fail, header } = require('./helpers');

const SAFE = [
  'no-referrer',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'origin',
  'origin-when-cross-origin',
  'no-referrer-when-downgrade'
];

module.exports = {
  id: 7,
  key: 'referrerPolicy',
  name: 'Referrer-Policy',
  category: 'headers',
  description: 'Checks whether the site controls how much referrer information (the page URL) is sent to other websites.',
  recommendation:
    'Set "Referrer-Policy: strict-origin-when-cross-origin" (or stricter, e.g. no-referrer).\n' +
    'Nginx: add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n' +
    'Apache: Header always set Referrer-Policy "strict-origin-when-cross-origin"\n' +
    'Express: app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }))',
  references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy'],

  async run(ctx) {
    const value = header(ctx.main, 'referrer-policy');
    if (!value) {
      return fail(this, 'Low', 'The Referrer-Policy header is missing; the browser default will be used.', { header: null });
    }

    const tokens = value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const effective = [...tokens].reverse().find((t) => SAFE.includes(t) || t === 'unsafe-url') || tokens[tokens.length - 1];
    const evidence = { header: value, effectivePolicy: effective };

    if (effective === 'unsafe-url') {
      return fail(this, 'Medium', 'Referrer-Policy is "unsafe-url", which sends the full URL (including paths and query strings) to every site, even over HTTP.', evidence);
    }
    if (!SAFE.includes(effective)) {
      return fail(this, 'Low', `Referrer-Policy has an unrecognised value ("${value}").`, evidence);
    }
    return pass(this, `Referrer information is controlled (${effective}).`, evidence);
  }
};
