const endpoint=import.meta.env.VITE_AI_GRADING_ENDPOINT?.trim()
const KEY_STORAGE='teacherflow_openai_key'

export const getStoredApiKey=()=>{try{return localStorage.getItem(KEY_STORAGE)||''}catch{return''}}
export const setStoredApiKey=key=>{try{if(key?.trim())localStorage.setItem(KEY_STORAGE,key.trim());else localStorage.removeItem(KEY_STORAGE)}catch{}}
export const usingEndpoint=()=>Boolean(endpoint)
export const isAiGradingConfigured=()=>Boolean(endpoint)||Boolean(getStoredApiKey())

export async function generateAiAssessment(paper,rubric){
  if(endpoint){
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paper:{studentName:paper.studentName,course:paper.course,assignment:paper.assignment,text:paper.paperText},rubric:{title:rubric.title,assignment:rubric.assignment,criteria:rubric.criteria}})})
    if(!response.ok)throw new Error('The grading endpoint could not complete this request.')
    const data=await response.json()
    if(!Array.isArray(data.criterionGrades)||typeof data.comments!=='string')throw new Error('The grading endpoint returned an invalid response.')
    return data
  }

  const apiKey=getStoredApiKey()
  if(!apiKey)throw new Error('No AI configuration found. Add your OpenAI API key in the grading settings panel.')

  const criteriaList=rubric.criteria.map((c,i)=>`${i+1}. id="${c.id}" | ${c.name} | max ${c.maxPoints} pts${c.description?' | '+c.description:''}`).join('\n')
  const userPrompt=`You are an experienced academic grader. Grade the student paper below using the rubric criteria. Return ONLY a valid JSON object, no other text.

RUBRIC: ${rubric.title}
Assignment: ${rubric.assignment}
Student: ${paper.studentName}${paper.course?' ('+paper.course+')':''}

CRITERIA:
${criteriaList}

STUDENT PAPER:
${paper.paperText||'[No paper text provided — assess based on the assignment details and give moderate scores with constructive suggestions]'}

Return exactly this JSON structure:
{
  "criterionGrades": [
    { "criterionId": "<exact id from criteria>", "score": <integer between 0 and max>, "comment": "<specific, constructive feedback for this criterion>" }
  ],
  "comments": "<overall assessment in 2–4 sentences: strengths, areas for improvement, and grade justification>"
}`

  const res=await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body:JSON.stringify({
      model:'gpt-4o-mini',
      messages:[
        {role:'system',content:'You are an experienced academic grader. Always return valid JSON only, with no markdown or extra text.'},
        {role:'user',content:userPrompt}
      ],
      temperature:0.2,
      response_format:{type:'json_object'}
    })
  })

  if(!res.ok){
    let msg=`OpenAI error (${res.status})`
    try{const e=await res.json();msg=e.error?.message||msg}catch{}
    if(res.status===401)msg='Invalid API key. Please check your key in the AI settings panel.'
    if(res.status===429)msg='Rate limit reached. Wait a moment and try again.'
    if(res.status===400)msg='Bad request. Make sure your API key is valid and the paper text is not empty.'
    throw new Error(msg)
  }

  let result
  try{result=JSON.parse((await res.json()).choices[0].message.content)}
  catch{throw new Error('Could not parse the AI response. Please try again.')}

  if(!Array.isArray(result.criterionGrades)||typeof result.comments!=='string')
    throw new Error('AI returned an unexpected format. Please try again.')

  return result
}
