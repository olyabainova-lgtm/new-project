import { deadlineState } from '../utils/studentUtils'
export default function StudentDeadlineBadge({date}){const state=deadlineState(date);return state?<span className={`deadline-badge deadline-${state.tone}`}>{state.label}</span>:<span className="deadline-badge deadline-none">No deadline</span>}
