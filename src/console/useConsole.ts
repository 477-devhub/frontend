import defaultScenario from '../fixtures/demo-scenario.json'
import type { DemoScenario } from '../scenario/types'
// HACKATHON-DAY: navigation never resets API demo state.
import { useEffect, useRef, useState } from 'react'
import { LocalProvider, shouldAcceptSnapshot } from './localProvider'
import { ApiError, ApiProvider } from './apiProvider'
import type { AckBody, ApiIncident, ClipMetadata, Snapshot, Suppressed } from '../contracts/api'
export type ViewState='ready'|'loading'|'error'|'stale'
export type SourceMode='api'|'local'
export function useConsole(scene:number,selectedId:string|null,mode:SourceMode){
 const [provider]=useState(()=>mode==='api'?new ApiProvider():new LocalProvider(defaultScenario as DemoScenario))
 const [scenario,setScenario]=useState<DemoScenario|null>(null)
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null)
 const current=useRef<Snapshot|null>(null),inFlight=useRef(false),live=useRef(true),generation=useRef(0),connected=useRef(false)
 const [suppressed,setSuppressed]=useState<Suppressed[]>([]),[incident,setIncident]=useState<ApiIncident|null>(null),[clip,setClip]=useState<ClipMetadata|null>(null)
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[detailError,setDetailError]=useState('')
 const [viewState,setViewState]=useState<ViewState>('loading'),[connection,setConnection]=useState('connecting')
 const accept=(s:Snapshot,first=false)=>{if(live.current&&shouldAcceptSnapshot(current.current,s,first)){current.current=s;setSnapshot(s)}}
 const refresh=async()=>{const before=current.current;const s=await provider.getSnapshot();if(current.current===before || !current.current || current.current.server_instance_id===s.server_instance_id)accept(s);const excluded=await provider.getSuppressed();if(live.current && current.current?.server_instance_id===s.server_instance_id&&current.current.revision===s.revision)setSuppressed(excluded)}
 useEffect(()=>{
  live.current=true;const token=++generation.current
  const initialize=async()=>{
   try{if(provider.kind==='local-fixture')await provider.loadScene(scene);await refresh();if(live.current&&generation.current===token){setViewState(provider.kind==='api'&&!connected.current?'stale':'ready');setError('')}}
   catch(e){if(live.current&&generation.current===token){setViewState('error');setError(e instanceof Error?e.message:'조회 실패')}}
  }
  void initialize()
  void provider.getScenario().then(s=>{if(live.current&&generation.current===token)setScenario(s)}).catch(()=>{if(live.current)setScenario(null)})
  const stop=provider instanceof ApiProvider?provider.subscribe((s,first)=>{
   accept(s,first)
   if(first)void provider.getScenario().then(config=>{if(live.current)setScenario(config)}).catch(()=>{})
   void provider.getSuppressed().then(items=>{if(live.current&&current.current?.revision===s.revision&&current.current.server_instance_id===s.server_instance_id)setSuppressed(items)}).catch(e=>{if(live.current)setError(e.message)})
  },status=>{if(live.current){connected.current=status==='connected';setConnection(status);if(status==='connected'){setViewState('ready');setError('')}else if(current.current)setViewState('stale')}return false},e=>{if(live.current)setError(e.message)}):undefined
  return()=>{live.current=false;generation.current++;stop?.()}
 },[provider,provider.kind==='local-fixture'?scene:0])
 useEffect(()=>{
  let active=true
  setIncident(null);setClip(null);setDetailError('')
  if(!selectedId)return
  void provider.getIncident(selectedId).then(async i=>{
   if(!active)return
   setIncident(i)
   try{const c=await provider.getClip(selectedId);if(active)setClip(c)}
   catch(e){if(active)setDetailError(e instanceof Error?e.message:'영상 정보 조회 실패')}
  }).catch(e=>{if(active)setDetailError(e instanceof Error?e.message:'사건 조회 실패')})
  return()=>{active=false}
 },[provider,selectedId,snapshot?.revision,snapshot?.server_instance_id])
 const mutate=async(operation:()=>Promise<unknown>,success:string)=>{
  if(inFlight.current||viewState!=='ready')return
  inFlight.current=true;setBusy(true);setError('');setMessage('')
  try{await operation();await refresh();if(live.current)setMessage(success);return true}
  catch(e){if(live.current){setError(e instanceof Error?e.message:'작업 실패');if(e instanceof ApiError&&e.code==='network_error')setViewState('stale')}return false}
  finally{inFlight.current=false;if(live.current)setBusy(false)}
 }
 const retry=async()=>{setViewState('loading');try{await refresh();setViewState(provider.kind==='api'&&connection!=='connected'?'stale':'ready');setError('')}catch(e){setViewState('error');setError(e instanceof Error?e.message:'조회 실패')}}
 return{scenario,firstIncidentId:()=>{const group=scenario?.incidents.find(e=>e.enabled&&e.members.length>1);return current.current?.incidents.find(i=>i.id===group?.id)?.id??current.current?.incidents[0]?.id??null},snapshot,suppressed,incident,clip,busy,message,error,detailError,viewState,setViewState,connection,retry,
  ack:(id:string,body:AckBody)=>{
   const key=crypto.randomUUID()
   return mutate(async()=>{try{return await provider.ack(id,body,key)}catch(e){if(e instanceof ApiError&&e.code==='network_error')return provider.ack(id,body,key);throw e}},mode==='api'?'서버에 행동을 기록했습니다. 자동 신고는 수행하지 않습니다.':'로컬 상태를 변경했습니다.')
  },
  restore:(id:string)=>{const key=crypto.randomUUID();return mutate(async()=>{try{await provider.restore(id,key)}catch(e){if(e instanceof ApiError&&e.code==='network_error')await provider.restore(id,key);else throw e}},'사람 검토로 복원했습니다.')},
  demo:(step:number)=>mutate(()=>provider.loadScene(step),'')
 }
}
