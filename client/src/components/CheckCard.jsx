import { useState } from 'react'
import { FiChevronDown, FiExternalLink } from 'react-icons/fi'
import SeverityBadge from './SeverityBadge.jsx'
import StatusIcon from './StatusIcon.jsx'
import { STATUS_LABEL } from '../utils/format.js'

function EvidenceValue({ value }) {
  if (value === null || value === undefined || value === '') return <span className="muted">none</span>
  if (typeof value === 'boolean') return <span>{value ? 'yes' : 'no'}</span>
  if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
    return value.length ? <span>{value.join(', ')}</span> : <span className="muted">none</span>
  }
  if (typeof value === 'object') return <pre>{JSON.stringify(value, null, 2)}</pre>
  return <span>{String(value)}</span>
}

export default function CheckCard({ check }) {
  const [open, setOpen] = useState(false)
  const evidence = Object.entries(check.evidence || {})
  const panelId = `check-${check.checkId}-details`

  return (
    <article className={`check-card status-border-${check.status}`}>
      <button
        type="button"
        className="check-summary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <StatusIcon status={check.status} />
        <div className="check-title">
          <h4>
            <span className="muted">#{check.checkId}</span> {check.name}
          </h4>
          <p>{check.finding}</p>
        </div>
        <div className="check-meta">
          <span className={`status-label status-${check.status}`}>{STATUS_LABEL[check.status]}</span>
          <SeverityBadge severity={check.severity} />
        </div>
        <FiChevronDown className={`chevron ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="check-details" id={panelId}>
          <p className="muted">{check.description}</p>

          {evidence.length > 0 && (
            <>
              <h5>Evidence</h5>
              <dl className="evidence">
                {evidence.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>
                      <EvidenceValue value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {check.recommendation && (
            <>
              <h5>Recommendation</h5>
              <pre className="recommendation">{check.recommendation}</pre>
            </>
          )}

          {check.references?.length > 0 && (
            <>
              <h5>References</h5>
              <ul className="references">
                {check.references.map((ref) => (
                  <li key={ref}>
                    <a href={ref} target="_blank" rel="noopener noreferrer">
                      {ref} <FiExternalLink aria-hidden="true" />
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
