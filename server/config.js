require('dotenv').config({ quiet: true });

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

module.exports = {
  port: int(process.env.PORT, 5000),
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  mongoUri: process.env.MONGODB_URI || '',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  scanRateLimitMax: int(process.env.SCAN_RATE_LIMIT_MAX, 10),
  scanRateLimitWindowMin: int(process.env.SCAN_RATE_LIMIT_WINDOW_MIN, 15),
  requestTimeoutMs: int(process.env.REQUEST_TIMEOUT_MS, 8000),
  scanTimeoutMs: int(process.env.SCAN_TIMEOUT_MS, 45000),
  checkTimeoutMs: 10000,
  maxRedirects: 5,
  maxBodyBytes: 1024 * 1024,
  allowedPorts: (process.env.ALLOWED_PORTS || '80,443,8080,8443')
    .split(',')
    .map((p) => parseInt(p, 10))
    .filter(Number.isFinite),
  userAgent: 'WVS-Scanner/1.0 (+educational security scanner)',
  version: '1.0.0'
};
