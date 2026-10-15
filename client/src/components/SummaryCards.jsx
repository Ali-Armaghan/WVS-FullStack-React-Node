import { FiAlertTriangle, FiCheckCircle, FiShield, FiXCircle } from 'react-icons/fi'
import { SEVERITY_ORDER } from '../utils/format.js'

export default function SummaryCards({ report }) {
  const counts = report.severityCounts || {}
  const totalFindings = SEVERITY_ORDER.reduce((sum, s) => sum + (counts[s] || 0), 0)

  // Circular gauge calculations (radius = 32, circumference = 2 * PI * 32 ~= 201)
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const scorePercent = Math.max(0, Math.min(100, report.score || 0))
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference

  const gradeClass = `grade-${report.grade?.toLowerCase() || 'a'}`

  const strokeColor =
    report.grade === 'A'
      ? '#059669'
      : report.grade === 'B'
        ? '#0284c7'
        : report.grade === 'C'
          ? '#d97706'
          : report.grade === 'D'
            ? '#ea580c'
            : '#dc2626'

  return (
    <>
      <div className="summary-kpi-grid">
        {/* KPI 1: Security Score */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Security Posture</span>
            <div className="kpi-icon-pill" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <FiShield aria-hidden="true" />
            </div>
          </div>
          <div className="score-widget">
            <div className="score-circular-gauge">
              <svg viewBox="0 0 76 76" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="38" cy="38" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="none" />
                <circle
                  cx="38"
                  cy="38"
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className={`score-grade-badge ${gradeClass}`} style={{ position: 'absolute' }}>
                {report.grade}
              </span>
            </div>
            <div className="score-number-box">
              <strong>{report.score} / 100</strong>
              <span>Security Index</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Overall Risk */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Overall Risk</span>
            <div
              className="kpi-icon-pill"
              style={{
                background: report.overallRisk === 'High' ? '#fee2e2' : report.overallRisk === 'Medium' ? '#fef3c7' : '#ecfdf5',
                color: report.overallRisk === 'High' ? '#dc2626' : report.overallRisk === 'Medium' ? '#d97706' : '#059669'
              }}
            >
              <FiAlertTriangle aria-hidden="true" />
            </div>
          </div>
          <div className="kpi-value-huge" style={{ color: strokeColor }}>
            {report.overallRisk}
          </div>
          <div className="kpi-subtext">Highest severity threat identified</div>
        </div>

        {/* KPI 3: Passed Probes */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Passed Checks</span>
            <div className="kpi-icon-pill" style={{ background: '#ecfdf5', color: '#059669' }}>
              <FiCheckCircle aria-hidden="true" />
            </div>
          </div>
          <div className="kpi-value-huge" style={{ color: '#059669' }}>
            {report.passedChecks}
          </div>
          <div className="kpi-subtext">of {report.totalChecks} automated security probes passed</div>
        </div>

        {/* KPI 4: Failed Probes */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Identified Weaknesses</span>
            <div className="kpi-icon-pill" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <FiXCircle aria-hidden="true" />
            </div>
          </div>
          <div className="kpi-value-huge" style={{ color: report.failedChecks > 0 ? '#dc2626' : '#059669' }}>
            {report.failedChecks}
          </div>
          <div className="kpi-subtext">
            {report.errorChecks ? `${report.errorChecks} checks incomplete` : 'misconfigurations or vulnerabilities'}
          </div>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      <div className="severity-card">
        <div className="severity-card-head">
          <h3>Vulnerability Distribution by Severity</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {totalFindings} Finding(s) Flagged
          </span>
        </div>

        <div className="stacked-severity-rail" aria-hidden="true">
          {totalFindings === 0 ? (
            <div className="sev-seg-none" style={{ width: '100%' }} title="All checks passed" />
          ) : (
            SEVERITY_ORDER.map((s) =>
              counts[s] ? (
                <div
                  key={s}
                  className={`sev-seg-${s.toLowerCase()}`}
                  style={{ width: `${(counts[s] / totalFindings) * 100}%` }}
                  title={`${s}: ${counts[s]}`}
                />
              ) : null
            )
          )}
        </div>

        <ul className="severity-legend-grid">
          {SEVERITY_ORDER.map((s) => (
            <li key={s} className="severity-legend-item">
              <span
                className="legend-badge"
                style={{
                  background:
                    s === 'High'
                      ? 'var(--sev-high)'
                      : s === 'Medium'
                        ? 'var(--sev-medium)'
                        : s === 'Low'
                          ? 'var(--sev-low)'
                          : 'var(--sev-info)'
                }}
              />
              <span>{s}:</span>
              <strong>{counts[s] || 0}</strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
