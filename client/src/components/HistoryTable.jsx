import { Link } from 'react-router-dom'
import { FiEye, FiDownload, FiTrash2, FiGlobe, FiAlertCircle } from 'react-icons/fi'
import SeverityBadge from './SeverityBadge.jsx'
import { formatDate } from '../utils/format.js'

export default function HistoryTable({ items, onDownload, onDelete, downloadingId }) {
  return (
    <div className="table-panel">
      <table className="history-table">
        <thead>
          <tr>
            <th scope="col">Target Domain</th>
            <th scope="col">Timestamp</th>
            <th scope="col">Audit Status</th>
            <th scope="col">Risk Level</th>
            <th scope="col">Score</th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td data-label="Target" className="url-cell">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiGlobe style={{ color: '#0284c7', flexShrink: 0 }} aria-hidden="true" />
                  {item.reportId ? (
                    <Link to={`/report/${item.reportId}`} title="View vulnerability report">
                      {item.websiteUrl}
                    </Link>
                  ) : (
                    <span>{item.websiteUrl}</span>
                  )}
                </div>
                {item.errorMessage && (
                  <span style={{ fontSize: '0.78rem', color: '#dc2626', display: 'block', marginTop: '3px' }}>
                    {item.errorMessage}
                  </span>
                )}
              </td>
              <td data-label="Timestamp" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {formatDate(item.scanDate)}
              </td>
              <td data-label="Status">
                <span className={`status-beacon ${item.scanStatus}`}>
                  <span className="beacon-dot" />
                  <span>{item.scanStatus === 'completed' ? 'Completed' : 'Failed'}</span>
                </span>
              </td>
              <td data-label="Risk">{item.overallRisk ? <SeverityBadge severity={item.overallRisk} /> : '-'}</td>
              <td data-label="Score">
                {item.score !== undefined && item.score !== null ? (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {item.score} <span style={{ color: 'var(--text-muted)' }}>({item.grade})</span>
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td data-label="Actions" style={{ textAlign: 'right' }}>
                <div className="action-buttons-group">
                  {item.reportId && (
                    <>
                      <Link
                        to={`/report/${item.reportId}`}
                        className="icon-action-btn"
                        title="View report"
                        aria-label="View report"
                      >
                        <FiEye aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className="icon-action-btn"
                        title="Download PDF"
                        aria-label="Download PDF"
                        onClick={() => onDownload(item)}
                        disabled={downloadingId === item.reportId}
                      >
                        <FiDownload aria-hidden="true" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="icon-action-btn btn-danger"
                    title="Delete audit entry"
                    aria-label="Delete scan entry"
                    onClick={() => onDelete(item)}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
