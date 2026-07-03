export const toMinutes = time => {if(typeof time!=='string'||!/^\d{2}:\d{2}$/.test(time))return NaN;const [h,m]=time.split(':').map(Number);return h>=0&&h<=23&&m>=0&&m<=59?h*60+m:NaN}
export const fromMinutes = n => Number.isFinite(n)?`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`:''
export const calculateEndTime = (start, duration) => {const value=toMinutes(start)+Number(duration);return fromMinutes(value)}
export const overlaps = (startA, endA, startB, endB) => {const a=toMinutes(startA),b=toMinutes(endA),c=toMinutes(startB),d=toMinutes(endB);return [a,b,c,d].every(Number.isFinite)&&a<d&&b>c}
export const generateTimes = (step = 30, start = 8*60, end = 19*60) => Array.from({length:(end-start)/step}, (_,i) => fromMinutes(start+i*step))

export function getMonday(date = new Date()) {
  const d = new Date(date); d.setHours(12,0,0,0); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d
}
export function weekDays(anchor = new Date()) {
  const monday = getMonday(anchor)
  return Array.from({length:5}, (_,i) => { const d=new Date(monday); d.setDate(d.getDate()+i); return d })
}
export const isoDate = (d) => { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }
export const formatDate = (date, options={weekday:'short', month:'short', day:'numeric'}) => new Intl.DateTimeFormat('en-US', options).format(new Date(`${date}T12:00:00`))
export const formatLongDate = (date) => formatDate(date, {weekday:'long', year:'numeric', month:'long', day:'numeric'})
export const isPastSlot = (date,time) => new Date(`${date}T${time}:00`) < new Date()

export function getScheduleConflict({date,startTime,endTime,duration,blocked=[],requests=[],excludeBlockId=null,excludeRequestId=null,checkPast=true,checkPendingExact=true}) {
  if(!date||!/^\d{2}:\d{2}$/.test(startTime||''))return 'Please select a valid date and start time.'
  const start=toMinutes(startTime),minutes=Number(duration),end=endTime||calculateEndTime(startTime,minutes)
  if(!Number.isFinite(start)||!/^\d{2}:\d{2}$/.test(end||'')||!Number.isFinite(toMinutes(end)))return 'Please select a valid time range.'
  if(duration!==undefined&&(!Number.isFinite(minutes)||minutes<10))return 'Duration must be at least 10 minutes.'
  if(start<8*60||toMinutes(end)>19*60)return 'Time must stay within working hours, 08:00–19:00.'
  if(toMinutes(end)<=start)return 'End time must be later than start time.'
  if(checkPast&&isPastSlot(date,startTime))return 'This time has already passed.'
  if(blocked.some(b=>b.id!==excludeBlockId&&b.date===date&&overlaps(startTime,end,b.startTime,b.endTime)))return 'This time overlaps unavailable time.'
  if(requests.some(r=>r.id!==excludeRequestId&&r.date===date&&r.status==='approved'&&overlaps(startTime,end,r.startTime,calculateEndTime(r.startTime,r.duration))))return 'This time overlaps an approved meeting.'
  if(checkPendingExact&&requests.some(r=>r.id!==excludeRequestId&&r.date===date&&r.status==='pending'&&r.startTime===startTime&&Number(r.duration)===minutes))return 'An identical request is already being reviewed.'
  return ''
}
export const conflictReason=(date,startTime,duration,blocked,requests)=>getScheduleConflict({date,startTime,duration,blocked,requests})
