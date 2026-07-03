import { useState } from 'react'
import { Bot, Check, Clock3, Copy, Download, FilePlus2, FileText, Pencil, Plus, Save, Scale, Settings, Trash2, X } from 'lucide-react'
import { deleteAttachment, downloadAttachment, saveAttachment } from '../utils/fileStorage'
import { generateAiAssessment, getStoredApiKey, isAiGradingConfigured, setStoredApiKey, usingEndpoint } from '../utils/aiGrading'
import { getPapers, getRubrics, savePapers, saveRubrics, uid } from '../utils/storage'

const emptyCriterion=()=>({id:uid(),name:'',description:'',maxPoints:10})
const emptyRubric=()=>({title:'',assignment:'',description:'',criteria:[emptyCriterion()]})
const emptyPaper=()=>({studentName:'',studentEmail:'',course:'',assignment:'',rubricId:'',paperText:'',file:null})

function buildGradeReport(paper,rubric){
  const max=rubric.criteria.reduce((s,c)=>s+c.maxPoints,0)
  const pct=max&&paper.grade!==null?Math.round((paper.grade/max)*100):null
  const lines=[
    'GRADE REPORT',
    '─'.repeat(40),
    `Student:    ${paper.studentName}`,
    paper.studentEmail?`Email:      ${paper.studentEmail}`:'',
    paper.course?`Course:     ${paper.course}`:'',
    `Assignment: ${paper.assignment}`,
    `Rubric:     ${rubric.title}`,
    '',
    'CRITERION GRADES',
    '─'.repeat(40),
    ...rubric.criteria.map(c=>{
      const g=paper.criterionGrades.find(x=>x.criterionId===c.id)
      const score=g?.score??'—'
      const line=`${c.name}: ${score} / ${c.maxPoints}`
      return g?.comment?`${line}\n  → ${g.comment}`:line
    }),
    '',
    '─'.repeat(40),
    `TOTAL:  ${paper.grade??'—'} / ${max}${pct!==null?`  (${pct}%)` :''}`,
    '',
    paper.comments?`OVERALL COMMENTS\n${paper.comments}`:'',
    paper.aiStatus==='generated'?`\n[Grades generated with AI assistance — reviewed and confirmed by teacher]`:'',
  ].filter(l=>l!==undefined&&l!==false&&l!=='')
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()
}

