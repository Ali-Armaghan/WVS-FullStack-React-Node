const HOST_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}\.?$/i
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/

/**
 * Client-side URL check. Returns { valid, url, error }.
 * The server repeats this validation and also blocks private addresses.
 */
export function validateUrl(input) {
  let value = (input || '').trim()
  if (!value) return { valid: false, error: 'Please enter a website URL.' }
  if (value.length > 2048) return { valid: false, error: 'The URL is too long.' }
  if (/\s/.test(value)) return { valid: false, error: 'The URL must not contain spaces.' }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:]+:\d+/.test(value)) {
      return { valid: false, error: 'Only http:// and https:// URLs can be scanned.' }
    }
    value = `https://${value}`
  }

  let url
  try {
    url = new URL(value)
  } catch {
    return { valid: false, error: 'Please enter a valid website URL, e.g. https://example.com' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { valid: false, error: 'Only http:// and https:// URLs can be scanned.' }
  }
  if (url.username || url.password) {
    return { valid: false, error: 'URLs containing usernames or passwords are not allowed.' }
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (!HOST_PATTERN.test(host) && !IPV4_PATTERN.test(host) && !host.includes(':')) {
    return { valid: false, error: 'Please enter a full domain name, e.g. example.com' }
  }

  url.hash = ''
  return { valid: true, url: url.href }
}
