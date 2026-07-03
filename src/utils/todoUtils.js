export const todoCategories=['teaching_preparation','grading','supervision','research','administration','communication','personal','other']
export const todoCategoryToOccupationType={teaching:'teaching_preparation',teaching_preparation:'teaching_preparation',supervision:'supervision',research:'research',administration:'administration',grading:'grading',communication:'communication',personal:'personal',other:'other'}
export const labelize = value => value.replaceAll('_',' ').replace(/\b\w/g, letter=>letter.toUpperCase())
export const isOverdue = todo => todo.status!=='done' && todo.dueDate && todo.dueDate < new Date().toISOString().slice(0,10)
