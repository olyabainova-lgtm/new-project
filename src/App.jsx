import { Navigate, Route, Routes } from 'react-router-dom'
import PublicBooking from './pages/PublicBooking'
import TeacherLogin from './pages/TeacherLogin'
import DashboardLayout from './components/DashboardLayout'
import DashboardOverview from './pages/DashboardOverview'
import AvailabilityManager from './pages/AvailabilityManager'
import RequestsList from './pages/RequestsList'
import MessageTemplates from './pages/MessageTemplates'
import TodoList from './pages/TodoList'
import StudentProfilesPage from './pages/StudentProfilesPage'
import ReportsPage from './pages/ReportsPage'
import GradingPapers from './pages/GradingPapers'
import { initializeSampleData } from './utils/storage'
import { isTeacherLoggedIn } from './utils/auth'

initializeSampleData()
const Protected=()=>isTeacherLoggedIn()?<DashboardLayout/>:<Navigate to="/login" replace/>
export default function App(){return <Routes><Route path="/" element={<PublicBooking/>}/><Route path="/login" element={<TeacherLogin/>}/><Route path="/dashboard" element={<Protected/>}><Route index element={<DashboardOverview/>}/><Route path="availability" element={<AvailabilityManager/>}/><Route path="requests" element={<RequestsList/>}/><Route path="approved" element={<RequestsList mode="approved"/>}/><Route path="students" element={<StudentProfilesPage/>}/><Route path="todos" element={<TodoList/>}/><Route path="reports" element={<ReportsPage/>}/><Route path="templates" element={<MessageTemplates/>}/><Route path="grading" element={<GradingPapers/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
