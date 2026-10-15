import { useEffect, useState } from 'react'
import { FiCheck, FiLoader } from 'react-icons/fi'
import { CHECK_NAMES } from '../utils/format.js'

export default function ScanProgress({ url }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Date.now() - started), 250)
    return () => clearInterval(timer)
  }, [])

  // The API answers in one response, so progress is an estimate (~6s for all checks).
  const active = Math.min(CHECK_NAMES.length - 1, Math.floor(elapsed / 400))
  const percent = Math.min(95, Math.round((elapsed / 6000) * 100))

  return (
    <section className="card scan-progress" aria-live="polite">
      <div className="scan-progress-header">
        <FiLoader className="spin" aria-hidden="true" />
        <div>
          <h2>Scanning {url}</h2>
          <p className="muted">Running 15 security checks... {(elapsed / 1000).toFixed(0)}s</p>
        </div>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${percent}%` }} />
      </div>
      <ul className="progress-list">
        {CHECK_NAMES.map((name, i) => (
          <li key={name} className={i < active ? 'done' : i === active ? 'active' : ''}>
            {i < active ? <FiCheck aria-hidden="true" /> : <span className="dot" aria-hidden="true" />}
            {name}
          </li>
        ))}
      </ul>
    </section>
  )
}
