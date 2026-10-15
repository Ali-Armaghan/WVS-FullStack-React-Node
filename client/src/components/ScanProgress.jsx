import { useEffect, useState } from 'react'
import { FiCheck, FiLoader, FiActivity, FiCpu, FiRadio, FiShield } from 'react-icons/fi'
import { CHECK_NAMES } from '../utils/format.js'

export default function ScanProgress({ url }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Date.now() - started), 200)
    return () => clearInterval(timer)
  }, [])

  // Estimated progression over ~6 seconds
  const activeIndex = Math.min(CHECK_NAMES.length - 1, Math.floor(elapsed / 380))
  const percent = Math.min(96, Math.max(8, Math.round((elapsed / 5500) * 100)))

  // Circumference for 64px diameter SVG ring (radius = 26)
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <section className="scan-progress-card" aria-live="polite">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="cyan-indigo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>

      <div className="telemetry-header">
        <div className="telemetry-left">
          <div className="radar-gauge">
            <svg className="radar-svg" viewBox="0 0 64 64">
              <circle className="radar-bg" cx="32" cy="32" r={radius} />
              <circle
                className="radar-bar"
                cx="32"
                cy="32"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="radar-percent">{percent}%</span>
          </div>

          <div className="telemetry-meta">
            <h2>
              <FiRadio className="probe-icon-spin" aria-hidden="true" />
              <span>Probing: {url}</span>
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              Dispatching 15 automated security assessments across transport, headers, cookies, and reconnaissance.
            </p>
          </div>
        </div>

        <div className="telemetry-stats">
          <div className="telemetry-stat-item">
            <span className="telemetry-stat-label">Elapsed</span>
            <span className="telemetry-stat-value">{(elapsed / 1000).toFixed(1)}s</span>
          </div>
          <div className="telemetry-stat-item">
            <span className="telemetry-stat-label">Probes</span>
            <span className="telemetry-stat-value">
              {Math.min(15, activeIndex + 1)} / 15
            </span>
          </div>
          <div className="telemetry-stat-item">
            <span className="telemetry-stat-label">Socket</span>
            <span className="telemetry-stat-value" style={{ color: '#10b981' }}>
              ESTABLISHED
            </span>
          </div>
        </div>
      </div>

      <div
        className="progress-rail"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-indicator" style={{ width: `${percent}%` }} />
      </div>

      <div className="telemetry-grid">
        {CHECK_NAMES.map((name, i) => {
          const isDone = i < activeIndex
          const isActive = i === activeIndex
          return (
            <div
              key={name}
              className={`telemetry-probe-card ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
            >
              {isDone ? (
                <FiCheck className="probe-icon-done" aria-hidden="true" />
              ) : isActive ? (
                <FiLoader className="probe-icon-spin" aria-hidden="true" />
              ) : (
                <span className="probe-dot-pending" aria-hidden="true" />
              )}
              <span>{name}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
