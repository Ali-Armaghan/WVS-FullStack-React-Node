const { pass, fail, warn, header } = require('./helpers');

const TEST_ORIGIN = 'https://wvs-evil-origin.example';

module.exports = {
  id: 10,
  key: 'cors',
  name: 'CORS Configuration',
  category: 'cors',
  description: 'Detects Cross-Origin Resource Sharing settings that let arbitrary websites read responses from this site.',
  recommendation:
    'Only return Access-Control-Allow-Origin for an explicit allow-list of trusted origins. Never reflect the request Origin or allow "null", and never combine a wildcard/reflected origin with Access-Control-Allow-Credentials: true.\n' +
    'Express: app.use(cors({ origin: ["https://app.example.com"], credentials: true }))',
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
    'https://portswigger.net/web-security/cors',
    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing'
  ],

  async run(ctx) {
    const [evil, nullOrigin] = await Promise.all([
      ctx.tryRequest(ctx.main.url, { headers: { Origin: TEST_ORIGIN }, followRedirects: false, maxBytes: 1024 }),
      ctx.tryRequest(ctx.main.url, { headers: { Origin: 'null' }, followRedirects: false, maxBytes: 1024 })
    ]);

    const read = (res) => ({
      allowOrigin: header(res, 'access-control-allow-origin'),
      allowCredentials: (header(res, 'access-control-allow-credentials') || '').toLowerCase() === 'true'
    });
    const e = read(evil);
    const n = read(nullOrigin);
    const evidence = { testOrigin: TEST_ORIGIN, arbitraryOrigin: e, nullOrigin: n };

    if (e.allowOrigin === TEST_ORIGIN) {
      return e.allowCredentials
        ? fail(this, 'High', 'The server reflects any Origin and allows credentials, so any website can read authenticated responses on behalf of logged-in users.', evidence)
        : fail(this, 'Medium', 'The server reflects any Origin in Access-Control-Allow-Origin, so any website can read its responses.', evidence);
    }
    if (n.allowOrigin === 'null') {
      return n.allowCredentials
        ? fail(this, 'High', 'The server trusts the "null" origin with credentials (exploitable from sandboxed iframes).', evidence)
        : fail(this, 'Medium', 'The server trusts the "null" origin, which attackers can send from sandboxed iframes.', evidence);
    }
    if (e.allowOrigin === '*') {
      return warn(this, 'Low', 'Access-Control-Allow-Origin is "*". This is fine for truly public resources but should not be used for private data.', evidence);
    }
    if (!e.allowOrigin) {
      return pass(this, 'No permissive CORS headers were returned for an untrusted origin.', evidence);
    }
    return pass(this, `CORS is restricted to a fixed origin (${e.allowOrigin}).`, evidence);
  }
};
