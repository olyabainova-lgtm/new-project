import { statusLabel } from '../utils/studentUtils'
export default function StudentStatusBadge({status}){return <span className={`student-status student-${status}`}>{statusLabel(status)}</span>}
