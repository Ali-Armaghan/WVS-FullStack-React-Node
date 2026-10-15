import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiClock } from 'react-icons/fi'
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

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Scan History</h1>
          <p className="muted">{data ? `${data.total} scan(s) stored` : 'Previously scanned websites'}</p>
        </div>
        <Link to="/" className="btn btn-primary">
          New Scan
        </Link>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by URL"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search by URL"
          />
        </div>
        <select
          value={risk}
          onChange={(e) => {
            setRisk(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by risk"
        >
          <option value="">All risk levels</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
          <option value="Informational">Informational</option>
        </select>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {!data && !error && <Loader label="Loading history..." />}

      {data && data.items.length === 0 && (
        <div className="empty-state card">
          <FiClock className="empty-icon" aria-hidden="true" />
          <h3>{isFiltered ? 'No scans match your filters' : 'No scans yet'}</h3>
          <p className="muted">{isFiltered ? 'Try a different search or risk level.' : 'Scan a website to see it here.'}</p>
          {!isFiltered && (
            <Link to="/" className="btn btn-primary">
              Scan a website
            </Link>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <HistoryTable items={data.items} onDownload={handleDownload} onDelete={setToDelete} downloadingId={downloadingId} />
          {data.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
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
        title="Delete scan?"
        message={toDelete ? `This permanently deletes the scan of ${toDelete.websiteUrl} and its report.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        busy={deleting}
      />
    </div>
  )
}
