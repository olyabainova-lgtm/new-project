import { getNoteCategory, getNoteCategoryStyle } from '../utils/noteUtils'
export default function NoteCategoryBadge({category}){const item=getNoteCategory(category);return <span className={`occupation-badge ${getNoteCategoryStyle(category)}`}>{item.label}</span>}
