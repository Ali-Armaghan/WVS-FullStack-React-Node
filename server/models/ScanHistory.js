const { Schema, model } = require('mongoose');

const ScanHistorySchema = new Schema(
  {
    websiteUrl: { type: String, required: true, index: true },
    scanDate: { type: Date, default: Date.now, index: true },
    scanStatus: { type: String, enum: ['completed', 'failed'], required: true },
    reportId: { type: Schema.Types.ObjectId, ref: 'ScanReport', default: null },
    overallRisk: String,
    score: Number,
    grade: String,
    errorMessage: String
  },
  { timestamps: true }
);

ScanHistorySchema.index({ scanDate: -1 });

module.exports = model('ScanHistory', ScanHistorySchema, 'scanhistory');
