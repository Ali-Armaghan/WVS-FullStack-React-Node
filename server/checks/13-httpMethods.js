const crypto = require('crypto');
const { pass, fail, warn, header } = require('./helpers');

const RISKY = ['PUT', 'DELETE', 'CONNECT', 'TRACE', 'TRACK'];

const methodList = (value) => (value ? value.split(',').map((m) => m.trim().toUpperCase()).filter(Boolean) : []);

module.exports = {
  id: 13,
  key: 'httpMethods',
  name: 'HTTP Methods Analysis',
  category: 'configuration',
  description: 'Identifies potentially risky HTTP methods (TRACE, PUT, DELETE, CONNECT) enabled on the server. Only OPTIONS and a harmless TRACE probe are sent.',
  recommendation:
    'Allow only the methods the site needs (usually GET, HEAD, POST) and disable TRACE.\n' +
    'Apache: TraceEnable off, and <LimitExcept GET POST HEAD> Require all denied </LimitExcept>\n' +
    'Nginx: if ($request_method !~ ^(GET|HEAD|POST)$) { return 405; }\n' +
    'IIS: use Request Filtering > HTTP Verbs to deny TRACE/PUT/DELETE',
  references: [
    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods',
    'https://owasp.org/www-community/attacks/Cross_Site_Tracing'
  ],

  async run(ctx) {
    const token = crypto.randomBytes(8).toString('hex');
    const [options, trace] = await Promise.all([
      ctx.tryRequest(ctx.main.url, { method: 'OPTIONS', followRedirects: false, maxBytes: 4096 }),
      ctx.tryRequest(ctx.main.url, { method: 'TRACE', followRedirects: false, maxBytes: 8192, headers: { 'X-WVS-Trace-Test': token } })
    ]);

    const allowed = methodList(header(options, 'allow'));
    const corsMethods = methodList(header(options, 'access-control-allow-methods'));
    const traceEnabled = !!trace && trace.status === 200 && trace.body.includes(token);
    const risky = allowed.filter((m) => RISKY.includes(m));
    const evidence = {
      optionsStatus: options ? options.status : null,
      allowHeader: allowed,
      corsAllowMethods: corsMethods,
      traceStatus: trace ? trace.status : null,
      traceEnabled
    };

    if (traceEnabled) {
      return fail(this, 'Medium', 'The TRACE method is enabled and echoes requests back, which can expose headers (Cross-Site Tracing).', evidence);
    }
    if (risky.length) {
      return warn(this, 'Low', `The server advertises risky HTTP methods: ${risky.join(', ')}.`, evidence);
    }
    return pass(this, allowed.length ? `Only safe methods are advertised (${allowed.join(', ')}) and TRACE is disabled.` : 'TRACE is disabled and no risky methods are advertised.', evidence);
  }
};
