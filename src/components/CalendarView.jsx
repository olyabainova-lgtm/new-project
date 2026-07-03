import { useState } from 'react'
import { CalendarRange, Check, ChevronLeft, ChevronRight, Clock3, ListTodo, StickyNote } from 'lucide-react'
import { generateTimes, weekDays, isoDate, formatDate, conflictReason, calculateEndTime, toMinutes } from '../utils/timeUtils'
import { getOccupationTypeStyle, occupationTypes } from '../utils/occupationTypes'

const sourceMeta={
  manual_block:{label:'Manual activity',Icon:CalendarRange,className:'source-manual'},
  scheduled_note:{label:'Scheduled note',Icon:StickyNote,className:'source-note'},
  scheduled_todo:{label:'Scheduled to-do',Icon:ListTodo,className:'source-todo'},
}

const isFirstVisibleCell=(item,time)=>item&&(time===item.startTime||(time>item.startTime&&toMinutes(time)-30<toMinutes(item.startTime)))

export default function CalendarView({anchor,setAnchor,selected,onSelect,duration,blocked,requests,teacher=false,onTeacherBlockClick,onMoveScheduledBlock}) {
  const [draggingId,setDraggingId]=useState(null),[dropTarget,setDropTarget]=useState('')
  const days=weekDays(anchor),times=generateTimes()
  const move=n=>{const d=new Date(anchor);d.setDate(d.getDate()+n*7);setAnchor(d)}
  return <div className="calendar-wrap">
    <div className="calendar-toolbar"><div><span className="eyebrow">Weekly availability</span><h2>{formatDate(isoDate(days[0]),{month:'long',day:'numeric'})} – {formatDate(isoDate(days[4]),{month:'long',day:'numeric',year:'numeric'})}</h2></div><div className="week-nav"><button className="icon-btn" onClick={()=>move(-1)} aria-label="Previous week"><ChevronLeft size={18}/></button><button className="btn btn-ghost btn-sm" onClick={()=>setAnchor(new Date())}>Today</button><button className="icon-btn" onClick={()=>move(1)} aria-label="Next week"><ChevronRight size={18}/></button></div></div>
    <div className="calendar-scroll"><div className="calendar-grid">
      <div className="calendar-corner"/>
      {days.map(d=><div className="day-head" key={isoDate(d)}><span>{formatDate(isoDate(d),{weekday:'short'})}</span><strong>{d.getDate()}</strong></div>)}
      {times.map(time=><div className="calendar-row" key={time} style={{display:'contents'}}><div className="time-label">{time}</div>{days.map(day=>{
        const date=isoDate(day),reason=conflictReason(date,time,duration,blocked,requests)
        const block=blocked.find(b=>b.date===date&&time>=b.startTime&&time<b.endTime)
        const meeting=requests.find(r=>r.date===date&&['approved','pending'].includes(r.status)&&time>=r.startTime&&time<calculateEndTime(r.startTime,r.duration))
        const disabled=Boolean(reason),active=selected?.date===date&&selected?.startTime===time
        const teacherTone=block?getOccupationTypeStyle(block.type):meeting?.status==='approved'?'occupation-teal':meeting?'occupation-pending':''
        const source=block?sourceMeta[block.source]||sourceMeta.manual_block:null
        const sourceClass=source?.className||''
        const firstBlockCell=isFirstVisibleCell(block,time),firstMeetingCell=isFirstVisibleCell(meeting,time)
        const privateTitle=teacher?(block?`${block.title} · ${block.startTime}–${block.endTime}${block.source?.startsWith('scheduled_')?` · ${block.type} · ${block.priority} priority · ${block.status}`:''}${block.privateComment?` · ${block.privateComment}`:''}`:meeting?`${meeting.name} · ${meeting.topic} · ${meeting.status}`:reason):''
        const draggable=teacher&&block?.source?.startsWith('scheduled_'),targetKey=`${date}-${time}`
        const Marker=block?.status==='done'?Check:source?.Icon
        const cellLabel=teacher?(privateTitle||`${date} ${time}, available`):(reason?`${date} ${time}, unavailable`:`${date} ${time}, available`)
        return <button
          type="button"
          key={date+time}
          aria-label={cellLabel}
          disabled={!teacher&&disabled}
          draggable={draggable}
          onDragStart={e=>{if(!draggable)return;e.dataTransfer.setData('text/plain',block.id);e.dataTransfer.effectAllowed='move';setDraggingId(block.id)}}
          onDragEnd={()=>{setDraggingId(null);setDropTarget('')}}
          onDragOver={e=>{if(teacher&&draggingId){e.preventDefault();e.dataTransfer.dropEffect='move';setDropTarget(targetKey)}}}
          onDragLeave={()=>dropTarget===targetKey&&setDropTarget('')}
          onDrop={e=>{if(!teacher)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain')||draggingId;setDropTarget('');setDraggingId(null);if(id)onMoveScheduledBlock?.(id,date,time)}}
          onClick={()=>teacher?(block&&onTeacherBlockClick?.(block)):onSelect({date,startTime:time})}
          className={`calendar-cell ${disabled?'unavailable':'available'} ${active?'selected':''} ${teacher?teacherTone:''} ${teacher?sourceClass:''} ${draggable?'scheduled-note-cell draggable-item':''} ${draggingId===block?.id?'dragging':''} ${dropTarget===targetKey?'drop-target':''} ${teacher&&block?.status==='done'?'scheduled-done':''}`}
          title={teacher?privateTitle:reason}
        >
          {teacher&&block&&firstBlockCell?<span className="calendar-event-content">{Marker&&<Marker className="event-source-icon" aria-hidden="true"/>}<span>{block.title}</span></span>:teacher&&meeting&&firstMeetingCell?<span className="calendar-event-content">{meeting.status==='pending'?<Clock3 className="event-source-icon" aria-hidden="true"/>:<CalendarRange className="event-source-icon" aria-hidden="true"/>}<span>{meeting.status==='pending'?'Pending: ':''}{meeting.name}</span></span>:active?<span>{duration} min</span>:!block&&!meeting&&<span className="cell-dot"/>}
        </button>
      })}</div>)}
    </div></div>
    {teacher?<TeacherLegend/>:<div className="calendar-legend"><span><i className="legend available"/>Available</span><span><i className="legend unavailable"/>Unavailable</span><span><i className="legend selected"/>Selected</span></div>}
  </div>
}

function TeacherLegend(){return <details className="teacher-calendar-legend"><summary>Calendar color & marker guide</summary><div className="legend-sections"><section><strong>Activity colors</strong><div className="activity-legend">{occupationTypes.map(item=><span key={item.value}><i className={`legend-color occupation-${item.color}`}/>{item.label}</span>)}<span><i className="legend-color occupation-teal"/>Approved meeting</span><span><i className="legend-color occupation-pending"/>Pending request</span></div></section><section><strong>Sources</strong><div className="source-legend"><span><i className="source-symbol source-manual"><CalendarRange/></i>Manual activity</span><span><i className="source-symbol source-note"><StickyNote/></i>Scheduled note</span><span><i className="source-symbol source-todo"><ListTodo/></i>To-do item</span><span><i className="source-symbol source-done"><Check/></i>Completed</span></div></section></div></details>}
