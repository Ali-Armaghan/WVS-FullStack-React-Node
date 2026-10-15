import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLock, FiLayers, FiFileText, FiDatabase } from 'react-icons/fi'
import ScanForm from '../components/ScanForm.jsx'
import ScanProgress from '../components/ScanProgress.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { scanWebsite, getErrorMessage } from '../services/api.js'
import { hostOf } from '../utils/format.js'

const FEATURES = [
  { icon: FiLock, title: 'HTTPS & TLS', text: 'HTTPS redirects, certificate validity, expiry and TLS version.' },
  { icon: FiLayers, title: 'Security headers', text: 'HSTS, CSP, X-Frame-Options, Referrer and Permissions policies.' },
  { icon: FiDatabase, title: 'Configuration', text: 'Cookies, CORS, server disclosure, directory listing, HTTP methods.' },
  { icon: FiFileText, title: 'PDF reports', text: 'Severity-ranked findings with fixes, saved to your scan history.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(null)
  const [error, setError] = useState('')

  const handleScan = async (url) => {
    setError('')
    setScanning(url)
    try {
      const report = await scanWebsite(url)
      navigate(`/report/${report._id}`, { state: { report } })
    } catch (err) {
      setError(getErrorMessage(err))
      setScanning(null)
    }
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>Website Vulnerability Scanner</h1>
        <p className="hero-sub">
          Check any public website for 15 common security weaknesses and misconfigurations, and get a clear report with
          fixes in seconds.
        </p>
        <ScanForm onScan={handleScan} loading={!!scanning} />
        <ErrorAlert message={error} onClose={() => setError('')} />
      </section>

      {scanning ? (
        <ScanProgress url={hostOf(scanning)} />
      ) : (
        <section className="features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="feature card">
              <Icon className="feature-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
