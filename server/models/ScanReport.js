const { Schema, model } = require('mongoose');

const SEVERITIES = ['High', 'Medium', 'Low', 'Informational', 'None'];

const CheckResultSchema = new Schema(
  {
    checkId: { type: Number, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['transport', 'headers', 'cookies', 'cors', 'disclosure', 'configuration']
    },
    status: { type: String, enum: ['pass', 'fail', 'warning', 'info', 'error'], required: true },
    severity: { type: String, enum: SEVERITIES, default: 'None' },
    description: String,
    finding: String,
    evidence: Schema.Types.Mixed,
    recommendation: String,
    references: [String]
  },
  { _id: false }
);

const ScanReportSchema = new Schema(
  {
    websiteUrl: { type: String, required: true, index: true },
    finalUrl: String,
    scanDate: { type: Date, default: Date.now, index: true },
    durationMs: Number,
    totalChecks: { type: Number, default: 15 },
    passedChecks: Number,
    failedChecks: Number,
    errorChecks: Number,
    severityCounts: {
      High: { type: Number, default: 0 },
      Medium: { type: Number, default: 0 },
      Low: { type: Number, default: 0 },
      Informational: { type: Number, default: 0 }
    },
    score: { type: Number, min: 0, max: 100 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'] },
    overallRisk: { type: String, enum: ['High', 'Medium', 'Low', 'Informational'] },
    checks: [CheckResultSchema],
    vulnerabilities: [CheckResultSchema],
    recommendations: [String],
    pdfReport: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = model('ScanReport', ScanReportSchema);
