export const noteCategories=[
  {value:'teaching_preparation',label:'Teaching preparation',color:'purple'},
  {value:'grading',label:'Grading / feedback',color:'rose'},
  {value:'supervision',label:'Thesis supervision',color:'indigo'},
  {value:'research',label:'Research work',color:'green'},
  {value:'administration',label:'Administration',color:'amber'},
  {value:'communication',label:'Communication',color:'blue'},
  {value:'personal',label:'Personal',color:'gray'},
  {value:'other',label:'Other',color:'slate'},
]
export const getNoteCategory=value=>noteCategories.find(item=>item.value===value)||noteCategories.at(-1)
export const getNoteCategoryStyle=value=>`occupation-${getNoteCategory(value).color}`
export const priorityOptions=['low','medium','high']
export const noteStatusOptions=[['planned','Planned'],['in_progress','In progress'],['done','Done']]