export default function GradingPapers(){
  const [tab,setTab]=useState('papers')
  const [papers,setPapers]=useState(getPapers)
  const [rubrics,setRubrics]=useState(getRubrics)
  const [rubricForm,setRubricForm]=useState(null)
  const [paperForm,setPaperForm]=useState(null)
  const [selectedId,setSelectedId]=useState(null)
  const [notice,setNotice]=useState('')
  const [showSettings,setShowSettings]=useState(false)
  const [apiKeyDraft,setApiKeyDraft]=useState(getStoredApiKey)
  const [keySaved,setKeySaved]=useState(false)

  const selected=papers.find(p=>p.id===selectedId)
  const rubric=selected&&rubrics.find(r=>r.id===selected.rubricId)
  const persistPapers=next=>{setPapers(next);savePapers(next)}
  const persistRubrics=next=>{setRubrics(next);saveRubrics(next)}

  const saveKey=()=>{
    setStoredApiKey(apiKeyDraft)
    setKeySaved(true)
    setTimeout(()=>setKeySaved(false),2500)
    setNotice(apiKeyDraft.trim()?'API key saved. AI grading is now active.':'API key removed.')
  }
  const clearKey=()=>{setApiKeyDraft('');setStoredApiKey('');setNotice('API key removed.')}

  const saveRubric=e=>{
    e.preventDefault()
    const criteria=rubricForm.criteria.filter(c=>c.name.trim()).map(c=>({...c,maxPoints:Number(c.maxPoints)}))
    if(!rubricForm.title.trim()||!rubricForm.assignment.trim()||!criteria.length||criteria.some(c=>c.maxPoints<=0))
      return setNotice('Add a title, assignment, and at least one criterion with positive points.')
    const now=new Date().toISOString(),record={...rubricForm,criteria,updatedAt:now}
    persistRubrics(rubricForm.id?rubrics.map(r=>r.id===record.id?record:r):[{...record,id:uid(),createdAt:now},...rubrics])
    setRubricForm(null)
    setNotice('Rubric saved.')
  }

  const savePaperRecord=async e=>{
    e.preventDefault()
    if(!paperForm.studentName.trim()||!paperForm.assignment.trim()||!paperForm.rubricId)
      return setNotice('Student name, assignment, and rubric are required.')
    const now=new Date().toISOString(),id=uid()
    let attachment=null
    try{if(paperForm.file)attachment=await saveAttachment(paperForm.file,`grading:${id}`)}
    catch{return setNotice('The paper file could not be stored in this browser.')}
    const record={id,studentName:paperForm.studentName.trim(),studentEmail:paperForm.studentEmail.trim(),course:paperForm.course.trim(),assignment:paperForm.assignment.trim(),rubricId:paperForm.rubricId,paperText:paperForm.paperText.trim(),attachment,status:'not_graded',criterionGrades:[],grade:null,comments:'',aiStatus:'not_generated',aiGeneratedAt:'',createdAt:now,updatedAt:now}
    persistPapers([record,...papers])
    setPaperForm(null)
    setSelectedId(id)
    setNotice('Paper added. Open it below to start grading.')
  }

  const updatePaper=changes=>persistPapers(papers.map(p=>p.id===selectedId?{...p,...changes,updatedAt:new Date().toISOString()}:p))
  const removePaper=async paper=>{
    if(!confirm(`Delete ${paper.studentName}'s paper record?`))return
    if(paper.attachment)try{await deleteAttachment(paper.attachment.id)}catch{}
    persistPapers(papers.filter(p=>p.id!==paper.id))
    setSelectedId(null)
  }
  const removeRubric=item=>{
    if(papers.some(p=>p.rubricId===item.id))return setNotice('This rubric is in use by a paper and cannot be deleted.')
    if(confirm(`Delete rubric "${item.title}"?`))persistRubrics(rubrics.filter(r=>r.id!==item.id))
  }

  const gradedPapers=papers.filter(p=>p.status==='graded')
  const pendingCount=papers.filter(p=>p.status!=='graded').length
  const avgPct=gradedPapers.length?Math.round(gradedPapers.reduce((sum,p)=>{
    const r=rubrics.find(r=>r.id===p.rubricId)
    const max=r?r.criteria.reduce((s,c)=>s+c.maxPoints,0):0
    return sum+(max?(p.grade/max)*100:0)
  },0)/gradedPapers.length):null

  const aiConfigured=isAiGradingConfigured()
  const openSettings=()=>{setShowSettings(true);window.scrollTo({top:0,behavior:'smooth'})}

  return <div className="dashboard-content grading-page">
    <div className="page-heading">
      <div>
        <span className="eyebrow">Grading workspace</span>
        <h1>Grading Papers</h1>
        <p>Add student papers, apply reusable rubrics, and grade with AI assistance or manually.</p>
      </div>
      <div style={{display:'flex',gap:'9px',alignItems:'center'}}>
        <button className={`btn btn-ghost btn-sm${aiConfigured?' ai-active':''}`} onClick={()=>setShowSettings(!showSettings)}>
          <Settings size={16}/>{aiConfigured?'AI active':'Set up AI'}
        </button>
        <button className="btn btn-primary" onClick={()=>tab==='papers'?setPaperForm(emptyPaper()):setRubricForm(emptyRubric())}>
          <Plus size={17}/>{tab==='papers'?'Add paper':'Create rubric'}
        </button>
      </div>
    </div>

    {showSettings&&<section className="card ai-settings-panel">
      <div className="ai-settings-head">
        <div><span className="eyebrow">AI configuration</span><h2>AI grading settings</h2></div>
        <button className="icon-btn" onClick={()=>setShowSettings(false)}><X size={18}/></button>
      </div>
      {usingEndpoint()
        ?<div className="ai-endpoint-note"><Bot size={17}/><div><strong>Using secure backend endpoint</strong><span>Your grading requests are processed by your configured backend. AI grading is ready.</span></div></div>
        :<div className="ai-key-form">
          <p className="ai-key-note">Enter your OpenAI API key below to enable AI-powered grading directly in the browser. The key is saved only in this browser's local storage and sent directly to OpenAI — it never passes through any other server.</p>
          <div className="ai-key-row">
            <input type="password" value={apiKeyDraft} onChange={e=>setApiKeyDraft(e.target.value)} placeholder="sk-proj-…" onKeyDown={e=>e.key==='Enter'&&saveKey()}/>
            <button className="btn btn-primary btn-sm" onClick={saveKey}><Check size={15}/>{keySaved?'Saved!':'Save key'}</button>
            {getStoredApiKey()&&<button className="btn btn-ghost btn-sm" onClick={clearKey}><Trash2 size={15}/>Remove</button>}
          </div>
          <p className="ai-key-hint">Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a>. Papers are graded using <strong>gpt-4o-mini</strong>. Paste the student's paper text when adding a paper to get the best results.</p>
        </div>
      }
    </section>}

    {papers.length>0&&<div className="grading-foundations">
      <div className="card grading-foundation-card">
        <span><FileText size={20}/></span>
        <h3>{papers.length}</h3>
        <p>Papers added</p>
        <small>All submissions</small>
      </div>
      <div className="card grading-foundation-card">
        <span className="gf-green"><Check size={20}/></span>
        <h3>{gradedPapers.length}</h3>
        <p>Graded</p>
        <small>With final score</small>
      </div>
      <div className="card grading-foundation-card">
        <span className="gf-amber"><Clock3 size={20}/></span>
        <h3>{pendingCount}</h3>
        <p>Pending</p>
        <small>Awaiting grade</small>
      </div>
      <div className="card grading-foundation-card">
        <span className="gf-blue"><Scale size={20}/></span>
        <h3>{avgPct!==null?`${avgPct}%`:'—'}</h3>
        <p>Average score</p>
        <small>Across graded papers</small>
      </div>
    </div>}

    {notice&&<div className="grading-notice"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={16}/></button></div>}

    <div className="grading-tabs">
      <button className={tab==='papers'?'active':''} onClick={()=>setTab('papers')}><FileText size={17}/>Papers <span>{papers.length}</span></button>
      <button className={tab==='rubrics'?'active':''} onClick={()=>setTab('rubrics')}><Scale size={17}/>Rubrics <span>{rubrics.length}</span></button>
    </div>

    {tab==='papers'
      ?<PapersView papers={papers} rubrics={rubrics} selectedId={selectedId} setSelectedId={setSelectedId} onAdd={()=>setPaperForm(emptyPaper())}/>
      :<RubricsView rubrics={rubrics} onAdd={()=>setRubricForm(emptyRubric())} onEdit={item=>setRubricForm({...item,criteria:item.criteria.map(c=>({...c}))})} onDelete={removeRubric}/>
    }

    {selected&&rubric&&<AssessmentPanel
      key={selectedId}
      paper={selected}
      rubric={rubric}
      onClose={()=>setSelectedId(null)}
      onUpdate={updatePaper}
      onDelete={()=>removePaper(selected)}
      onNotice={setNotice}
      aiConfigured={aiConfigured}
      onOpenSettings={openSettings}
    />}

    {rubricForm&&<RubricModal value={rubricForm} setValue={setRubricForm} onClose={()=>setRubricForm(null)} onSubmit={saveRubric}/>}
    {paperForm&&<PaperModal value={paperForm} setValue={setPaperForm} rubrics={rubrics} onClose={()=>setPaperForm(null)} onSubmit={savePaperRecord}/>}
  </div>
}

