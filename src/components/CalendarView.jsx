import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { generateTimes, weekDays, isoDate, formatDate, conflictReason, calculateEndTime } from '../utils/timeUtils'
import { getOccupationTypeStyle } from '../utils/occupationTypes'

export default function CalendarView({anchor,setAnchor,selected,onSelect,duration,blocked,requests,teacher=false,onTeacherBlockClick,onMoveScheduledBlock}) {
  const [draggingId,setDraggingId]=useState(null),[dropTarget,setDropTarget]=useState('')
  const days=weekDays(anchor), times=generateTimes()
  const move=(n)=>{const d=new Date(anchor); d.setDate(d.getDate()+n*7); setAnchor(d)}
  return <div className="calendar-wrap">
    <div className="calendar-toolbar"><div><span className="eyebrow">Weekly availability</span><h2>{formatDate(isoDate(days[0]),{month:'long',day:'numeric'})} – {formatDate(isoDate(days[4]),{month:'long',day:'numeric',year:'numeric'})}</h2></div><div className="week-nav"><button className="icon-btn" onClick={()=>move(-1)} aria-label="Previous week"><ChevronLeft size={18}/></button><button className="btn btn-ghost btn-sm" onClick={()=>setAnchor(new Date())}>Today</button><button className="icon-btn" onClick={()=>move(1)} aria-label="Next week"><ChevronRight size={18}/></button></div></div>
    <div className="calendar-scroll"><div className="calendar-grid">
      <div className="calendar-corner" />
      {days.map(d=><div className="day-head" key={isoDate(d)}><span>{formatDate(isoDate(d),{weekday:'short'})}</span><strong>{d.getDate()}</strong></div>)}
      {times.map(time=><div className="calendar-row" key={time} style={{display:'contents'}}><div className="time-label">{time}</div>{days.map(day=>{
        const date=isoDate(day); const reason=conflictReason(date,time,duration,blocked,requests); const block=blocked.find(b=>b.date===date && time>=b.startTime && time<b.endTime)
        const meeting=requests.find(r=>r.date===date && ['approved','pending'].includes(r.status) && time>=r.startTime && time<calculateEndTime(r.startTime,r.duration))
        const disabled=!!reason; const active=selected?.date===date&&selected?.startTime===time
        const teacherTone=block?getOccupationTypeStyle(block.type):meeting?.status==='approved'?'occupation-blue':meeting?'occupation-pending':''
        const privateTitle=teacher?(block?`${block.title} · ${block.startTime}–${block.endTime}${block.source?.startsWith('scheduled_')?` · ${block.type} · ${block.priority} priority · ${block.status}`:''}${block.privateComment?` · ${block.privateComment}`:''}`:meeting?`${meeting.name} · ${meeting.topic} · ${meeting.status}`:reason):''
        const draggable=teacher&&block?.source?.startsWith('scheduled_'),targetKey=`${date}-${time}`
        return <button type="button" key={date+time} disabled={!teacher&&disabled} draggable={draggable} onDragStart={e=>{if(!draggable)return;e.dataTransfer.setData('text/plain',block.id);e.dataTransfer.effectAllowed='move';setDraggingId(block.id)}} onDragEnd={()=>{setDraggingId(null);setDropTarget('')}} onDragOver={e=>{if(teacher&&draggingId){e.preventDefault();e.dataTransfer.dropEffect='move';setDropTarget(targetKey)}}} onDragLeave={()=>dropTarget===targetKey&&setDropTarget('')} onDrop={e=>{if(!teacher)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain')||draggingId;setDropTarget('');setDraggingId(null);if(id)onMoveScheduledBlock?.(id,date,time)}} onClick={()=>teacher?(block&&onTeacherBlockClick?.(block)):onSelect({date,startTime:time})} className={`calendar-cell ${disabled?'unavailable':'available'} ${active?'selected':''} ${teacher?teacherTone:''} ${draggable?'scheduled-note-cell draggable-item':''} ${draggingId===block?.id?'dragging':''} ${dropTarget===targetKey?'drop-target':''} ${teacher&&block?.status==='done'?'scheduled-done':''}`} title={teacher?privateTitle:reason}>{teacher&&block?<span>{block.title}</span>:teacher&&meeting?<span>{meeting.status==='pending'?'Pending: ':''}{meeting.name}</span>:active?<span>{duration} min</span>:<span className="cell-dot"/>}</button>
      })}</div>)}
    </div></div><div className="calendar-legend"><span><i className="legend available"/>Available</span><span><i className="legend unavailable"/>Unavailable</span><span><i className="legend selected"/>Selected</span></div>
  </div>
}
