export function validateBooking(form) {
  const errors = {}
  if (!form.name.trim()) errors.name='Please enter your full name.'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email='Please enter a valid email.'
  if (!form.topic.trim()) errors.topic='Please tell us what you would like to discuss.'
  if (!form.role) errors.role='Please select your role.'
  if (!form.meetingType) errors.meetingType='Please select a meeting type.'
  if (!form.duration || Number(form.duration)<10 || Number(form.duration)>60 || Number(form.duration)%5!==0) errors.duration='Duration must be 10–60 minutes in 5-minute steps.'
  if (!form.format) errors.format='Please select a meeting format.'
  if (!form.date || !form.startTime) errors.slot='Please select a time in the calendar.'
  if (form.format==='online' && !/^https?:\/\//i.test(form.onlineLink)) errors.onlineLink='Please add a valid meeting link starting with http.'
  return errors
}
export function validateStudentProfile(student) {
  if (!student.fullName.trim()) return 'Please enter the student’s full name.'
  if (!/^\S+@\S+\.\S+$/.test(student.email)) return 'Please enter a valid student email.'
  if (!student.programme || !student.yearOfStudy || !student.thesisStage || !student.status) return 'Please complete all profile classifications.'
  return ''
}
