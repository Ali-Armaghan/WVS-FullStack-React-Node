import { useMemo, useState } from 'react'
import { FiDownload, FiExternalLink, FiClock, FiCalendar } from 'react-icons/fi'
import SummaryCards from './SummaryCards.jsx'
import CheckCard from './CheckCard.jsx'
import ErrorAlert from './ErrorAlert.jsx'
import { downloadReportPdf, getErrorMessage } from '../services/api.js'
import { CHECK_GROUPS, formatDate, formatDuration } from '../utils/format.js'

const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'issues', label: 'Failed', match: (c) => c.status === 'fail' || c.status === 'warning' },
  { id: 'passed', label: 'Passed', match: (c) => c.status === 'pass' || c.status === 'info' },
  { id: 'High', label: 'High', match: (c) => c.severity === 'High' },
  { id: 'Medium', label: 'Medium', match: (c) => c.severity === 'Medium' },
  { id: 'Low', label: 'Low', match: (c) => c.severity === 'Low' },
  { id: 'Informational', label: 'Info', match: (c) => c.severity === 'Informational' },
]

export default function Report({ report }) {
  const [filter, setFilter] = useState('all')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, report.checks.filter(f.match).length])),
    [report.checks],
  )

  const visible = report.checks.filter(FILTERS.find((f) => f.id === filter).match)

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError('')
    try {
      await downloadReportPdf(report._id)
    } catch (err) {
      setDownloadError(getErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="report">
      <div className="report-header card">
        <div>
          <p className="eyebrow">Vulnerability Report</p>
          <h1 className="report-url">
            <a href={report.finalUrl || report.websiteUrl} target="_blank" rel="noopener noreferrer">
              {report.websiteUrl} <FiExternalLink aria-hidden="true" />
            </a>
          </h1>
          <p className="report-meta muted">
            <span>
              <FiCalendar aria-hidden="true" /> {formatDate(report.scanDate)}
            </span>
            <span>
              <FiClock aria-hidden="true" /> {formatDuration(report.durationMs)}
            </span>
            {report.finalUrl && report.finalUrl !== report.websiteUrl && <span>Redirected to {report.finalUrl}</span>}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
          <FiDownload aria-hidden="true" /> {downloading ? 'Preparing PDF...' : 'Download PDF'}
        </button>
      </div>
      {downloadError && <ErrorAlert message={downloadError} onClose={() => setDownloadError('')} />}

      <SummaryCards report={report} />

      <div className="filter-bar" role="toolbar" aria-label="Filter checks">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            disabled={counts[f.id] === 0 && f.id !== 'all'}
          >
            {f.label} <span className="chip-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {CHECK_GROUPS.map((group) => {
        const checks = visible.filter((c) => group.ids.includes(c.checkId))
        if (!checks.length) return null
        return (
          <div key={group.title} className="check-group">
            <h3>{group.title}</h3>
            {checks.map((check) => (
              <CheckCard key={check.checkId} check={check} />
            ))}
          </div>
        )
      })}
      {!visible.length && <p className="muted center">No checks match this filter.</p>}

      {report.recommendations?.length > 0 && (
        <div className="card recommendations">
          <h3>Recommendations</h3>
          <ol>
            {report.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
