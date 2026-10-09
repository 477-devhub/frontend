// HACKATHON-DAY local-only state supplier; swap provider only in a future integration task.
import { useEffect, useRef, useState } from 'react'
import { LocalProvider } from './localProvider'
import type { AckBody, ApiIncident, ClipMetadata, Snapshot, Suppressed } from '../contracts/api'
export type ViewState = 'ready' | 'loading' | 'error' | 'stale'
export function useConsole(scene: number, selectedId: string | null) {
  const [provider]=useState(() => new LocalProvider())
  const inFlight=useRef(false)
  const [snapshot,setSnapshot]=useState<Snapshot | null>(null)
  const [suppressed,setSuppressed]=useState<Suppressed[]>([])
  const [incident,setIncident]=useState<ApiIncident | null>(null)
  const [clip,setClip]=useState<ClipMetadata | null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [viewState,setViewState]=useState<ViewState>('ready')
  const generation=useRef(0)
  const refresh=async () => {
    setSnapshot(await provider.getSnapshot()); setSuppressed(await provider.getSuppressed())
    if (selectedId) {
      try { setIncident(await provider.getIncident(selectedId)); setClip(await provider.getClip(selectedId)) }
      catch { setIncident(null); setClip(null) }
    } else { setIncident(null); setClip(null) }
  }
  useEffect(() => {
    const revision=++generation.current
    setError(''); setMessage(''); setIncident(null); setClip(null)
    provider.loadScene(scene).then(async () => {
      if (generation.current === revision) { setSnapshot(await provider.getSnapshot()); setSuppressed(await provider.getSuppressed()) }
    })
    return () => { generation.current++ }
  },[provider,scene])
  useEffect(() => {
    let live=true
    if (!selectedId) { setIncident(null);setClip(null);return }
    Promise.all([provider.getIncident(selectedId),provider.getClip(selectedId)]).then(([i,c]) => { if(live){setIncident(i);setClip(c)} }).catch(() => {if(live){setIncident(null);setClip(null)}})
    return () => {live=false}
  },[provider,selectedId,snapshot?.revision])
  const mutate=async (operation: () => Promise<unknown>, success: string) => {
    if(inFlight.current || viewState!=='ready') return
    inFlight.current=true
    setBusy(true);setError('');setMessage('')
    try { await operation(); await refresh();setMessage(success) }
    catch(e){setError(e instanceof Error ? e.message : '로컬 작업이 실패했습니다.')}
    finally{inFlight.current=false;setBusy(false)}
  }
  return {snapshot,suppressed,incident,clip,busy,message,error,viewState,setViewState,
    ack:(id:string,body:AckBody) => mutate(() => provider.ack(id,body,crypto.randomUUID()),'로컬 데모 상태를 변경했습니다. 외부 요청은 전송하지 않았습니다.'),
    restore:(id:string) => mutate(() => provider.restore(id,crypto.randomUUID()),'로컬 데모 알림을 복원했습니다.')}
}
