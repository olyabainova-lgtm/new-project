export const programmes=['Applied Linguistics','Translation Studies','Counselling Psychology','Other']
export const yearsOfStudy=['Year 1','Year 2','Other']
export const thesisStages=[
  ['topic_selection','Topic selection'],['proposal','Proposal'],['literature_review','Literature review'],['methodology','Methodology'],['ethics_approval','Ethics approval'],['data_collection','Data collection'],['data_analysis','Data analysis'],['writing_results','Results writing'],['discussion_conclusion','Discussion and conclusion'],['pre_defense','Pre-defense'],['final_submission','Final submission'],['completed','Completed'],
]
export const studentStatuses=[['active','Active'],['on_track','On track'],['needs_attention','Needs attention'],['completed','Completed'],['inactive','Inactive']]
export const stageLabel=value=>thesisStages.find(([key])=>key===value)?.[1]||'Topic selection'
export const statusLabel=value=>studentStatuses.find(([key])=>key===value)?.[1]||'Active'
export function deadlineState(date){if(!date)return null;const today=new Date();today.setHours(0,0,0,0);const due=new Date(`${date}T00:00:00`),days=Math.ceil((due-today)/86400000);if(days<0)return{tone:'overdue',label:'Overdue'};if(days<=3)return{tone:'urgent',label:days===0?'Due today':`Due in ${days} days`};if(days<=7)return{tone:'soon',label:`Due in ${days} days`};return{tone:'later',label:'Upcoming'}}
export const hasRecentConsultation=(student,days=30)=>student.lastConsultationDate&&new Date(`${student.lastConsultationDate}T00:00:00`)>=new Date(Date.now()-days*86400000)
