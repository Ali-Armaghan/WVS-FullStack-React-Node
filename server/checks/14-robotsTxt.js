const { pass, warn, info, looksLikeHtml } = require('./helpers');

const SENSITIVE = /(^|[/._-])(admin|administrator|backup|backups|bak|config|configuration|\.git|\.env|\.svn|private|secret|secrets|db|database|sql|dump|logs?|wp-admin|phpmyadmin|internal|staging|dev|test|tmp|old|cgi-bin|api|credentials|keys?)([/._-]|$)/i;

module.exports = {
  id: 14,
  key: 'robotsTxt',
  name: 'robots.txt Analysis',
  category: 'disclosure',
  description: 'Examines robots.txt for Disallow entries that reveal sensitive or hidden paths to attackers.',
  recommendation:
    'robots.txt is public and is not access control. Remove entries that reveal sensitive paths, and protect those areas with authentication instead. Use the X-Robots-Tag header or a noindex meta tag for pages you want to keep out of search engines.',
  references: [
    'https://developer.mozilla.org/en-US/docs/Glossary/Robots.txt',
    'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/01-Conduct_Search_Engine_Discovery_Reconnaissance_for_Information_Leakage'
  ],

  async run(ctx) {
    const res = await ctx.tryRequest(new URL('/robots.txt', ctx.origin).href, { maxBytes: 128 * 1024 });

    if (!res || res.status !== 200 || looksLikeHtml(res.body)) {
      return info(this, 'No robots.txt file was found.', { status: res ? res.status : null },
        'This is not a vulnerability. Optionally add a robots.txt to guide search engines, without listing sensitive paths.');
    }

    const disallows = res.body
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*/, '').trim())
      .filter((line) => /^disallow\s*:/i.test(line))
      .map((line) => line.replace(/^disallow\s*:/i, '').trim())
      .filter(Boolean);

    const sensitive = [...new Set(disallows.filter((p) => SENSITIVE.test(p)))];
    const evidence = { disallowCount: disallows.length, sensitivePaths: sensitive.slice(0, 20) };

    if (sensitive.length) {
      return warn(this, 'Low', `robots.txt reveals ${sensitive.length} potentially sensitive path(s): ${sensitive.slice(0, 5).join(', ')}${sensitive.length > 5 ? ', ...' : ''}.`, evidence);
    }
    return pass(this, `robots.txt found with ${disallows.length} Disallow entr${disallows.length === 1 ? 'y' : 'ies'}; none look sensitive.`, evidence);
  }
};
