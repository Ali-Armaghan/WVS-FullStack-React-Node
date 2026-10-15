import { Link } from 'react-router-dom'
import { FiEye, FiDownload, FiTrash2 } from 'react-icons/fi'
import SeverityBadge from './SeverityBadge.jsx'
import { formatDate } from '../utils/format.js'

export default function HistoryTable({ items, onDownload, onDelete, downloadingId }) {
  return (
    <div className="table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th scope="col">Website</th>
            <th scope="col">Date</th>
            <th scope="col">Status</th>
            <th scope="col">Risk</th>
            <th scope="col">Score</th>
            <th scope="col" className="right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td data-label="Website" className="url-cell">
                {item.reportId ? <Link to={`/report/${item.reportId}`}>{item.websiteUrl}</Link> : item.websiteUrl}
                {item.errorMessage && <span className="muted small block">{item.errorMessage}</span>}
              </td>
              <td data-label="Date">{formatDate(item.scanDate)}</td>
              <td data-label="Status">
                <span className={`status-pill ${item.scanStatus}`}>{item.scanStatus === 'completed' ? 'Completed' : 'Failed'}</span>
              </td>
              <td data-label="Risk">{item.overallRisk ? <SeverityBadge severity={item.overallRisk} /> : '-'}</td>
              <td data-label="Score">{item.score !== undefined && item.score !== null ? `${item.score} (${item.grade})` : '-'}</td>
              <td data-label="Actions" className="right">
                <div className="row-actions">
                  {item.reportId && (
                    <>
                      <Link to={`/report/${item.reportId}`} className="icon-btn" title="View report" aria-label="View report">
                        <FiEye />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Download PDF"
                        aria-label="Download PDF"
                        onClick={() => onDownload(item)}
                        disabled={downloadingId === item.reportId}
                      >
                        <FiDownload />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Delete"
                    aria-label="Delete scan"
                    onClick={() => onDelete(item)}
                  >
                    <FiTrash2 />
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
