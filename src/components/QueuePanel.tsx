import type { Snapshot, Suppressed } from '../contracts/api'
import { IncidentCard } from './IncidentCard'
import { camLabel, previewFor } from '../data/cameras'
interface Props {snapshot:Snapshot;suppressed:Suppressed[];busy:boolean;onOpen:(id:string)=>void;onVerify:(id:string)=>void;onRestore:(id:string)=>void}
export function QueuePanel({snapshot,suppressed,busy,onOpen,onVerify,onRestore}:Props){
 return <aside className="queue">
  <section className="hero"><p className="hero-kicker">지금 사람의 눈이 필요한 곳 · 로컬 데모</p><div className="hero-ratio"><strong data-active={snapshot.active_count>0||undefined}>{snapshot.active_count}</strong><span className="hero-total">/ 등록 {snapshot.configured_cameras}</span></div><p>확장 목표 {snapshot.target_camera_capacity}대 · 실제 CCTV 연결은 없습니다.</p>
   <ul className="legend"><li>긴급 {snapshot.level_counts.critical}</li><li>높음 {snapshot.level_counts.high}</li><li>검토 {snapshot.level_counts.review}</li></ul>
  </section>
  <div className="queue-head"><h2>확인 순서</h2><span className="muted">서버 계약의 순위 유지</span></div>
  {!snapshot.incidents.length&&<section className="card queue-empty"><h3>현재 확인 대기 사건이 없습니다</h3><p>로컬 fixture 상태입니다. 실제 현장의 안전 여부를 나타내지 않습니다.</p></section>}
  {snapshot.incidents.map(i=><IncidentCard key={i.id} incident={i} busy={busy} onOpen={onOpen} onVerify={onVerify}/>)}
  {suppressed.filter(s=>!s.restored).map(s=><section className="card excluded" key={s.id}><div className="excluded-head"><h3>제외 알림 · {camLabel(s.cam_id)}</h3><span className="muted">합성 데모</span></div><div className="excluded-body"><img className="thumb" src={previewFor(s.cam_id,true)} alt="로컬 예시 이미지"/><div><h4>{s.stage1_label ?? '초기 판단 미제공'}</h4><p>{s.reason}</p><p>위험도 {s.risk ?? '미측정'}</p></div></div><button type="button" className="btn" disabled={busy} onClick={()=>onRestore(s.id)}>사람 검토로 복원</button></section>)}
  <p className="footnote">이 화면의 사건은 합성 데모입니다. 자동 신고와 실제 외부 요청은 하지 않습니다.</p>
 </aside>
}
