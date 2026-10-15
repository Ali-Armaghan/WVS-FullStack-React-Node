const { pass, fail, warn, header } = require('./helpers');

const POWERFUL = ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'display-capture'];

function parsePermissionsPolicy(value) {
  const policy = {};
  for (const part of value.split(',')) {
    const [name, ...rest] = part.split('=');
    if (!name || !rest.length) continue;
    policy[name.trim().toLowerCase()] = rest.join('=').trim();
  }
  return policy;
}

module.exports = {
  id: 8,
  key: 'permissionsPolicy',
  name: 'Permissions-Policy',
  category: 'headers',
  description: 'Verifies that powerful browser features such as camera, microphone and geolocation are restricted.',
  recommendation:
    'Add a Permissions-Policy header disabling features the site does not use.\n' +
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n' +
    'Nginx: add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;\n' +
    'Apache: Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"',
  references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy'],

  async run(ctx) {
    const value = header(ctx.main, 'permissions-policy');
    const legacy = header(ctx.main, 'feature-policy');

    if (!value && legacy) {
      return warn(this, 'Low', 'Only the deprecated Feature-Policy header is set.', { featurePolicy: legacy },
        'Replace Feature-Policy with the Permissions-Policy header, e.g. "camera=(), microphone=(), geolocation=()".');
    }
    if (!value) {
      return fail(this, 'Low', 'The Permissions-Policy header is missing, so browser features are not explicitly restricted.', { header: null });
    }

    const policy = parsePermissionsPolicy(value);
    const restricted = POWERFUL.filter((f) => f in policy && !policy[f].includes('*'));
    const evidence = { header: value.length > 400 ? `${value.slice(0, 400)}...` : value, restrictedFeatures: restricted };

    if (!restricted.length) {
      return warn(this, 'Low', 'A Permissions-Policy is set but does not restrict camera, microphone, geolocation or other powerful features.', evidence);
    }
    return pass(this, `Powerful features are restricted: ${restricted.join(', ')}.`, evidence);
  }
};
