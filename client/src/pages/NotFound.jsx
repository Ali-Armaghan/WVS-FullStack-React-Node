import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container empty-state">
      <h1>404</h1>
      <p className="muted">This page does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Go to scanner
      </Link>
    </div>
  )
}
