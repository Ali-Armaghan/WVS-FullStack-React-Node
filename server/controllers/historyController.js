const ScanHistory = require('../models/ScanHistory');
const ScanReport = require('../models/ScanReport');
const AppError = require('../utils/AppError');

const RISKS = ['High', 'Medium', 'Low', 'Informational'];
const STATUSES = ['completed', 'failed'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function listHistory(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const filter = {};
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    filter.websiteUrl = { $regex: escapeRegex(req.query.search.trim().slice(0, 200)), $options: 'i' };
  }
  if (RISKS.includes(req.query.risk)) filter.overallRisk = req.query.risk;
  if (STATUSES.includes(req.query.status)) filter.scanStatus = req.query.status;

  const [items, total] = await Promise.all([
    ScanHistory.find(filter).sort({ scanDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ScanHistory.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  });
}

async function deleteHistory(req, res) {
  const entry = await ScanHistory.findById(req.params.id);
  if (!entry) throw new AppError('NOT_FOUND', 'History entry not found.', 404);

  if (entry.reportId) await ScanReport.findByIdAndDelete(entry.reportId);
  await entry.deleteOne();

  res.json({ success: true, data: { id: entry._id }, message: 'Scan deleted' });
}

module.exports = { listHistory, deleteHistory };
