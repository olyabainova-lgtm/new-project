export const occupationTypes = [
  { value:'teaching_preparation', label:'Teaching preparation', color:'lavender' },
  { value:'class', label:'Class', color:'violet' },
  { value:'consultation', label:'Consultation', color:'sky' },
  { value:'administrative_meeting', label:'Administrative meeting', color:'orange' },
  { value:'administration', label:'Administration', color:'amber' },
  { value:'research', label:'Research work', color:'emerald' },
  { value:'grading', label:'Grading / feedback', color:'rose' },
  { value:'supervision', label:'Thesis supervision', color:'indigo' },
  { value:'personal', label:'Personal', color:'gray' },
  { value:'communication', label:'Communication', color:'cyan' },
  { value:'other', label:'Other', color:'slate' },
]
export const getOccupationType = type => occupationTypes.find(item=>item.value===type) || occupationTypes.at(-1)
export const getOccupationTypeStyle = type => `occupation-${getOccupationType(type).color}`
export const legacyReasonToType = reason => {
  const value=String(reason||'').toLowerCase()
  if(value.includes('class')) return 'class'
  if(value.includes('research')) return 'research'
  if(value.includes('personal')) return 'personal'
  if(value.includes('meeting')) return 'administrative_meeting'
  return 'other'
}
