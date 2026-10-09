import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { CctvWall } from './components/CctvWall'
import { AnalysisPanel } from './components/AnalysisPanel'
import { QueuePanel } from './components/QueuePanel'
import { DetailView } from './components/DetailView'
import { useConsole, type ViewState } from './console/useConsole'
import { useClock } from './useClock'
import { useFitScale } from './useFitScale'
const hashStep=()=>{const n=Number(window.location.hash.slice(1));return Number.isInteger(n)&&n>=1&&n<=6?n:1}
export default function App(){
 const [step,setStep]=useState(hashStep)
 const [listStep,setListStep]=useState(3)
 const [selectedId,setSelectedId]=useState<string|null>('INC-032')
 const clock=useClock();const fit=useFitScale()
 const state=useConsole(step===6?listStep:step,selectedId)
 useEffect(()=>{const handler=()=>setStep(hashStep());window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler)},[])
 const goTo=(n:number)=>{if(n===6&&step!==6&&step>=3)setListStep(step);setStep(n);window.history.replaceState(null,'','#'+n)}
 const open=(id:string)=>{setSelectedId(id);goTo(6)}
 const canMutate=state.busy||state.viewState!=='ready'
 return <div className="app" style={fit}>
  <Header step={step} onStep={goTo} clock={clock}/>
  <section className="offline-bar" aria-label="로컬 데모 상태"><b>백엔드 미연결 · 합성 데모</b><span>실제 영상·추론·외부 요청 없음</span>
   <label>표시 상태 <select value={state.viewState} onChange={e=>state.setViewState(e.target.value as ViewState)}><option value="ready">로컬 데이터</option><option value="loading">로딩 예시</option><option value="error">오류 예시</option><option value="stale">오래된 데이터 예시</option></select></label>
  </section>
  {state.viewState!=='ready'&&<div className="connection-banner" role={state.viewState==='loading'?'status':'alert'}>{state.viewState==='loading'?'로딩 표시 예시 · 아래는 마지막 로컬 데이터입니다.':state.viewState==='error'?'오류 표시 예시 · 정상 작동으로 표시하지 않습니다.':'오래된 데이터 표시 예시 · 판단 시점을 다시 확인해야 합니다.'}</div>}
  {state.error&&<div className="connection-banner" role="alert">{state.error}</div>}{state.message&&<div className="action-feedback" role="status">{state.message}</div>}
  {!state.snapshot?<p className="wall-empty" role="status">로컬 fixture 준비 중</p>:step===6?<DetailView key={selectedId} snapshot={state.snapshot} incident={state.incident} clip={state.clip} busy={canMutate} onBack={()=>goTo(listStep)} onOpen={open} onAck={state.ack}/>:<main className="body"><div className="left"><CctvWall key={step} snapshot={state.snapshot}/><AnalysisPanel snapshot={state.snapshot}/></div><QueuePanel snapshot={state.snapshot} suppressed={state.suppressed} busy={canMutate} onOpen={open} onVerify={id=>state.ack(id,{action:'verify'})} onRestore={state.restore}/></main>}
 </div>
}
