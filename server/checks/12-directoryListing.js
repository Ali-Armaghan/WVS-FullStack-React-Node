const { pass, fail } = require('./helpers');

const PATHS = ['/', '/images/', '/uploads/', '/assets/', '/static/', '/files/', '/backup/'];
const SIGNATURES = [
  /<title>\s*Index of \//i,
  /<h1>\s*Index of \//i,
  /Directory listing for \//i,
  /\[To Parent Directory\]/i,
  />\s*Parent Directory\s*<\/a>/i
];
const CONCURRENCY = 3;

module.exports = {
  id: 12,
  key: 'directoryListing',
  name: 'Directory Listing Detection',
  category: 'configuration',
  description: 'Checks whether the web server shows file listings for directories without an index page.',
  recommendation:
    'Disable automatic directory indexes on the web server.\n' +
    'Nginx: autoindex off;\n' +
    'Apache: Options -Indexes (in the vhost or .htaccess)\n' +
    'IIS: <directoryBrowse enabled="false" /> in web.config\n' +
    'Express: do not use serve-index on public paths',
  references: [
    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/04-Review_Old_Backup_and_Unreferenced_Files_for_Sensitive_Information',
    'https://cwe.mitre.org/data/definitions/548.html'
  ],

  async run(ctx) {
    const found = [];
    const checked = [];

    for (let i = 0; i < PATHS.length; i += CONCURRENCY) {
      const batch = PATHS.slice(i, i + CONCURRENCY);
      const responses = await Promise.all(
        batch.map((p) => ctx.tryRequest(new URL(p, ctx.origin).href, { followRedirects: false, maxBytes: 64 * 1024 }))
      );
      responses.forEach((res, idx) => {
        const path = batch[idx];
        checked.push({ path, status: res ? res.status : 'error' });
        if (res && res.status === 200 && SIGNATURES.some((s) => s.test(res.body))) found.push(path);
      });
    }

    const evidence = { listingsFound: found, pathsChecked: checked };
    if (found.length) {
      return fail(this, 'Medium', `Directory listing is enabled on: ${found.join(', ')}. Anyone can browse the files in these folders.`, evidence);
    }
    return pass(this, `No directory listings were found on ${checked.length} common paths.`, evidence);
  }
};
