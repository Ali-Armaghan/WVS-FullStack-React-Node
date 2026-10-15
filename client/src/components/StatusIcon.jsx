import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiHelpCircle } from 'react-icons/fi'
import { STATUS_LABEL } from '../utils/format.js'

const ICONS = {
  pass: FiCheckCircle,
  fail: FiXCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
  error: FiHelpCircle,
}

export default function StatusIcon({ status }) {
  const Icon = ICONS[status] || FiHelpCircle
  return <Icon className={`status-icon status-${status}`} aria-label={STATUS_LABEL[status] || status} role="img" />
}
