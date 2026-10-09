import type { Snapshot, Suppressed } from '../contracts/api'
import { IncidentCard } from './IncidentCard'
import { camLabel, previewFor } from '../data/cameras'
import critical from '../assets/legend-critical.svg'
import high from '../assets/legend-high.svg'
import review from '../assets/legend-review.svg'
import ok from '../assets/dot-ok-8.svg'
import field1 from '../assets/camera-field-1.svg'
import field2 from '../assets/camera-field-2.svg'
import field3 from '../assets/camera-field-3.svg'
import field4 from '../assets/camera-field-4.svg'
import field5 from '../assets/camera-field-5.svg'
interface Props {remote?:boolean;snapshot:Snapshot;suppressed:Suppressed[];busy:boolean;onOpen:(id:string)=>void;onVerify:(id:string)=>void;onRestore:(id:string)=>void}
export function QueuePanel({snapshot,suppressed,busy,remote=false,onOpen,onVerify,onRestore}:Props){
 const n=snapshot.active_count
 const field=snapshot.is_demo?n?snapshot.level_counts.review?field5:n>1?field4:field3:snapshot.suppressed_count?field2:field1:field1
 return <aside className="queue">
  <section className="hero">
   <p className="hero-kicker">지금 사람의 눈이 필요한 곳</p>
   <div className="hero-ratio"><strong data-active={n>0||undefined}>{n}</strong><span className="hero-total" title="제품 확장 목표이며 현재 연결 카메라 수가 아닙니다.">/ {snapshot.target_camera_capacity}</span><span className="spacer"/><div className="hero-msg"><b>{n?'먼저 확인할 곳을 알려드려요':'지금 확인할 사건이 없어요'}</b><span>등록 {snapshot.configured_cameras}대 · 확장 목표 {snapshot.target_camera_capacity}대</span></div></div>
   <img className="hero-field" src={field} alt={snapshot.is_demo?'합성 데모의 카메라 상태 맵':'확장 목표를 나타내는 장식 배열'} title="477개 점은 제품 목표를 표현합니다. 실제 연결 상태 지도가 아닙니다."/>
   <ul className="legend"><li><img src={critical} alt=""/>긴급</li><li><img src={high} alt=""/>높음</li><li><img src={review} alt=""/>사람 검토</li><li><span className="legend-box"/>화면 표시 {snapshot.cameras.length}대</li></ul>
  </section>
  <div className="queue-head"><h2>확인 순서</h2><span className="muted">AI가 위험도 순으로 정렬</span></div>
  {!n&&<section className="card queue-empty"><h3><img src={ok} alt=""/>지금 확인할 사건이 없습니다</h3><p>{snapshot.is_demo?'합성 데모 상태입니다. 이상이 생기면 신호색으로 알려드려요.':'대기 사건 없음은 현장의 안전을 확정하는 판정이 아닙니다.'}</p></section>}
  {!n&&!snapshot.suppressed_count&&<section className="card today"><h3>현재 관제 현황</h3><dl><div><dt>등록 카메라</dt><dd>{snapshot.configured_cameras}대</dd></div><div><dt>현재 확인 대기 사건</dt><dd>{n}건</dd></div><div><dt>AI가 제외한 알림</dt><dd>{snapshot.suppressed_count}건</dd></div><div><dt>마지막 사건</dt><dd className="today-text">미제공</dd></div></dl></section>}
  {snapshot.incidents.map(i=><IncidentCard key={i.id} incident={i} remote={remote} remoteDemo={snapshot.is_demo} busy={busy} onOpen={onOpen} onVerify={onVerify}/>)}
  {suppressed.filter(s=>!s.restored).map(s=><section className="card excluded" key={s.id}><div className="excluded-head"><h3>AI가 제외한 알림</h3><span className="muted">{snapshot.suppressed_count}건</span></div><div className="excluded-body">{!remote||snapshot.is_demo?<img className="thumb" src={previewFor(s.cam_id,true)} alt="합성 데모 예시"/>:<div className="thumb media-placeholder">근거 없음</div>}<div><h4>{camLabel(s.cam_id)} · {s.stage1_label??'초기 판단 미제공'}</h4><p>{s.reason}</p><span className="excluded-status">위험도 {s.risk??'미측정'} · 알림 제외</span></div></div><button type="button" className="btn" disabled={busy} onClick={()=>onRestore(s.id)}>사람 검토로 복원</button></section>)}
 </aside>
}
