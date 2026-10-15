const { runScan } = require('../scanner');
const { buildReport } = require('../reportGenerator');
const ScanReport = require('../models/ScanReport');
const ScanHistory = require('../models/ScanHistory');
const normalizeUrl = require('../utils/normalizeUrl');
const logger = require('../utils/logger');

// Failures caused by the target (not by bad input) are recorded in the history.
const RECORDED_FAILURES = ['DNS_FAILURE', 'TARGET_UNREACHABLE', 'TIMEOUT', 'TOO_MANY_REDIRECTS', 'BLOCKED_REDIRECT'];

async function recordFailure(rawUrl, err) {
  try {
    await ScanHistory.create({
      websiteUrl: normalizeUrl(rawUrl).href,
      scanStatus: 'failed',
      errorMessage: err.message
    });
  } catch (saveErr) {
    logger.warn('Could not record failed scan:', saveErr.message);
  }
}

async function createScan(req, res) {
  const { url } = req.body;

  let scan;
  try {
    scan = await runScan(url);
  } catch (err) {
    if (RECORDED_FAILURES.includes(err.code)) await recordFailure(url, err);
    throw err;
  }

  const report = await ScanReport.create(buildReport(scan));
  await ScanHistory.create({
    websiteUrl: report.websiteUrl,
    scanDate: report.scanDate,
    scanStatus: 'completed',
    reportId: report._id,
    overallRisk: report.overallRisk,
    score: report.score,
    grade: report.grade
  });

  res.status(201).json({ success: true, data: report, message: 'Scan completed' });
}

module.exports = { createScan };
