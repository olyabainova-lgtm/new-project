import { legacyReasonToType } from './occupationTypes'
import { createDefaultEthics, createDefaultPractice, mergeNirmTracking } from './supervisionTracking'
const KEYS = { requests: 'teacherflow_requests', blocked: 'teacherflow_blocked', todos:'teacherflow_todos', students:'teacherflow_students', initialized: 'teacherflow_initialized' }

export function readStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value ?? fallback)
  } catch { try { localStorage.removeItem(key) } catch {} return fallback }
}
export function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
const migrateRequest = request => ({name:'Unknown requester',email:'',role:'other',programme:'',topic:'Untitled meeting',format:'offline',onlineLink:'',comment:'',date:'',startTime:'08:00',duration:30,status:'pending',meetingType:'general_consultation',studentProfileId:null,...request,attachments:Array.isArray(request.attachments)?request.attachments:[],emailLog:Array.isArray(request.emailLog)?request.emailLog:Array.isArray(request.messageHistory)?request.messageHistory:[],privateTeacherComment:request.privateTeacherComment||request.privateNote||''})
const migrateBlock = block => {
  const now=block.createdAt||new Date().toISOString()
  const linkedTodoId=block.linkedTodoId||block.todoId||null
  return {date:'',startTime:'08:00',endTime:'08:30',source:linkedTodoId?'scheduled_todo':'manual_block',linkedTodoId,priority:'medium',status:'planned',...block,type:block.type||legacyReasonToType(block.reason),title:block.title||block.reason||'Busy time',privateComment:block.privateComment||'',linkedTodoId,createdAt:now,updatedAt:block.updatedAt||now}
}
const migrateTodo = todo => ({description:'',category:todo.category==='teaching'?'teaching_preparation':todo.category||'other',priority:'medium',status:todo.status==='not_started'?'planned':todo.status||'planned',dueDate:'',scheduledDate:'',scheduledStartTime:'',scheduledEndTime:'',estimatedDuration:30,scheduledBlockId:null,origin:'todo',...todo,category:todo.category==='teaching'?'teaching_preparation':todo.category||'other',status:todo.status==='not_started'?'planned':todo.status||'planned'})
const migrateStudent = student => {const now=student.createdAt||new Date().toISOString(),practice=createDefaultPractice(),savedPractice=student.practice&&typeof student.practice==='object'?student.practice:{},savedEthics=student.ethics&&typeof student.ethics==='object'?student.ethics:{};return{...student,fullName:String(student.fullName||'Unnamed student'),email:String(student.email||''),programme:String(student.programme||'Other'),yearOfStudy:String(student.yearOfStudy||'Other'),thesisTitle:String(student.thesisTitle||''),thesisStage:String(student.thesisStage||'topic_selection'),supervisorNotes:String(student.supervisorNotes||''),nextDeadline:String(student.nextDeadline||''),deadlineComment:String(student.deadlineComment||''),lastConsultationDate:String(student.lastConsultationDate||''),nextStep:String(student.nextStep||''),status:String(student.status||'active'),consultations:Array.isArray(student.consultations)?student.consultations:[],nirmTracking:mergeNirmTracking(student.nirmTracking),drafts:Array.isArray(student.drafts)?student.drafts:[],ethics:{...createDefaultEthics(),...savedEthics},practice:{scientificInternship:{...practice.scientificInternship,...(savedPractice.scientificInternship&&typeof savedPractice.scientificInternship==='object'?savedPractice.scientificInternship:{})},researchPractice:{...practice.researchPractice,...(savedPractice.researchPractice&&typeof savedPractice.researchPractice==='object'?savedPractice.researchPractice:{})}},createdAt:now,updatedAt:student.updatedAt||now}}
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
const withUniqueIds=items=>{const seen=new Set();return items.filter(item=>item&&typeof item==='object').map(item=>{let id=item.id;if(!id||seen.has(id))id=uid();seen.add(id);return id===item.id?item:{...item,id}})}
const loadCollection=(key,migrate)=>{const raw=readStorage(key,[]),migrated=withUniqueIds(raw.filter(item=>item&&typeof item==='object').map(migrate));if(JSON.stringify(raw)!==JSON.stringify(migrated))writeStorage(key,migrated);return migrated}
export const getRequests = () => loadCollection(KEYS.requests,migrateRequest)
export const saveRequests = (value) => writeStorage(KEYS.requests, value)
export const addRequest = request => saveRequests([request,...getRequests()])
export const getPublicSchedule = () => ({
  blocked:getBlockedSlots().map(({date,startTime,endTime})=>({date,startTime,endTime})),
  requests:getRequests().map(({date,startTime,duration,status})=>({date,startTime,duration,status})),
})
export const getBlockedSlots = () => loadCollection(KEYS.blocked,migrateBlock)
export const saveBlockedSlots = (value) => writeStorage(KEYS.blocked, value)
export const getTodos = () => loadCollection(KEYS.todos,migrateTodo)
export const saveTodos = value => writeStorage(KEYS.todos, value)
export const getStudents = () => loadCollection(KEYS.students,migrateStudent)
export const saveStudents = value => writeStorage(KEYS.students, value)

export function initializeSampleData() {
  try { if (localStorage.getItem(KEYS.initialized)) return } catch { return }
  const today = new Date(); const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const iso = (offset) => { const d = new Date(monday); d.setDate(d.getDate() + offset); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}` }
  const now = new Date().toISOString()
  saveRequests([
    { id: uid(), name:'Amina Sadykova', email:'amina@example.com', role:'student', meetingType:'thesis_supervision', attachments:[], emailLog:[], programme:'BA Law', topic:'Thesis topic discussion', format:'offline', onlineLink:'', comment:'I have prepared a short outline.', date:iso(2), startTime:'14:00', duration:30, status:'pending', privateTeacherComment:'', createdAt:now, updatedAt:now },
    { id: uid(), name:'Timur Akhmetov', email:'timur@example.com', role:'ma_student', programme:'MA International Law', topic:'Research methodology', format:'online', onlineLink:'https://meet.google.com/example', comment:'', date:iso(3), startTime:'10:30', duration:45, status:'approved', privateTeacherComment:'Review chapter 2', createdAt:now, updatedAt:now },
  ])
  saveBlockedSlots([
    { id:uid(), date:iso(1), startTime:'09:00', endTime:'11:00', type:'class', title:'Language Testing class', privateComment:'', createdAt:now, updatedAt:now },
    { id:uid(), date:iso(4), startTime:'15:00', endTime:'16:30', type:'research', title:'Research writing time', privateComment:'Draft article section', createdAt:now, updatedAt:now },
  ])
  try { localStorage.setItem(KEYS.initialized, 'true') } catch {}
}