function PapersView({papers,rubrics,selectedId,setSelectedId,onAdd}){
  if(!papers.length)return <Empty icon={FilePlus2} title="No papers yet" text="Add a student paper and connect it to a grading rubric to get started." action="Add first paper" onAction={onAdd}/>
  return <div className="paper-grid">{papers.map(p=>{
    const r=rubrics.find(r=>r.id===p.rubricId)
    const max=r?r.criteria.reduce((s,c)=>s+c.maxPoints,0):0
    return <button className={`paper-card card${selectedId===p.id?' selected':''}`} onClick={()=>setSelectedId(p.id)} key={p.id}>
      <div>
        <span className={`grading-status ${p.status}`}>{p.status.replace('_',' ')}</span>
        {p.aiStatus==='generated'&&<span className="ai-draft-badge">AI</span>}
        <small>{p.course||'No course'}</small>
      </div>
      <h3>{p.studentName}</h3>
      <p>{p.assignment}</p>
      <footer>
        <span>{r?.title||'Rubric unavailable'}</span>
        <strong>{p.grade===null?'—':`${p.grade} / ${max}`}</strong>
      </footer>
    </button>
  })}</div>
}

function RubricsView({rubrics,onAdd,onEdit,onDelete}){
  if(!rubrics.length)return <Empty icon={Scale} title="No rubrics yet" text="Create your first reusable grading rubric before adding papers." action="Create rubric" onAction={onAdd}/>
  return <div className="rubric-grid">{rubrics.map(r=>{
    const total=r.criteria.reduce((sum,c)=>sum+c.maxPoints,0)
    return <article className="rubric-card card" key={r.id}>
      <div className="rubric-card-head">
        <span><Scale/></span>
        <div>
          <button onClick={()=>onEdit(r)} title="Edit"><Pencil size={16}/></button>
          <button onClick={()=>onDelete(r)} title="Delete"><Trash2 size={16}/></button>
        </div>
      </div>
      <small>{r.assignment}</small>
      <h3>{r.title}</h3>
      <p>{r.description||'No description'}</p>
      <div className="rubric-criteria-preview">{r.criteria.map(c=><span key={c.id}>{c.name}<strong>{c.maxPoints}</strong></span>)}</div>
      <footer>{r.criteria.length} criteria · {total} points total</footer>
    </article>
  })}</div>
}

