import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, ShieldCheck } from 'lucide-react'
import CalendarView from '../components/CalendarView'
import BookingForm from '../components/BookingForm'
import { getPublicSchedule } from '../utils/storage'

export default function PublicBooking(){
 const [schedule]=useState(getPublicSchedule),[anchor,setAnchor]=useState(new Date()),[selected,setSelected]=useState(null),[requests,setRequests]=useState(schedule.requests),[blocked]=useState(schedule.blocked),[duration,setDuration]=useState(30)
 return <><header className="public-header"><Link to="/" className="brand"><span className="brand-mark"><GraduationCap/></span><span>TeacherFlow<small>Consultation scheduling</small></span></Link><Link className="teacher-link" to="/login"><ShieldCheck size={17}/> Teacher access</Link></header>
 <main><section className="hero"><div><span className="eyebrow">Olga Bainova · Faculty consultations</span><h1>Let’s find time for<br/><em>a good conversation.</em></h1><p>Choose a suitable time, tell me what you’d like to discuss, and I’ll confirm your request shortly.</p></div><div className="hero-note"><span>Office hours</span><strong>Monday – Friday</strong><p>08:00 – 19:00</p></div></section>
 <section className="booking-shell"><div className="calendar-panel"><div className="section-heading"><span className="step">1</span><div><span className="eyebrow">Choose a time</span><h2>Available this week</h2></div></div><div className="duration-control"><label>Meeting length<select value={duration} onChange={e=>{setDuration(Number(e.target.value));setSelected(null)}}>{Array.from({length:11},(_,i)=>10+i*5).map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label></div><CalendarView anchor={anchor} setAnchor={setAnchor} selected={selected} onSelect={setSelected} duration={duration} blocked={blocked} requests={requests}/></div><BookingForm {...{selected,setSelected,requests,setRequests,blocked,duration,setDuration}} /></section>
 </main><footer>© {new Date().getFullYear()} TeacherFlow · A private consultation scheduling space</footer></>
}
