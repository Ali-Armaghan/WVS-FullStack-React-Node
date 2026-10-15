import { FiAlertOctagon, FiX } from 'react-icons/fi'

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null
  return (
    <div className="alert alert-error" role="alert">
      <FiAlertOctagon aria-hidden="true" />
      <p>{message}</p>
      {onClose && (
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Dismiss error">
          <FiX />
        </button>
      )}
    </div>
  )
}
