import { FiShield, FiExternalLink, FiLock } from 'react-icons/fi'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FiShield style={{ color: '#0284c7' }} aria-hidden="true" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            WVS <strong>// Vulnerability Scanner</strong>
          </span>
          <span>&copy; {YEAR}</span>
        </div>

        <p style={{ margin: 0, maxWidth: '620px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Conducts 15 passive, non-intrusive security checks. Strictly designed for authorized defensive reconnaissance.
          Always obtain explicit permission prior to scanning target hosts.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
            <FiLock aria-hidden="true" />
            <span>OWASP Aligned</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
