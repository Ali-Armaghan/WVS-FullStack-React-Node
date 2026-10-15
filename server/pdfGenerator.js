const PDFDocument = require('pdfkit');
const { SEVERITY_RANK } = require('./checks/helpers');

const COLORS = {
  High: '#dc2626',
  Medium: '#ea580c',
  Low: '#ca8a04',
  Informational: '#2563eb',
  None: '#16a34a',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  light: '#f3f4f6',
  dark: '#0f172a'
};
const STATUS_LABEL = { pass: 'Passed', fail: 'Failed', warning: 'Warning', info: 'Info', error: 'Not completed' };
const STATUS_COLOR = { pass: COLORS.None, fail: COLORS.High, warning: COLORS.Medium, info: COLORS.Informational, error: COLORS.muted };
const MARGIN = 50;

// Standard PDF fonts only support WinAnsi characters.
const clean = (value) =>
  String(value ?? '').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2022\u2013\u2014\u2018\u2019\u201C\u201D]/g, '?');

const contentWidth = (doc) => doc.page.width - MARGIN * 2;

function ensureSpace(doc, height) {
  if (doc.y + height > doc.page.height - MARGIN - 30) {
    doc.addPage();
    return true;
  }
  return false;
}

function sectionTitle(doc, title) {
  ensureSpace(doc, 70);
  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.text).text(clean(title), MARGIN);
  const y = doc.y + 3;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth(doc), y).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.y = y + 10;
}

function badge(doc, x, y, text, color) {
  doc.font('Helvetica-Bold').fontSize(8);
  const w = doc.widthOfString(text) + 12;
  doc.roundedRect(x, y, w, 15, 7).fill(color);
  doc.fillColor('#ffffff').text(text, x, y + 4, { width: w, align: 'center', lineBreak: false });
  return w;
}

function formatEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return '';
  const lines = [];
  for (const [key, value] of Object.entries(evidence)) {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) continue;
    let text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (text.length > 220) text = `${text.slice(0, 220)}...`;
    lines.push(`${key}: ${text}`);
    if (lines.length >= 12) break;
  }
  return lines.join('\n');
}

function drawHeader(doc, report) {
  doc.rect(0, 0, doc.page.width, 95).fill(COLORS.dark);
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
    .text('Website Vulnerability Scan Report', MARGIN, 28, { width: contentWidth(doc) });
  doc.font('Helvetica').fontSize(11).fillColor('#cbd5e1')
    .text(clean(report.websiteUrl), MARGIN, 56, { width: contentWidth(doc), lineBreak: false, ellipsis: true });

  doc.y = 115;
  const meta = [
    ['Scanned URL', report.websiteUrl],
    ['Final URL', report.finalUrl || report.websiteUrl],
    ['Scan date', new Date(report.scanDate).toUTCString()],
    ['Duration', `${((report.durationMs || 0) / 1000).toFixed(1)} seconds`],
    ['Report ID', String(report._id)]
  ];
  for (const [label, value] of meta) {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted).text(label, MARGIN, y, { width: 90 });
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.text).text(clean(value), MARGIN + 95, y, { width: contentWidth(doc) - 95 });
    doc.moveDown(0.3);
  }
}

function drawSummary(doc, report) {
  sectionTitle(doc, 'Executive Summary');

  const gap = 10;
  const boxW = (contentWidth(doc) - gap * 3) / 4;
  const boxH = 62;
  const y = doc.y;
  const boxes = [
    ['Security Score', `${report.score}/100`, `Grade ${report.grade}`, COLORS.text],
    ['Overall Risk', report.overallRisk, 'Highest severity found', COLORS[report.overallRisk]],
    ['Passed Checks', String(report.passedChecks), `of ${report.totalChecks}`, COLORS.None],
    ['Failed Checks', String(report.failedChecks), report.errorChecks ? `${report.errorChecks} not completed` : `of ${report.totalChecks}`, COLORS.High]
  ];
  boxes.forEach(([label, value, sub, color], i) => {
    const x = MARGIN + i * (boxW + gap);
    doc.roundedRect(x, y, boxW, boxH, 6).lineWidth(1).fillAndStroke(COLORS.light, COLORS.border);
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(label.toUpperCase(), x + 10, y + 9, { width: boxW - 20 });
    doc.font('Helvetica-Bold').fontSize(17).fillColor(color).text(clean(value), x + 10, y + 22, { width: boxW - 20 });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(clean(sub), x + 10, y + 45, { width: boxW - 20 });
  });
  doc.y = y + boxH + 14;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text('Findings by severity', MARGIN);
  doc.moveDown(0.4);
  let x = MARGIN;
  const rowY = doc.y;
  for (const sev of ['High', 'Medium', 'Low', 'Informational']) {
    x += badge(doc, x, rowY, `${sev}: ${report.severityCounts?.[sev] || 0}`, COLORS[sev]) + 8;
  }
  doc.y = rowY + 24;
  doc.x = MARGIN;
}

function drawTableHeader(doc, cols) {
  const y = doc.y;
  doc.rect(MARGIN, y, contentWidth(doc), 20).fill(COLORS.dark);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  let x = MARGIN;
  for (const col of cols) {
    doc.text(col.label, x + 6, y + 6, { width: col.width - 12, lineBreak: false });
    x += col.width;
  }
  doc.y = y + 20;
}

