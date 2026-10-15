const { SEVERITY_RANK } = require('./checks/helpers');

const PENALTY = { High: 20, Medium: 10, Low: 4, Informational: 0, None: 0 };

function gradeFor(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// First line of a recommendation; keeps the example line when the first line introduces one.
function summarise(recommendation) {
  const lines = recommendation.split('\n');
  return lines[0].endsWith(':') && lines[1] ? `${lines[0]} ${lines[1]}` : lines[0];
}

function overallRiskFor(counts) {
  if (counts.High > 0) return 'High';
  if (counts.Medium > 0) return 'Medium';
  if (counts.Low > 0) return 'Low';
  return 'Informational';
}

/**
 * Turns raw check results into the report document stored in MongoDB.
 * Passed = pass + info; failed = fail + warning; errored checks count as neither.
 */
function buildReport({ websiteUrl, finalUrl, results, durationMs }) {
  const checks = [...results].sort((a, b) => a.checkId - b.checkId);
  const findings = checks.filter((c) => ['fail', 'warning', 'info'].includes(c.status));

  const severityCounts = { High: 0, Medium: 0, Low: 0, Informational: 0 };
  for (const f of findings) {
    if (f.severity in severityCounts) severityCounts[f.severity] += 1;
  }

  const penalty = findings.reduce((sum, f) => sum + (PENALTY[f.severity] || 0), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  const recommendations = findings
    .filter((f) => f.recommendation)
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.checkId - b.checkId)
    .map((f) => `[${f.severity}] ${f.name}: ${summarise(f.recommendation)}`);

  return {
    websiteUrl,
    finalUrl,
    scanDate: new Date(),
    durationMs,
    totalChecks: checks.length,
    passedChecks: checks.filter((c) => c.status === 'pass' || c.status === 'info').length,
    failedChecks: checks.filter((c) => c.status === 'fail' || c.status === 'warning').length,
    errorChecks: checks.filter((c) => c.status === 'error').length,
    severityCounts,
    score,
    grade: gradeFor(score),
    overallRisk: overallRiskFor(severityCounts),
    checks,
    vulnerabilities: findings,
    recommendations,
    pdfReport: null
  };
}

module.exports = { buildReport, gradeFor, overallRiskFor };
