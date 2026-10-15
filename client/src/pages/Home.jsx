import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiLock,
  FiShield,
  FiDatabase,
  FiFileText,
  FiCheckCircle,
  FiCpu,
  FiLayers,
  FiTerminal,
  FiGlobe
} from 'react-icons/fi'
import ScanForm from '../components/ScanForm.jsx'
import ScanProgress from '../components/ScanProgress.jsx'
import { scanWebsite, getErrorMessage } from '../services/api.js'
import { hostOf } from '../utils/format.js'

const BENTO_FEATURES = [
  {
    icon: FiLock,
    title: 'Transport Security & Cryptography',
    text: 'Validates strict HTTPS enforcement, automatic 301 upgrades, SSL/TLS certificate chains, SAN coverage, expiry, and deprecation of legacy TLS 1.0/1.1.',
    tags: ['HTTPS Redirection', 'TLS 1.3 / 1.2', 'SAN Matching', 'Certificate Validity']
  },
  {
    icon: FiShield,
    title: 'Modern Defense Headers',
    text: 'Audits essential browser security headers including Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), Clickjacking defenses, and Permissions Policy.',
    tags: ['HSTS Preload', 'CSP Evaluation', 'X-Frame-Options', 'Referrer-Policy']
  },
  {
    icon: FiDatabase,
    title: 'Cookies & Origin Security',
    text: 'Deep inspection of Set-Cookie security flags (Secure, HttpOnly, SameSite) and cross-origin resource sharing (CORS) probes for credentials leakage.',
    tags: ['SameSite Flags', 'HttpOnly Guard', 'CORS Origin Probe', 'Credential Exposure']
  },
  {
    icon: FiTerminal,
    title: 'Reconnaissance & Server Hygiene',
    text: 'Detects sensitive server header leakage, open directory indexing vulnerabilities, dangerous HTTP methods (TRACE/TRACK), robots.txt exposure, and RFC 9116 security.txt.',
    tags: ['Banner Disclosure', 'Directory Listing', 'TRACE Probing', 'RFC 9116 security.txt']
  }
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
        <div className="hero-eyebrow">
          <FiShield aria-hidden="true" />
          <span>Automated Non-Intrusive Threat Assessment</span>
        </div>

        <h1>
          Website Vulnerability <span className="hero-gradient-text">Scanner</span>
        </h1>

        <p className="hero-sub">
          Execute 15 automated, passive security checks against any public web service. Receive an instant risk-graded
          report with evidence and remediation fixes in seconds.
        </p>

        <ScanForm
          onScan={handleScan}
          loading={!!scanning}
          serverError={error}
          onClearError={() => setError('')}
        />

        <div className="trust-bar">
          <div className="trust-item">
            <FiCheckCircle aria-hidden="true" />
            <span>15 Autonomous Probes</span>
          </div>
          <div className="trust-item">
            <FiGlobe aria-hidden="true" />
            <span>SSRF Air-Gapped</span>
          </div>
          <div className="trust-item">
            <FiCpu aria-hidden="true" />
            <span>Zero Exploitation Risk</span>
          </div>
          <div className="trust-item">
            <FiFileText aria-hidden="true" />
            <span>Instant PDF Reports</span>
          </div>
        </div>
      </section>

      {scanning ? (
        <ScanProgress url={hostOf(scanning)} />
      ) : (
        <section className="capabilities-section">
          <div className="section-head">
            <span className="section-eyebrow">Comprehensive Coverage</span>
            <h2>Enterprise Security Probes</h2>
          </div>

          <div className="bento-grid">
            {BENTO_FEATURES.map(({ icon: Icon, title, text, tags }) => (
              <div key={title} className="bento-card">
                <div className="bento-icon-wrapper">
                  <Icon aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="bento-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="bento-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
