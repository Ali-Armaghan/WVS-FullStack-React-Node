import { NavLink, Link } from 'react-router-dom'
import { FiShield, FiActivity, FiClock, FiPlus } from 'react-icons/fi'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" title="Website Vulnerability Scanner">
          <div className="brand-icon-box">
            <FiShield className="brand-icon" aria-hidden="true" />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">
              Web<strong>Vuln</strong>Scanner
            </span>
            <span className="brand-sub">ENTERPRISE RECON</span>
          </div>
        </Link>

        <div className="nav-center">
          <nav className="nav-links" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FiActivity aria-hidden="true" />
              <span>Scan Console</span>
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FiClock aria-hidden="true" />
              <span>Audit History</span>
            </NavLink>
          </nav>
        </div>

        <div className="nav-right">
          <div className="engine-status-pill" title="Autonomous Probe Engine Active &amp; Ready">
            <span className="pulse-dot" aria-hidden="true" />
            <span>ENGINE ONLINE</span>
          </div>
          <Link to="/" className="nav-action-btn" title="Start a fresh vulnerability assessment">
            <FiPlus aria-hidden="true" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
