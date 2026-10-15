import { useMemo, useState } from 'react'
import {
  FiDownload,
  FiExternalLink,
  FiClock,
  FiCalendar,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiLayers,
  FiLock,
  FiDatabase,
  FiTerminal
} from 'react-icons/fi'
import SummaryCards from './SummaryCards.jsx'
import CheckCard from './CheckCard.jsx'
import ErrorAlert from './ErrorAlert.jsx'
import { downloadReportPdf, getErrorMessage } from '../services/api.js'
import { CHECK_GROUPS, formatDate, formatDuration } from '../utils/format.js'

const FILTERS = [
  { id: 'all', label: 'All Checks', match: () => true },
  { id: 'issues', label: 'Weaknesses', match: (c) => c.status === 'fail' || c.status === 'warning' },
  { id: 'passed', label: 'Passed', match: (c) => c.status === 'pass' || c.status === 'info' },
  { id: 'High', label: 'High Severity', match: (c) => c.severity === 'High' },
  { id: 'Medium', label: 'Medium Severity', match: (c) => c.severity === 'Medium' },
  { id: 'Low', label: 'Low Severity', match: (c) => c.severity === 'Low' },
  { id: 'Informational', label: 'Info Only', match: (c) => c.severity === 'Informational' }
]

const GROUP_ICONS = {
  'Transport Security': FiLock,
  'Security Headers': FiShield,
  'Cookies & CORS': FiDatabase,
  'Information Disclosure & Configuration': FiTerminal
}

export default function Report({ report }) {
  const [filter, setFilter] = useState('all')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, report.checks.filter(f.match).length])),
    [report.checks]
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
      {/* Header Panel */}
      <div className="report-header-panel">
        <div className="report-title-area">
          <p className="eyebrow">AUTOMATED RECONNAISSANCE AUDIT</p>
          <h1 className="report-target-url">
            <a href={report.finalUrl || report.websiteUrl} target="_blank" rel="noopener noreferrer">
              <span>{report.websiteUrl}</span>
              <FiExternalLink aria-hidden="true" style={{ fontSize: '1.2rem', color: '#0284c7' }} />
            </a>
          </h1>
          <div className="report-meta-tags">
            <span className="report-meta-item">
              <FiCalendar aria-hidden="true" />
              <span>{formatDate(report.scanDate)}</span>
            </span>
            <span className="report-meta-item">
              <FiClock aria-hidden="true" />
              <span>Duration: {formatDuration(report.durationMs)}</span>
            </span>
            {report.finalUrl && report.finalUrl !== report.websiteUrl && (
              <span className="report-meta-item" style={{ color: '#0284c7' }}>
                <FiCheckCircle aria-hidden="true" />
                <span>Redirected to {report.finalUrl}</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn-export-pdf"
          onClick={handleDownload}
          disabled={downloading}
          title="Download formal vulnerability assessment as PDF"
        >
          <FiDownload aria-hidden="true" />
          <span>{downloading ? 'Compiling PDF...' : 'Download Official PDF'}</span>
        </button>
      </div>

      {downloadError && <ErrorAlert message={downloadError} onClose={() => setDownloadError('')} />}

      {/* Summary KPI Gauge & Severity Bar */}
      <SummaryCards report={report} />

      {/* Filter Toolbar */}
      <div className="filter-toolbar" role="toolbar" aria-label="Filter checks">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip-filter ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            disabled={counts[f.id] === 0 && f.id !== 'all'}
          >
            <span>{f.label}</span>
            <span className="chip-badge-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Grouped Check Cards */}
      {CHECK_GROUPS.map((group) => {
        const checks = visible.filter((c) => group.ids.includes(c.checkId))
        if (!checks.length) return null
        const GroupIcon = GROUP_ICONS[group.title] || FiShield

        return (
          <div key={group.title} className="check-group">
            <div className="check-group-header">
              <GroupIcon className="group-icon" aria-hidden="true" />
              <h3>{group.title}</h3>
            </div>
            {checks.map((check) => (
              <CheckCard key={check.checkId} check={check} />
            ))}
          </div>
        )
      })}

      {!visible.length && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No checks match this filter criteria.</p>
        </div>
      )}

      {/* Priority Recommendations Box */}
      {report.recommendations?.length > 0 && (
        <div className="recommendations-panel">
          <h3>
            <FiShield aria-hidden="true" style={{ color: '#0284c7' }} />
            <span>Priority Security Action Items</span>
          </h3>
          <ul className="recommendations-list">
            {report.recommendations.map((rec, index) => (
              <li key={rec} className="rec-item">
                <span className="rec-badge-number">{index + 1}</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
