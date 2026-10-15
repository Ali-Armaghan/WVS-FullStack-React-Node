import { SEVERITY_ORDER } from '../utils/format.js'

export default function SummaryCards({ report }) {
  const counts = report.severityCounts || {}
  const totalFindings = SEVERITY_ORDER.reduce((sum, s) => sum + (counts[s] || 0), 0)

  return (
    <>
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Security Score</span>
          <div className={`score-ring grade-${report.grade?.toLowerCase()}`}>
            <strong>{report.score}</strong>
            <span>Grade {report.grade}</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-label">Overall Risk</span>
          <strong className={`summary-value risk-text-${report.overallRisk?.toLowerCase()}`}>{report.overallRisk}</strong>
          <span className="muted small">Highest severity found</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Passed Checks</span>
          <strong className="summary-value text-pass">{report.passedChecks}</strong>
          <span className="muted small">of {report.totalChecks} checks</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Failed Checks</span>
          <strong className="summary-value text-fail">{report.failedChecks}</strong>
          <span className="muted small">
            {report.errorChecks ? `${report.errorChecks} not completed` : `of ${report.totalChecks} checks`}
          </span>
        </div>
      </div>

      <div className="card severity-breakdown">
        <div className="severity-breakdown-header">
          <h3>Findings by severity</h3>
          <span className="muted small">{totalFindings} finding(s)</span>
        </div>
        <div className="severity-bar" aria-hidden="true">
          {totalFindings === 0 ? (
            <div className="sev-bg-none" style={{ width: '100%' }} />
          ) : (
            SEVERITY_ORDER.map((s) =>
              counts[s] ? (
                <div key={s} className={`sev-bg-${s.toLowerCase()}`} style={{ width: `${(counts[s] / totalFindings) * 100}%` }} />
              ) : null,
            )
          )}
        </div>
        <ul className="severity-legend">
          {SEVERITY_ORDER.map((s) => (
            <li key={s}>
              <span className={`legend-dot sev-bg-${s.toLowerCase()}`} />
              {s}: <strong>{counts[s] || 0}</strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
