import { useState } from 'react'
import { FiChevronDown, FiExternalLink, FiCopy, FiCheck } from 'react-icons/fi'
import SeverityBadge from './SeverityBadge.jsx'
import StatusIcon from './StatusIcon.jsx'
import { STATUS_LABEL } from '../utils/format.js'

function EvidenceValue({ value }) {
  if (value === null || value === undefined || value === '') return <span className="muted">none</span>
  if (typeof value === 'boolean') return <span>{value ? 'true' : 'false'}</span>
  if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
    return value.length ? <span>{value.join(', ')}</span> : <span className="muted">none</span>
  }
  if (typeof value === 'object') return <pre style={{ margin: 0 }}>{JSON.stringify(value, null, 2)}</pre>
  return <span>{String(value)}</span>
}

export default function CheckCard({ check }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const evidence = Object.entries(check.evidence || {})
  const panelId = `check-${check.checkId}-details`

  const handleCopyRecommendation = (e) => {
    e.stopPropagation()
    if (!check.recommendation) return
    navigator.clipboard.writeText(check.recommendation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className={`check-card status-border-${check.status}`}>
      <button
        type="button"
        className="check-summary-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className={`status-symbol-wrapper status-${check.status}`}>
          <StatusIcon status={check.status} />
        </div>

        <div className="check-title-col">
          <h4>
            <span className="check-id-badge">PROBE #{String(check.checkId).padStart(2, '0')}</span>
            <span>{check.name}</span>
          </h4>
          <p className="check-finding-snippet">{check.finding}</p>
        </div>

        <div className="check-badges-col">
          <span className={`status-pill-badge status-${check.status}`}>{STATUS_LABEL[check.status]}</span>
          <SeverityBadge severity={check.severity} />
        </div>

        <FiChevronDown className={`chevron-icon ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="check-expanded-content" id={panelId}>
          <p className="check-desc-text">{check.description}</p>

          {evidence.length > 0 && (
            <>
              <div className="drawer-section-title">
                <span>Technical Evidence / Response Audit</span>
              </div>
              <div className="evidence-matrix">
                {evidence.map(([key, value]) => (
                  <div key={key} className="evidence-matrix-row">
                    <div className="evidence-key">{key}</div>
                    <div className="evidence-val">
                      <EvidenceValue value={value} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {check.recommendation && (
            <>
              <div className="drawer-section-title">
                <span>Remediation &amp; Hardening Guidance</span>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={handleCopyRecommendation}
                  title="Copy remediation advice"
                >
                  {copied ? (
                    <>
                      <FiCheck aria-hidden="true" style={{ color: '#10b981' }} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy aria-hidden="true" />
                      <span>Copy Fix</span>
                    </>
                  )}
                </button>
              </div>

              <div className="terminal-block">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot dot-red" />
                    <span className="terminal-dot dot-yellow" />
                    <span className="terminal-dot dot-green" />
                  </div>
                  <span className="terminal-lang">CONFIGURATION FIX / SNIPPET</span>
                  <span style={{ width: '40px' }} />
                </div>
                <pre className="terminal-body">{check.recommendation}</pre>
              </div>
            </>
          )}

          {check.references?.length > 0 && (
            <>
              <div className="drawer-section-title">
                <span>Security Standards &amp; RFC References</span>
              </div>
              <ul className="references-list">
                {check.references.map((ref) => (
                  <li key={ref}>
                    <a href={ref} target="_blank" rel="noopener noreferrer" className="ref-pill">
                      <span>{ref.replace(/^https?:\/\//, '')}</span>
                      <FiExternalLink aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </article>
  )
}
