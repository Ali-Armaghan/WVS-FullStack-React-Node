const { pass, warn, info, looksLikeHtml } = require('./helpers');

function parseFields(body) {
  const fields = {};
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z-]+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    (fields[key] ||= []).push(m[2]);
  }
  return fields;
}

module.exports = {
  id: 15,
  key: 'securityTxt',
  name: 'security.txt Availability',
  category: 'disclosure',
  description: 'Checks for a security.txt file (RFC 9116) telling researchers how to report vulnerabilities.',
  recommendation:
    'Publish /.well-known/security.txt with at least Contact and Expires fields, for example:\n' +
    'Contact: mailto:security@example.com\n' +
    'Expires: 2027-12-31T23:59:59Z\n' +
    'Preferred-Languages: en\n' +
    'Generator: https://securitytxt.org/',
  references: ['https://www.rfc-editor.org/rfc/rfc9116', 'https://securitytxt.org/'],

  async run(ctx) {
    let found = null;
    for (const path of ['/.well-known/security.txt', '/security.txt']) {
      const res = await ctx.tryRequest(new URL(path, ctx.origin).href, { maxBytes: 32 * 1024 });
      if (res && res.status === 200 && !looksLikeHtml(res.body) && /contact\s*:|expires\s*:/i.test(res.body)) {
        found = { path, body: res.body };
        break;
      }
    }

    if (!found) {
      return info(this, 'No security.txt file was found, so researchers have no clear way to report vulnerabilities.', { location: null });
    }

    const fields = parseFields(found.body);
    const contact = fields.contact || [];
    const expires = fields.expires?.[0] || null;
    const expiresDate = expires ? new Date(expires) : null;
    const problems = [];

    if (!contact.length) problems.push('missing the required Contact field');
    if (!expires) problems.push('missing the required Expires field');
    else if (Number.isNaN(expiresDate.getTime())) problems.push('has an invalid Expires date');
    else if (expiresDate < new Date()) problems.push(`expired on ${expiresDate.toISOString().slice(0, 10)}`);

    const evidence = {
      location: found.path,
      contact,
      expires,
      policy: fields.policy || [],
      encryption: fields.encryption || []
    };

    if (problems.length) {
      return warn(this, 'Low', `security.txt was found at ${found.path} but it is ${problems.join(' and ')}.`, evidence);
    }
    return pass(this, `A valid security.txt was found at ${found.path}.`, evidence);
  }
};
