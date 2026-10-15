const { pass, fail, info, header } = require('./helpers');

const HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator', 'x-runtime', 'x-drupal-cache', 'via'];
const VERSION = /\d+\.\d+/;

module.exports = {
  id: 11,
  key: 'serverInfoDisclosure',
  name: 'Server Information Disclosure',
  category: 'disclosure',
  description: 'Identifies server software, framework names and version numbers exposed in HTTP response headers.',
  recommendation:
    'Hide server and framework details from response headers.\n' +
    'Nginx: server_tokens off;\n' +
    'Apache: ServerTokens Prod and ServerSignature Off\n' +
    'PHP: expose_php = Off\n' +
    'Express: app.disable("x-powered-by") or app.use(helmet())\n' +
    'IIS/ASP.NET: <httpRuntime enableVersionHeader="false" /> and remove X-Powered-By in web.config',
  references: [
    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server'
  ],

  async run(ctx) {
    const exposed = {};
    for (const name of HEADERS) {
      const value = header(ctx.main, name);
      if (value) exposed[name] = value;
    }
    const withVersion = Object.entries(exposed).filter(([k, v]) =>
      VERSION.test(k === 'via' ? v.replace(/^\s*(HTTP\/)?\d\.\d\s*/i, '') : v)
    );
    const evidence = { exposedHeaders: exposed };

    if (withVersion.length) {
      const list = withVersion.map(([k, v]) => `${k}: ${v}`).join('; ');
      return fail(this, 'Low', `Software version numbers are exposed (${list}), helping attackers find known vulnerabilities.`, evidence);
    }
    if (Object.keys(exposed).length) {
      const list = Object.entries(exposed).map(([k, v]) => `${k}: ${v}`).join('; ');
      return info(this, `Server/technology names are exposed without versions (${list}).`, evidence);
    }
    return pass(this, 'No server or framework information is exposed in response headers.', evidence);
  }
};
