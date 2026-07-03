import { stageLabel } from './studentUtils.js'

export const trackingStatuses=[['not_started','Not started'],['in_progress','In progress'],['submitted','Submitted'],['reviewed','Reviewed'],['approved','Approved'],['needs_revision','Needs revision'],['needs_changes','Needs changes'],['completed','Completed']]
export const nirmTemplates=[
  {code:'nirm1',label:'NIRM 1',title:'Topic, aim, research questions, problem & significance',milestones:[
    {id:'n1-topic',title:'Confirm thesis topic',guidance:'Formulate the potential thesis topic; syllabus reference date: 10 October 2025.'},
    {id:'n1-plan',title:'Individual research plan',guidance:'Include topic, aim, research questions, literature-based problem statement and expected significance. Week 15; 40%.'},
    {id:'n1-matrix',title:'Literature matrix (15–20 empirical sources)',guidance:'Analyze relevant empirical studies and record design, findings, implications and relevance. Week 15; 40%.'},
  ]},
  {code:'nirm2',label:'NIRM 2',title:'Literature review',milestones:[
    {id:'n2-review',title:'Literature Review chapter',guidance:'Critical analysis and synthesis, not a descriptive list. Week 15; 90%.'},
    {id:'n2-framework',title:'Conceptual framework linked to RQs',guidance:'Define central concepts and explicitly connect the framework to each research question.'},
    {id:'n2-sources',title:'Source quality and APA check',guidance:'Aim for at least 10 relevant research articles published since 2010; complete APA 7 citations and references.'},
  ]},
  {code:'nirm3',label:'NIRM 3',title:'Literature review & methodology',milestones:[
    {id:'n3-review',title:'Final Literature Review chapter',guidance:'Final version due Weeks 7–8; 50%.'},
    {id:'n3-method',title:'Final Methodology chapter',guidance:'Research design, sample, instruments, procedures, analysis, validity/reliability and ethics. Weeks 13–14; 50%.'},
    {id:'n3-ethics',title:'Ethics package and consent materials',guidance:'Document approval process, consent, anonymity/confidentiality, data protection and required appendices.'},
    {id:'n3-proposal',title:'Proposal presentation',guidance:'Presentation to Research Committee in Week 15 (Week 16 optional); pass/fail.'},
  ]},
  {code:'nirm4',label:'NIRM 4',title:'Data analysis, discussion & conclusion',milestones:[
    {id:'n4-results',title:'Results / Findings chapter',guidance:'Present data clearly before interpretation; Week 11; 30%.'},
    {id:'n4-discussion',title:'Discussion chapter',guidance:'Interpret findings against RQs and literature; address significance and implications. Week 12; 35%.'},
    {id:'n4-conclusion',title:'Conclusion chapter',guidance:'Summarize answers, contributions, implications, limitations and future research. Week 13; 35%.'},
    {id:'n4-final',title:'Final thesis readiness check',guidance:'APA, academic integrity, Turnitin, signed AI-use declaration and final submission requirements.'},
  ]},
]
export const createDefaultNirmTracking=()=>nirmTemplates.map(template=>({...template,status:'not_started',deadline:'',comment:'',milestones:template.milestones.map(item=>({...item,status:'not_started',deadline:'',comment:''}))}))
export const createDefaultEthics=()=>({status:'not_started',submissionDate:'',approvalDate:'',comment:''})
export const createDefaultPractice=()=>({scientificInternship:{planStatus:'not_started',reportStatus:'not_started',deadline:'',comment:''},researchPractice:{planStatus:'not_started',reportStatus:'not_started',deadline:'',comment:''}})
export function mergeNirmTracking(existing=[]){const safe=Array.isArray(existing)?existing:[];return createDefaultNirmTracking().map(base=>{const saved=safe.find(item=>item&&item.code===base.code)||{},milestones=Array.isArray(saved.milestones)?saved.milestones:[];return{...base,...saved,milestones:base.milestones.map(milestone=>({...milestone,...milestones.find(item=>item&&item.id===milestone.id)}))}})}
export function getSupervisionAlerts(student={}){
  const today=new Date()
  today.setHours(0,0,0,0)
  const alerts=[]
  const days=date=>Math.ceil((new Date(`${date}T00:00:00`)-today)/86400000)
  const addDeadline=(date,label,toneLabel=label)=>{if(!date)return;const value=days(date);if(!Number.isFinite(value))return;if(value<0)alerts.push({tone:'rose',text:`${label} overdue`});else if(value<=7)alerts.push({tone:'amber',text:`${toneLabel} in ${value} day${value===1?'':'s'}`})}
  if(!student.lastConsultationDate||days(student.lastConsultationDate)<-21)alerts.push({tone:'rose',text:'No consultation for 3 weeks'})
  addDeadline(student.nextDeadline,'Main deadline','Main deadline')
  ;(Array.isArray(student.drafts)?student.drafts:[]).forEach(draft=>{if(draft&&!['reviewed','completed'].includes(draft.status))addDeadline(draft.deadline,`Draft: ${draft.title||'Untitled'}`,`Draft “${draft.title||'Untitled'}” due`)})
  ;(Array.isArray(student.nirmTracking)?student.nirmTracking:[]).forEach(nirm=>{if(nirm&&nirm.status!=='completed')addDeadline(nirm.deadline,nirm.label||'NIRM',`${nirm.label||'NIRM'} due`)})
  return alerts
}
export function buildSupervisionReminder(student){const alerts=getSupervisionAlerts(student),current=(student.nirmTracking||[]).find(item=>item.status!=='completed'),nextMilestone=current?.milestones?.find(item=>item.status!=='completed');return `Dear ${student.fullName},\n\nThis is a reminder regarding your thesis supervision progress.\n\nCurrent thesis stage: ${stageLabel(student.thesisStage)}\n${current?`Current NIRM: ${current.label} — ${current.title}\n`:''}${nextMilestone?`Next milestone: ${nextMilestone.title}${nextMilestone.deadline?` (deadline: ${nextMilestone.deadline})`:''}\n`:''}${student.nextStep?`Agreed next step: ${student.nextStep}\n`:''}${student.nextDeadline?`Next deadline: ${student.nextDeadline}\n`:''}${alerts.length?`Please note: ${alerts.map(item=>item.text).join('; ')}\n`:''}\nPlease submit official graded work through Canvas, check it through Turnitin, and include the required declaration of AI use. If we have not met during the last three weeks, please arrange a consultation.\n\nBest regards,\nOlga Bainova`}
