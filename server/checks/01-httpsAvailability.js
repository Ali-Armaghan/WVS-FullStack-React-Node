const { pass, fail } = require('./helpers');

module.exports = {
  id: 1,
  key: 'httpsAvailability',
  name: 'HTTPS Availability',
  category: 'transport',
  description: 'Verifies that the website is served over HTTPS and that plain HTTP requests are redirected to HTTPS.',
  recommendation:
    'Serve the site over HTTPS with a valid certificate (e.g. free from Let\'s Encrypt) and permanently redirect all HTTP traffic to HTTPS.\n' +
    'Nginx: server { listen 80; return 301 https://$host$request_uri; }\n' +
    'Apache: Redirect permanent / https://example.com/',
  references: [
    'https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security',
    'https://letsencrypt.org/getting-started/'
  ],

  async run(ctx) {
    const evidence = {
      httpsReachable: ctx.https.ok,
      httpsError: ctx.https.error || null,
      httpReachable: ctx.http.ok,
      httpRedirectChain: ctx.http.response?.redirectChain || [],
      httpFinalUrl: ctx.http.response?.url || null
    };

    if (!ctx.https.ok) {
      return fail(this, 'High', 'The website is not reachable over HTTPS. All traffic is sent unencrypted.', evidence);
    }

    if (!ctx.http.ok) {
      return pass(this, 'The website is served over HTTPS and plain HTTP is not offered.', evidence);
    }

    const finalProtocol = new URL(ctx.http.response.url).protocol;
    if (finalProtocol === 'https:') {
      return pass(this, 'The website is served over HTTPS and HTTP requests are redirected to HTTPS.', evidence);
    }

    return fail(
      this,
      'Medium',
      'HTTPS is available, but HTTP requests are not redirected to HTTPS, so visitors can still use an unencrypted connection.',
      evidence,
      'Permanently redirect (301) every HTTP request to its HTTPS equivalent and enable HSTS.\n' +
        'Nginx: server { listen 80; return 301 https://$host$request_uri; }\n' +
        'Apache: Redirect permanent / https://example.com/'
    );
  }
};
