import { FiAlertOctagon, FiX } from 'react-icons/fi'

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null
  return (
    <div className="alert-banner alert-error" role="alert">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FiAlertOctagon aria-hidden="true" style={{ fontSize: '1.25rem', flexShrink: 0 }} />
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss error"
          style={{ color: 'inherit', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
        >
          <FiX style={{ fontSize: '1.1rem' }} />
        </button>
      )}
    </div>
  )
}
