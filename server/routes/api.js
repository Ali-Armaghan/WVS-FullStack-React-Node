const { Router } = require('express');
const config = require('../config');
const { databaseStatus } = require('../database');
const { createScan } = require('../controllers/scanController');
const { getReport, downloadPdf } = require('../controllers/reportController');
const { listHistory, deleteHistory } = require('../controllers/historyController');
const validateScanRequest = require('../middleware/validateScanRequest');
const validateObjectId = require('../middleware/validateObjectId');
const { scanLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.get('/health', (req, res) => {
  const database = databaseStatus();
  res.status(database === 'connected' ? 200 : 503).json({
    success: database === 'connected',
    data: { status: database === 'connected' ? 'ok' : 'degraded', uptime: process.uptime(), database, version: config.version }
  });
});

router.post('/scan', scanLimiter, validateScanRequest, createScan);
router.get('/report/:id', validateObjectId, getReport);
router.get('/history', listHistory);
router.delete('/history/:id', validateObjectId, deleteHistory);
router.get('/download/:id', validateObjectId, downloadPdf);

module.exports = router;
