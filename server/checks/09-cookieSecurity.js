const setCookieParser = require('set-cookie-parser');
const { pass, fail, warn, maxSeverity } = require('./helpers');

const SESSION_LIKE = /sess|sid|auth|token|jwt|login|remember|connect\.sid|phpsessid|jsessionid|asp\.net_sessionid|csrf|xsrf/i;

module.exports = {
  id: 9,
  key: 'cookieSecurity',
  name: 'Cookie Security',
  category: 'cookies',
  description: 'Checks that cookies use the Secure, HttpOnly and SameSite attributes.',
  recommendation:
    'Set Secure, HttpOnly (for session/auth cookies) and SameSite=Lax or Strict on every cookie.\n' +
    'Set-Cookie: sessionid=...; Path=/; Secure; HttpOnly; SameSite=Lax\n' +
    'Express: res.cookie("sid", value, { secure: true, httpOnly: true, sameSite: "lax" })\n' +
    'PHP: session.cookie_secure=1, session.cookie_httponly=1, session.cookie_samesite=Lax',
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security',
    'https://www.rfc-editor.org/rfc/rfc6265',
    'https://owasp.org/www-community/HttpOnly'
  ],

  async run(ctx) {
    const raw = ctx.main.headers['set-cookie'] || [];
    const cookies = setCookieParser.parse(raw, { decodeValues: false });
    const isHttps = new URL(ctx.main.url).protocol === 'https:';

    if (!cookies.length) {
      return pass(this, 'No cookies are set on the main page.', { cookies: [] });
    }

    const analysed = cookies.slice(0, 30).map((c) => {
      const sameSite = c.sameSite ? String(c.sameSite).toLowerCase() : null;
      const sessionLike = SESSION_LIKE.test(c.name);
      const issues = [];
      const severities = [];

      if (!c.secure && isHttps) {
        issues.push('missing Secure');
        severities.push(sessionLike ? 'Medium' : 'Low');
      }
      if (!c.httpOnly && sessionLike) {
        issues.push('missing HttpOnly');
        severities.push('Medium');
      }
      if (!sameSite) {
        issues.push('missing SameSite');
        severities.push('Low');
      } else if (sameSite === 'none' && !c.secure) {
        issues.push('SameSite=None without Secure');
        severities.push('Medium');
      }

      return {
        name: c.name,
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: c.sameSite || null,
        sessionLike,
        issues,
        severity: maxSeverity(severities)
      };
    });

    const insecure = analysed.filter((c) => c.issues.length);
    const evidence = { cookies: analysed };

    if (!insecure.length) {
      return pass(this, `All ${analysed.length} cookie(s) use secure attributes.`, evidence);
    }

    const severity = maxSeverity(insecure.map((c) => c.severity));
    const summary = insecure.map((c) => `${c.name} (${c.issues.join(', ')})`).join('; ');
    const finding = `${insecure.length} of ${analysed.length} cookie(s) are missing security attributes: ${summary}.`;
    return severity === 'Medium' ? fail(this, severity, finding, evidence) : warn(this, severity, finding, evidence);
  }
};
