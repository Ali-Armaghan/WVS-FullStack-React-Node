const ScanReport = require('../models/ScanReport');
const AppError = require('../utils/AppError');
const { generatePdf } = require('../pdfGenerator');

async function findReport(id) {
  const report = await ScanReport.findById(id).lean();
  if (!report) throw new AppError('NOT_FOUND', 'Report not found.', 404);
  return report;
}

async function getReport(req, res) {
  const report = await findReport(req.params.id);
  res.json({ success: true, data: report });
}

async function downloadPdf(req, res) {
  const report = await findReport(req.params.id);
  let host = 'website';
  try {
    host = new URL(report.websiteUrl).hostname.replace(/[^a-z0-9.-]/gi, '_');
  } catch {
    /* keep default */
  }
  const date = new Date(report.scanDate).toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="WVS-Report-${host}-${date}.pdf"`);
  generatePdf(report, res);
}

module.exports = { getReport, downloadPdf };
