import { NavLink, Link } from 'react-router-dom'
import { FiShield } from 'react-icons/fi'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <FiShield className="brand-icon" aria-hidden="true" />
          <span>
            Web<strong>Vuln</strong>Scanner
          </span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>
            Scan
          </NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </div>
    </header>
  )
}