function AssessmentPanel({paper,rubric,onClose,onUpdate,onDelete,onNotice,aiConfigured,onOpenSettings}){
  const [grades,setGrades]=useState(()=>rubric.criteria.map(c=>{
    const saved=paper.criterionGrades.find(g=>g.criterionId===c.id)
    return{criterionId:c.id,score:saved?.score??'',comment:saved?.comment||''}
  }))
  const [comments,setComments]=useState(paper.comments||'')
  const [loading,setLoading]=useState(false)
  const [copied,setCopied]=useState(false)

  const total=grades.reduce((sum,g)=>sum+(Number(g.score)||0),0)
  const max=rubric.criteria.reduce((sum,c)=>sum+c.maxPoints,0)
  const pct=max?Math.round((total/max)*100):0

  const save=()=>{
    if(grades.some((g,i)=>g.score===''||Number(g.score)<0||Number(g.score)>rubric.criteria[i].maxPoints))
      return onNotice('Every criterion needs a valid score within its allowed range.')
    onUpdate({criterionGrades:grades.map(g=>({...g,score:Number(g.score)})),grade:total,comments,status:'graded'})
    onNotice('Grade saved successfully.')
  }

  const runAi=async()=>{
    setLoading(true)
    try{
      const result=await generateAiAssessment(paper,rubric)
      setGrades(rubric.criteria.map(c=>{
        const g=result.criterionGrades.find(x=>x.criterionId===c.id)
        return{criterionId:c.id,score:g?.score??'',comment:g?.comment||''}
      }))
      setComments(result.comments)
      onUpdate({aiStatus:'generated',aiGeneratedAt:new Date().toISOString()})
      onNotice('AI draft generated. Review each criterion below and edit anything before saving.')
    }catch(err){
      onNotice(err.message)
    }finally{
      setLoading(false)
    }
  }

  const copyReport=async()=>{
    const snapshot={...paper,criterionGrades:grades.map(g=>({...g,score:Number(g.score)||0})),grade:total,comments}
    const max=rubric.criteria.reduce((s,c)=>s+c.maxPoints,0)
    const pct=max?Math.round((total/max)*100):0
    const lines=[
      'GRADE REPORT','─'.repeat(40),
      `Student:    ${paper.studentName}`,
      paper.studentEmail?`Email:      ${paper.studentEmail}`:'',
      paper.course?`Course:     ${paper.course}`:'',
      `Assignment: ${paper.assignment}`,
      `Rubric:     ${rubric.title}`,'',
      'CRITERION GRADES','─'.repeat(40),
      ...rubric.criteria.map(c=>{
        const g=grades.find(x=>x.criterionId===c.id)
        const score=g?.score??'—'
        return `${c.name}: ${score} / ${c.maxPoints}${g?.comment?'\n  → '+g.comment:''}`
      }),'',
      '─'.repeat(40),
      `TOTAL:  ${total} / ${max}  (${pct}%)`,'',
      comments?`OVERALL COMMENTS\n${comments}`:'',
      paper.aiStatus==='generated'?'\n[Grades generated with AI assistance — reviewed and confirmed by teacher]':'',
    ].filter(l=>l!==undefined&&l!=='')
    await navigator.clipboard.writeText(lines.join('\n').replace(/\n{3,}/g,'\n\n').trim())
    setCopied(true)
    setTimeout(()=>setCopied(false),2200)
  }

  return <div className="grading-panel card">
    <header>
      <div>
        <span className="eyebrow">Assessment</span>
        <h2>{paper.studentName}</h2>
        <p>{paper.assignment} · {rubric.title}</p>
        {paper.aiStatus==='generated'&&<span className="ai-generated-badge">AI draft — review and edit all fields before saving</span>}
      </div>
      <button className="icon-btn" onClick={onClose}><X/></button>
    </header>

    <div className="paper-actions">
      {paper.attachment&&<button className="btn btn-ghost btn-sm" onClick={()=>downloadAttachment(paper.attachment.id)}><Download size={16}/>Download {paper.attachment.fileName}</button>}
      {aiConfigured
        ?<>
          <button className="btn btn-secondary btn-sm" disabled={loading} onClick={runAi} title={!paper.paperText?'No paper text — AI will give general feedback':'Generate criterion scores and comments with AI'}>
            <Bot size={16}/>{loading?'Generating…':'Generate AI draft'}
          </button>
          {!paper.paperText&&<span className="ai-no-text-hint">No paper text — paste it when editing for best results</span>}
        </>
        :<button className="btn btn-ghost btn-sm" onClick={onOpenSettings}><Bot size={16}/>Set up AI grading</button>
      }
    </div>

    <div className="grading-criteria-editor">
      {rubric.criteria.map((criterion,index)=><div className="criterion-grade" key={criterion.id}>
        <div>
          <strong>{criterion.name}</strong>
          {criterion.description&&<span>{criterion.description}</span>}
        </div>
        <label>
          Score
          <input
            type="number"
            min="0"
            max={criterion.maxPoints}
            value={grades[index]?.score??''}
            onChange={e=>setGrades(grades.map((g,i)=>i===index?{...g,score:e.target.value}:g))}
          />
          <small>/ {criterion.maxPoints}</small>
        </label>
        <label>
          Criterion feedback
          <textarea
            value={grades[index]?.comment||''}
            onChange={e=>setGrades(grades.map((g,i)=>i===index?{...g,comment:e.target.value}:g))}
            placeholder="Specific feedback for this criterion…"
          />
        </label>
      </div>)}
    </div>

    <label className="overall-comments">
      Overall comments
      <textarea rows="5" value={comments} onChange={e=>setComments(e.target.value)} placeholder="Write or edit the overall feedback for this paper…"/>
    </label>

    <div className="grading-panel-footer">
      <div>
        <small>Total grade</small>
        <strong>{total} / {max}<span className="grade-pct">{max?` · ${pct}%`:''}</span></strong>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={copyReport}><Copy size={16}/>{copied?'Copied!':'Copy report'}</button>
      <button className="btn btn-ghost delete" onClick={onDelete}><Trash2 size={16}/>Delete</button>
      <button className="btn btn-primary" onClick={save}><Save size={16}/>Save grade</button>
    </div>
  </div>
}

