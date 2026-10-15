export default function SeverityBadge({ severity, prefix }) {
  if (!severity || severity === 'None') return null
  return (
    <span className={`badge sev-${severity.toLowerCase()}`}>
      {prefix ? `${prefix} ` : ''}
      {severity}
    </span>
  )
}
