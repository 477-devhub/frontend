import { useState } from 'react'
import { CameraTile } from './CameraTile'
import type { Snapshot } from '../contracts/api'
export function CctvWall({snapshot,remote=false}:{snapshot:Snapshot;remote?:boolean}){
 const [view,setView]=useState<'all'|'anomaly'>('all')
 const visible=view==='all'?snapshot.cameras:snapshot.cameras.filter(c=>['review','incident'].includes(c.status))
 return <section className="wall">
  <div className="wall-head"><div className="wall-title"><h2>CCTV 화면</h2><span>{visible.length}대 표시 · 등록 {snapshot.configured_cameras}대 · 확장 목표 {snapshot.target_camera_capacity}대</span></div>
   <div className="toggle" role="group" aria-label="화면 보기 방식"><button type="button" aria-pressed={view==='all'} onClick={()=>setView('all')}>전체 보기</button><button type="button" aria-pressed={view==='anomaly'} onClick={()=>setView('anomaly')}>사건·검토 화면</button></div>
  </div>
  {visible.length?<div className="grid">{visible.map(camera=><CameraTile key={camera.id} camera={camera} remote={remote} active={['incident','review'].includes(camera.status)}/>)}</div>:<p className="wall-empty">표시할 사건·검토 화면이 없습니다. 정상 판정을 뜻하지 않습니다.</p>}
 </section>
}