function RubricModal({value,setValue,onClose,onSubmit}){
  const updateCriterion=(id,changes)=>setValue({...value,criteria:value.criteria.map(c=>c.id===id?{...c,...changes}:c)})
  const total=value.criteria.reduce((sum,c)=>sum+(Number(c.maxPoints)||0),0)
  return <Modal title={value.id?'Edit rubric':'Create rubric'} onClose={onClose}>
    <form className="grading-form" onSubmit={onSubmit}>
      <div className="field-grid">
        <label>Rubric title<input value={value.title} onChange={e=>setValue({...value,title:e.target.value})} required/></label>
        <label>Assignment<input value={value.assignment} onChange={e=>setValue({...value,assignment:e.target.value})} required/></label>
      </div>
      <label>Description (optional)<textarea rows="2" value={value.description} onChange={e=>setValue({...value,description:e.target.value})}/></label>
      <div className="criteria-builder">
        <div><strong>Grading criteria</strong><span>Total: {total} points</span></div>
        {value.criteria.map((c,index)=><div className="criterion-builder-row" key={c.id}>
          <span>{index+1}</span>
          <input placeholder="Criterion name" value={c.name} onChange={e=>updateCriterion(c.id,{name:e.target.value})}/>
          <input placeholder="Description (optional)" value={c.description} onChange={e=>updateCriterion(c.id,{description:e.target.value})}/>
          <input className="points-input" type="number" min="1" value={c.maxPoints} onChange={e=>updateCriterion(c.id,{maxPoints:e.target.value})}/>
          <button type="button" title="Remove criterion" onClick={()=>setValue({...value,criteria:value.criteria.filter(x=>x.id!==c.id)})}><Trash2 size={16}/></button>
        </div>)}
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setValue({...value,criteria:[...value.criteria,emptyCriterion()]})}><Plus size={16}/>Add criterion</button>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary"><Check size={16}/>Save rubric</button>
      </div>
    </form>
  </Modal>
}