function drawFindingsTable(doc, report) {
  sectionTitle(doc, 'Security Checks Overview');
  const w = contentWidth(doc);
  const cols = [
    { label: '#', width: 30 },
    { label: 'Security Check', width: w - 30 - 90 - 100 },
    { label: 'Status', width: 90 },
    { label: 'Severity', width: 100 }
  ];
  drawTableHeader(doc, cols);

  report.checks.forEach((check, i) => {
    if (ensureSpace(doc, 20)) drawTableHeader(doc, cols);
    const y = doc.y;
    if (i % 2 === 1) doc.rect(MARGIN, y, w, 20).fill(COLORS.light);
    let x = MARGIN;
    const cells = [
      [String(check.checkId), COLORS.text, 'Helvetica'],
      [check.name, COLORS.text, 'Helvetica'],
      [STATUS_LABEL[check.status] || check.status, STATUS_COLOR[check.status] || COLORS.text, 'Helvetica-Bold'],
      [check.severity === 'None' ? '-' : check.severity, COLORS[check.severity] || COLORS.muted, 'Helvetica-Bold']
    ];
    cells.forEach(([text, color, font], c) => {
      doc.font(font).fontSize(9).fillColor(color)
        .text(clean(text), x + 6, y + 6, { width: cols[c].width - 12, lineBreak: false, ellipsis: true });
      x += cols[c].width;
    });
    doc.y = y + 20;
  });
  doc.x = MARGIN;
}

function labelled(doc, label, text, font = 'Helvetica', size = 9) {
  if (!text) return;
  ensureSpace(doc, 30);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted).text(label, MARGIN + 10);
  doc.font(font).fontSize(size).fillColor(COLORS.text).text(clean(text), MARGIN + 10, doc.y, { width: contentWidth(doc) - 20 });
  doc.moveDown(0.4);
}

function drawDetails(doc, report) {
  const findings = [...report.vulnerabilities].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.checkId - b.checkId
  );
  if (!findings.length) return;

  sectionTitle(doc, 'Detailed Findings');
  for (const f of findings) {
    ensureSpace(doc, 90);
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text)
      .text(clean(`${f.checkId}. ${f.name}`), MARGIN, y, { width: contentWidth(doc) - 110 });
    const titleBottom = doc.y;
    const label = f.severity;
    doc.font('Helvetica-Bold').fontSize(8);
    const bw = doc.widthOfString(label) + 12;
    badge(doc, MARGIN + contentWidth(doc) - bw, y, label, COLORS[f.severity] || COLORS.muted);
    doc.y = Math.max(titleBottom, y + 16) + 4;

    labelled(doc, 'Finding', f.finding);
    labelled(doc, 'Evidence', formatEvidence(f.evidence), 'Courier', 8);
    labelled(doc, 'Recommendation', f.recommendation);

    const sepY = doc.y + 2;
    doc.moveTo(MARGIN, sepY).lineTo(MARGIN + contentWidth(doc), sepY).lineWidth(0.5).strokeColor(COLORS.border).stroke();
    doc.y = sepY + 10;
  }
}

function drawList(doc, title, items, color) {
  if (!items.length) return;
  sectionTitle(doc, title);
  items.forEach((item) => {
    ensureSpace(doc, 20);
    doc.font('Helvetica').fontSize(9).fillColor(color || COLORS.text)
      .text(clean(item), MARGIN + 10, doc.y, { width: contentWidth(doc) - 20 });
    doc.moveDown(0.35);
  });
}

function drawFooters(doc, report) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 42;
    doc.moveTo(MARGIN, y - 6).lineTo(doc.page.width - MARGIN, y - 6).lineWidth(0.5).strokeColor(COLORS.border).stroke();
    doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
      .text('This automated assessment covers 15 common checks and is not a substitute for a full penetration test.', MARGIN, y, {
        width: contentWidth(doc),
        lineBreak: false
      });
    doc.text(`Generated by Website Vulnerability Scanner - ${new Date(report.scanDate).toISOString().slice(0, 10)}`, MARGIN, y + 11, {
      width: contentWidth(doc) - 80,
      lineBreak: false
    });
    doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - MARGIN - 80, y + 11, { width: 80, align: 'right', lineBreak: false });
    doc.page.margins.bottom = bottomMargin;
  }
}

/** Writes the PDF for a report document into a writable stream (e.g. an Express response). */
function generatePdf(report, stream) {
  const host = (() => {
    try {
      return new URL(report.websiteUrl).hostname;
    } catch {
      return report.websiteUrl;
    }
  })();

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    bufferPages: true,
    info: { Title: `Vulnerability Report - ${host}`, Author: 'Website Vulnerability Scanner' }
  });
  doc.pipe(stream);

  drawHeader(doc, report);
  drawSummary(doc, report);
  drawFindingsTable(doc, report);
  drawDetails(doc, report);
  drawList(doc, 'Passed Checks', report.checks.filter((c) => c.status === 'pass').map((c) => `\u2022 ${c.name}: ${c.finding}`), COLORS.text);
  drawList(doc, 'Checks Not Completed', report.checks.filter((c) => c.status === 'error').map((c) => `\u2022 ${c.name}: ${c.finding}`), COLORS.muted);
  drawList(doc, 'Recommendations Summary', report.recommendations.map((r, i) => `${i + 1}. ${r}`));
  drawFooters(doc, report);

  doc.end();
  return doc;
}

module.exports = { generatePdf };
