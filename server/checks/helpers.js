function base(check) {
  return {
    checkId: check.id,
    key: check.key,
    name: check.name,
    category: check.category,
    description: check.description,
    references: check.references || []
  };
}

function pass(check, finding, evidence = {}) {
  return { ...base(check), status: 'pass', severity: 'None', finding, evidence, recommendation: '' };
}

function fail(check, severity, finding, evidence = {}, recommendation = check.recommendation) {
  return { ...base(check), status: 'fail', severity, finding, evidence, recommendation };
}

function warn(check, severity, finding, evidence = {}, recommendation = check.recommendation) {
  return { ...base(check), status: 'warning', severity, finding, evidence, recommendation };
}

function info(check, finding, evidence = {}, recommendation = check.recommendation) {
  return { ...base(check), status: 'info', severity: 'Informational', finding, evidence, recommendation };
}

function errorResult(check, err) {
  return {
    ...base(check),
    status: 'error',
    severity: 'None',
    finding: `This check could not be completed: ${err?.message || 'unknown error'}`,
    evidence: {},
    recommendation: ''
  };
}

const SEVERITY_RANK = { None: 0, Informational: 1, Low: 2, Medium: 3, High: 4 };

function maxSeverity(severities) {
  return severities.reduce((a, b) => (SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a), 'None');
}

/** Parses a CSP header into { directive: [sources] } (directive names lowercased). */
function parseCsp(header) {
  const directives = {};
  if (!header) return directives;
  for (const part of String(header).split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const name = tokens[0].toLowerCase();
    if (!(name in directives)) directives[name] = tokens.slice(1);
  }
  return directives;
}

/** Returns a header value as a single string (joins repeated headers). */
function header(response, name) {
  const value = response?.headers?.[name.toLowerCase()];
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function looksLikeHtml(body) {
  return /^\s*(<!doctype html|<html|<head|<body)/i.test(body || '');
}

module.exports = { pass, fail, warn, info, errorResult, maxSeverity, parseCsp, header, looksLikeHtml, SEVERITY_RANK };