function PaperModal({value,setValue,rubrics,onClose,onSubmit}){
  return <Modal title="Add student paper" onClose={onClose}>
    {!rubrics.length
      ?<div className="empty-page"><p>Create a rubric before adding a paper.</p><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
      :<form className="grading-form" onSubmit={onSubmit}>
        <div className="field-grid">
          <label>Student name *<input value={value.studentName} onChange={e=>setValue({...value,studentName:e.target.value})} required/></label>
          <label>Student email<input type="email" value={value.studentEmail} onChange={e=>setValue({...value,studentEmail:e.target.value})}/></label>
          <label>Course / group<input value={value.course} onChange={e=>setValue({...value,course:e.target.value})}/></label>
          <label>Assignment *<input value={value.assignment} onChange={e=>setValue({...value,assignment:e.target.value})} required/></label>
        </div>
        <label>Grading rubric *
          <select value={value.rubricId} onChange={e=>setValue({...value,rubricId:e.target.value})} required>
            <option value="">Choose a rubric…</option>
            {rubrics.map(r=><option value={r.id} key={r.id}>{r.title} — {r.assignment}</option>)}
          </select>
        </label>
        <label>Paper file
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>setValue({...value,file:e.target.files?.[0]||null})}/>
          <small>Stored in this browser only (IndexedDB). Not sent anywhere.</small>
        </label>
        <label>
          Paper text for AI grading
          <textarea rows="8" value={value.paperText} onChange={e=>setValue({...value,paperText:e.target.value})} placeholder="Paste the paper text here. The AI reads this to grade each criterion and write comments. Without text, AI gives general feedback only."/>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"><FilePlus2 size={16}/>Add paper</button>
        </div>
      </form>
    }
  </Modal>
}

function Modal({title,onClose,children}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="grading-modal card"><header><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X/></button></header>{children}</div></div>}
function Empty({icon:Icon,title,text,action,onAction}){return <div className="empty-page card"><span className="empty-icon"><Icon/></span><h2>{title}</h2><p>{text}</p><button className="btn btn-primary" onClick={onAction}>{action}</button></div>}
