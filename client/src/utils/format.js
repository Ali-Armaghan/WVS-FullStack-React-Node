export const SEVERITY_ORDER = ['High', 'Medium', 'Low', 'Informational']

export const SEVERITY_RANK = { None: 0, Informational: 1, Low: 2, Medium: 3, High: 4 }

export const CHECK_NAMES = [
  'HTTPS Availability',
  'SSL/TLS Certificate',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Content-Security-Policy',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cookie Security',
  'CORS Configuration',
  'Server Information Disclosure',
  'Directory Listing',
  'HTTP Methods',
  'robots.txt Analysis',
  'security.txt Availability',
]

export const CHECK_GROUPS = [
  { title: 'Transport Security', ids: [1, 2] },
  { title: 'Security Headers', ids: [3, 4, 5, 6, 7, 8] },
  { title: 'Cookies & CORS', ids: [9, 10] },
  { title: 'Information Disclosure & Configuration', ids: [11, 12, 13, 14, 15] },
]

export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(ms) {
  if (!ms && ms !== 0) return '-'
  return `${(ms / 1000).toFixed(1)}s`
}

export function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export const STATUS_LABEL = {
  pass: 'Passed',
  fail: 'Failed',
  warning: 'Warning',
  info: 'Info',
  error: 'Not completed',
}
