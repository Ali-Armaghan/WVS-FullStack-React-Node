import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiClock, FiShield, FiPlus, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import HistoryTable from '../components/HistoryTable.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import Loader from '../components/Loader.jsx'
import { getHistory, deleteHistory, downloadReportPdf, getErrorMessage } from '../services/api.js'

const LIMIT = 10

export default function History() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    try {
      const result = await getHistory({ page, limit: LIMIT, search: search || undefined, risk: risk || undefined })
      setData(result)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [page, search, risk])

  useEffect(() => {
    load()
  }, [load])

  const handleDownload = async (item) => {
    setDownloadingId(item.reportId)
    try {
      await downloadReportPdf(item.reportId)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDownloadingId(null)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteHistory(toDelete._id)
      setToDelete(null)
      if (data.items.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (err) {
      setError(getErrorMessage(err))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const isFiltered = !!(search || risk)

  const highRiskCount = data?.items?.filter((i) => i.overallRisk === 'High').length || 0
  const completedCount = data?.items?.filter((i) => i.scanStatus === 'completed').length || 0

  return (
    <div className="container">
      <div className="page-header-row">
        <div>
          <h1>Historical Vulnerability Audits</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
            {data ? `${data.total} recorded assessment(s) in repository` : 'Previously scanned websites and logs'}
          </p>
        </div>
        <Link to="/" className="btn-scan" style={{ padding: '0.7rem 1.4rem', textDecoration: 'none' }}>
          <FiPlus aria-hidden="true" />
          <span>New Assessment</span>
        </Link>
      </div>

      {data && (
        <div className="audit-stats-bar">
          <div className="audit-stat-card">
            <span>Total Stored Scans</span>
            <strong>{data.total}</strong>
          </div>
          <div className="audit-stat-card">
            <span>Completed Audits</span>
            <strong style={{ color: '#059669' }}>{completedCount}</strong>
          </div>
          <div className="audit-stat-card">
            <span>High Risk Targets</span>
            <strong style={{ color: highRiskCount > 0 ? '#dc2626' : 'var(--text-main)' }}>
              {highRiskCount}
            </strong>
          </div>
        </div>
      )}

      <div className="history-toolbar">
        <div className="search-command-input">
          <FiSearch style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search audits by target URL..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search by URL"
          />
        </div>

        <select
          className="risk-filter-select"
          value={risk}
          onChange={(e) => {
            setRisk(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by risk"
        >
          <option value="">All Risk Levels</option>
          <option value="High">High Severity</option>
          <option value="Medium">Medium Severity</option>
          <option value="Low">Low Severity</option>
          <option value="Informational">Informational</option>
        </select>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {!data && !error && <Loader label="Loading audit repository..." />}

      {data && data.items.length === 0 && (
        <div className="empty-audit-card">
          <FiClock className="empty-radar-icon" aria-hidden="true" />
          <h3>{isFiltered ? 'No audits match your active filters' : 'No scans recorded yet'}</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            {isFiltered
              ? 'Try adjusting your search criteria or resetting the risk dropdown.'
              : 'Launch a security reconnaissance scan from the home console to view stored audit reports.'}
          </p>
          {!isFiltered && (
            <Link to="/" className="btn-scan" style={{ padding: '0.75rem 1.6rem', display: 'inline-flex' }}>
              Launch New Scan
            </Link>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <HistoryTable
            items={data.items}
            onDownload={handleDownload}
            onDelete={setToDelete}
            downloadingId={downloadingId}
          />
          {data.totalPages > 1 && (
            <nav className="pagination-nav" aria-label="Pagination">
              <button
                type="button"
                className="btn-page"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                className="btn-page"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete vulnerability audit?"
        message={
          toDelete
            ? `This will permanently delete the assessment report and historical entry for ${toDelete.websiteUrl}.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        busy={deleting}
      />
    </div>
  )
}
