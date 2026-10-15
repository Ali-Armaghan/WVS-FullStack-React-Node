import { useState, useEffect } from 'react'
import {
  FiSearch,
  FiLock,
  FiX,
  FiShield,
  FiCornerDownLeft,
  FiZap,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw
} from 'react-icons/fi'
import { validateUrl } from '../utils/validateUrl.js'

const QUICK_PRESETS = [
  { label: 'badssl.com (TLS Tests)', url: 'expired.badssl.com' },
  { label: 'github.com (Hardened)', url: 'github.com' },
  { label: 'example.com (Baseline)', url: 'example.com' },
]

export default function ScanForm({ onScan, loading, serverError, onClearError }) {
  const [url, setUrl] = useState('')
  const [consent, setConsent] = useState(false)
  const [clientError, setClientError] = useState('')
  const [touched, setTouched] = useState(false)

  // Clear server error whenever user changes input
  const handleChange = (e) => {
    setUrl(e.target.value)
    if (serverError && onClearError) onClearError()
    if (touched) {
      const result = validateUrl(e.target.value)
      setClientError(result.valid ? '' : result.error)
    }
  }

  const handleClear = () => {
    setUrl('')
    setClientError('')
    setTouched(false)
    if (serverError && onClearError) onClearError()
  }

  const handlePreset = (presetUrl) => {
    setUrl(presetUrl)
    setConsent(true)
    setClientError('')
    setTouched(false)
    if (serverError && onClearError) onClearError()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const result = validateUrl(url)
    if (!result.valid) {
      setClientError(result.error)
      return
    }
    setClientError('')
    if (serverError && onClearError) onClearError()
    onScan(result.url)
  }

  const activeError = serverError || clientError
  const isDnsOrUnreachable =
    activeError &&
    (activeError.toLowerCase().includes('could not be resolved') ||
      activeError.toLowerCase().includes('unreachable') ||
      activeError.toLowerCase().includes('timed out') ||
      activeError.toLowerCase().includes('private or internal'))

  return (
    <div className="scan-form">
      <form onSubmit={handleSubmit} noValidate>
        <div className={`scan-console-box ${activeError ? 'has-error' : ''}`}>
          <div className="scan-input-row">
            <span className="protocol-badge" title="Target Protocol Scheme">
              <FiLock aria-hidden="true" />
              <span>HTTPS://</span>
            </span>

            <FiSearch className="scan-input-icon" aria-hidden="true" />

            <input
              id="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck="false"
              placeholder="Enter target domain or URL (e.g., example.com)"
              value={url}
              onChange={handleChange}
              disabled={loading}
              aria-label="Target website domain"
              aria-invalid={!!activeError}
              aria-describedby={activeError ? 'scan-error-details' : undefined}
            />

            {url && !loading && (
              <button
                type="button"
                className="clear-btn"
                onClick={handleClear}
                title="Clear input"
                aria-label="Clear input"
              >
                <FiX />
              </button>
            )}

            <span className="shortcut-hint" title="Submit shortcut">
              <FiCornerDownLeft aria-hidden="true" /> ↵
            </span>

            <button
              type="submit"
              className="btn-scan"
              disabled={loading || !consent || !url.trim()}
              title={!consent ? 'Please confirm authorization below' : 'Run security audit'}
            >
              {loading ? (
                <>
                  <FiZap className="spin" aria-hidden="true" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <FiShield aria-hidden="true" />
                  <span>Launch Recon</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* PROMINENT ERROR CARD */}
        {activeError && (
          <div id="scan-error-details" className="dns-error-card" role="alert">
            <div className="dns-error-header">
              <div className="dns-error-title-row">
                <div className="dns-error-icon-box">
                  <FiAlertTriangle aria-hidden="true" />
                </div>
                <div>
                  <span className="dns-error-badge">
                    {activeError.toLowerCase().includes('private or internal')
                      ? 'SECURITY POLICY: BLOCKED HOST'
                      : 'DNS RESOLUTION FAILURE'}
                  </span>
                  <h3 className="dns-error-heading">
                    {activeError.toLowerCase().includes('private or internal')
                      ? 'Target Network Address Blocked'
                      : 'Target Domain Could Not Be Resolved'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="dns-error-close-btn"
                onClick={() => {
                  setClientError('')
                  if (onClearError) onClearError()
                }}
                title="Dismiss error notice"
                aria-label="Dismiss error notice"
              >
                <FiX />
              </button>
            </div>

            <div className="dns-error-body">
              <p className="dns-error-message">
                <strong>Error:</strong> {activeError}
              </p>

              {isDnsOrUnreachable && (
                <div className="dns-error-troubleshoot">
                  <span className="troubleshoot-title">Troubleshooting &amp; Verification Checklist:</span>
                  <ul className="troubleshoot-list">
                    <li>
                      <strong>Check for typos:</strong> Verify that the domain name (such as <code>{url || 'the domain'}</code>) and its extension (e.g. <code>.com.pk</code>, <code>.com</code>, <code>.org</code>) are spelled correctly.
                    </li>
                    <li>
                      <strong>Active DNS Records:</strong> Ensure the domain is registered with an active DNS registrar and has public <code>A</code> (IPv4) or <code>AAAA</code> (IPv6) records.
                    </li>
                    <li>
                      <strong>Host Availability:</strong> Ensure the target web server is online, not blocking incoming non-browser probes, and accessible on port 80 or 443.
                    </li>
                  </ul>
                </div>
              )}

              <div className="dns-error-actions">
                <button
                  type="button"
                  className="btn-try-preset"
                  onClick={() => handlePreset('example.com')}
                >
                  <FiCheckCircle aria-hidden="true" />
                  <span>Test with Verified Target (example.com)</span>
                </button>
                <button
                  type="button"
                  className="btn-clear-target"
                  onClick={handleClear}
                >
                  <FiRefreshCw aria-hidden="true" />
                  <span>Clear Input &amp; Re-type</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="consent-row">
          <label className="consent-label">
            <input
              type="checkbox"
              className="consent-checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={loading}
            />
            <span>I certify I own this host or have explicit authorization to perform vulnerability testing.</span>
          </label>

          <span className="recon-pill">
            <FiShield aria-hidden="true" />
            <span>Passive &amp; Non-Intrusive Only</span>
          </span>
        </div>
      </form>

      {/* Quick Target Presets for effortless testing */}
      <div className="presets-bar">
        <span>Quick Test Targets:</span>
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.url}
            type="button"
            className="preset-chip"
            onClick={() => handlePreset(preset.url)}
            disabled={loading}
          >
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
