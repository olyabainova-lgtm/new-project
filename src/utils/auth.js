const AUTH_KEY='teacherflow_auth'
const configuredEmail=import.meta.env.VITE_TEACHER_EMAIL?.trim().toLowerCase()
const configuredPassword=import.meta.env.VITE_TEACHER_PASSWORD
export const getTeacherEmail=()=>configuredEmail||''
export const isTeacherAuthConfigured=()=>Boolean(configuredEmail&&configuredPassword)
export function loginTeacher(email,password){if(!isTeacherAuthConfigured())return{success:false,reason:'not_configured'};if(email.trim().toLowerCase()!==configuredEmail||password!==configuredPassword)return{success:false,reason:'invalid'};sessionStorage.setItem(AUTH_KEY,JSON.stringify({email:configuredEmail,authenticatedAt:new Date().toISOString()}));return{success:true}}
export const logoutTeacher=()=>sessionStorage.removeItem(AUTH_KEY)
export function isTeacherLoggedIn(){if(!isTeacherAuthConfigured())return false;try{const session=JSON.parse(sessionStorage.getItem(AUTH_KEY));return session?.email===configuredEmail}catch{sessionStorage.removeItem(AUTH_KEY);return false}}
export const requireTeacherAuth=()=>isTeacherLoggedIn()
// MVP only: Vite environment values are shipped to the browser. Use backend authentication for production.
