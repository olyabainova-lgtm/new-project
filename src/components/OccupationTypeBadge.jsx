import { getOccupationType, getOccupationTypeStyle } from '../utils/occupationTypes'
export default function OccupationTypeBadge({type}){const item=getOccupationType(type);return <span className={`occupation-badge ${getOccupationTypeStyle(type)}`}>{item.label}</span>}
