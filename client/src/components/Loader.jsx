import { FiLoader } from 'react-icons/fi'

export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="loader" role="status">
      <FiLoader className="spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
