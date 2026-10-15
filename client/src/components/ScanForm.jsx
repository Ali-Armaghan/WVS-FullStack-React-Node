import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { validateUrl } from '../utils/validateUrl.js'

export default function ScanForm({ onScan, loading }) {
  const [url, setUrl] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const handleChange = (e) => {
    setUrl(e.target.value)
    if (touched) {
      const result = validateUrl(e.target.value)
      setError(result.valid ? '' : result.error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const result = validateUrl(url)
    if (!result.valid) {
      setError(result.error)
      return
    }
    setError('')
    onScan(result.url)
  }

  return (
    <form className="scan-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="url" className="sr-only">
        Website URL
      </label>
      <div className={`scan-input-row ${error ? 'has-error' : ''}`}>
        <FiSearch className="scan-input-icon" aria-hidden="true" />
        <input
          id="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="Enter a website URL, e.g. example.com"
          value={url}
          onChange={handleChange}
          disabled={loading}
          aria-invalid={!!error}
          aria-describedby={error ? 'url-error' : undefined}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !consent}>
          {loading ? 'Scanning...' : 'Scan Website'}
        </button>
      </div>
      {error && (
        <p id="url-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      <label className="consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={loading} />
        <span>I own this website or have permission to scan it.</span>
      </label>
    </form>
  )
}
