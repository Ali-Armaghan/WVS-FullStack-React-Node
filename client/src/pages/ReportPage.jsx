import { useEffect, useState } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import Report from '../components/Report.jsx'
import Loader from '../components/Loader.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { getReport, getErrorMessage } from '../services/api.js'

export default function ReportPage() {
  const { id } = useParams()
  const location = useLocation()
  const initial = location.state?.report?._id === id ? location.state.report : null

  const [state, setState] = useState({ id: initial ? id : null, report: initial, error: '' })
  const { report, error } = state.id === id ? state : { report: null, error: '' }

  useEffect(() => {
    if (state.id === id) return
    let cancelled = false
    getReport(id)
      .then((data) => !cancelled && setState({ id, report: data, error: '' }))
      .catch((err) => !cancelled && setState({ id, report: null, error: getErrorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [id, state.id])

  return (
    <div className="container">
      {error ? (
        <div className="empty-state">
          <ErrorAlert message={error} />
          <Link to="/" className="btn btn-primary">
            Start a new scan
          </Link>
        </div>
      ) : report ? (
        <Report report={report} />
      ) : (
        <Loader label="Loading report..." />
      )}
    </div>
  )
}
