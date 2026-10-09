import { useState } from 'react'
import type { AckBody, ApiIncident, ClipMetadata, Snapshot } from '../contracts/api'
import { camLabel } from '../data/cameras'
import { incidentTone, LEVEL_LABEL, percent, riskText } from '../console/presentation'
import { FACTOR_META, RISK_FORMULA } from '../risk'
import { CameraTile } from './CameraTile'
interface Props {snapshot:Snapshot;incident:ApiIncident|null;clip:ClipMetadata|null;busy:boolean;onBack:()=>void;onOpen:(id:string)=>void;onAck:(id:string,body:AckBody)=>void}
export function DetailView({snapshot,incident,clip,busy,onBack,onOpen,onAck}:Props){
 const [operator,setOperator]=useState('')
 if(!incident) return <main className="body"><section className="card"><h2>선택한 사건이 없습니다</h2><p>목록에서 사건을 선택하세요.</p><button className="btn" type="button" onClick={onBack}>← 목록</button></section></main>
 const tone=incidentTone(incident)
 const camera=snapshot.cameras.find(c=>c.id===incident.primary_cam)
 const next=snapshot.incidents.find(i=>i.id===incident.next_incident_id)
 return <main className="body detail">
  <div className="detail-left">
   <div className="detail-title"><button type="button" className="back" onClick={onBack}>← 목록</button><h1>{incident.title}</h1><span className="badge" data-tone={tone}>{LEVEL_LABEL[incident.level]}</span></div>
   <p className="muted">{camLabel(incident.primary_cam)} · {incident.id} · 상태 {incident.status}</p>
   {camera?<CameraTile camera={camera} size="lg" active/>:<div className="media-placeholder">카메라 정보 미제공</div>}
   <section className="card moments"><h2>사건 영상 구간</h2><p>{clip?.start != null && clip.end != null ? `원본 영상 ${clip.start}–${clip.end}초 · 영상 길이 ${clip.duration_sec ?? '미측정'}` : '영상 구간 미제공'}</p><p>영상 미연결 · 로컬 프리뷰이며 실제 사건 영상 재생이 아닙니다.</p>{clip?.range_valid===false&&<p role="alert">영상 구간이 원본 길이를 벗어납니다.</p>}</section>
   <section className="card moments"><h2>사건 타임라인</h2>{incident.timeline.length?<ol>{incident.timeline.map((m,i)=><li key={i}>{m.t} · {m.label}</li>)}</ol>:<p className="muted">타임라인 미제공</p>}</section>
   <section className="card same-event"><div><h2>관련 카메라 근거</h2>{incident.related_views.length?<ul>{incident.related_views.map(v=><li key={v.cam_id}>{camLabel(v.cam_id)} · 관계 확신도 {percent(v.match_confidence)} · 이미지 미연결</li>)}</ul>:<p>관련 view 근거 미제공 · 동일 사건이나 인물이라고 가정하지 않습니다.</p>}</div></section>
  </div>
  <aside className="detail-right">
   <section className="risk" data-tone={tone}><div className="risk-head"><span>서버 위험도</span><span>{LEVEL_LABEL[incident.level]}</span></div><div className="risk-score"><strong className={incident.risk===null?'unknown-score':''}>{riskText(incident.risk)}</strong>{incident.risk!==null&&<span className="risk-max">/100</span>}</div><p>확신도 {percent(incident.confidence)} · 위험도와 별개</p>
    <dl className="risk-factors">{FACTOR_META.map(({key,label})=>{const value=incident.risk_axes?.[key];return <div key={key}><dt>{label}</dt><div className="risk-track"><div style={{width:value==null?'0%':Math.round(value*100)+'%'}}/></div><dd>{percent(value)}</dd></div>})}</dl><p className="risk-formula">{RISK_FORMULA}</p>
   </section>
   <section className="card why"><h2>판단 근거</h2>{incident.evidence.length?<ol>{incident.evidence.map(e=><li key={e.frame_id}><span className="why-when">{(e.timestamp_ms/1000).toFixed(2)}초</span><div><b>{e.text}</b><p>{e.frame_id} · {e.frame_url?'근거 이미지 미연결':'근거 이미지 미제공'}</p></div></li>)}</ol>:<p>입력 frame 근거 미제공 · 예시 이미지를 실제 근거로 사용하지 않습니다.</p>}</section>
   <section className="card next-action"><h2>의견과 다음 행동</h2><p>{incident.ai_opinion ?? 'AI 의견 미제공'}</p>{incident.needs_human_review&&<p className="incident-review">사람 검토 필요 · {incident.uncertainty_reason ?? '불확실성 확인 필요'}</p>}
    {next?<button type="button" className="btn" onClick={()=>onOpen(next.id)}>다음 사건: {next.title}</button>:<p>다음 확인 사건이 없습니다.</p>}
    {incident.status!=='dismissed'&&<><button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={()=>onAck(incident.id,{action:'verify'})}>확인 완료</button>
     <button type="button" className="btn btn-lg" disabled={busy||incident.dispatch_requested} onClick={()=>onAck(incident.id,{action:'request_dispatch'})}>{incident.dispatch_requested?'대응 요청 의도 기록됨':'대응 요청 의도 기록'}</button>
     <div className="next-secondary"><button type="button" className="btn" disabled={busy} onClick={()=>onAck(incident.id,{action:'dismiss'})}>이상 없음으로 종결</button><button type="button" className="btn" disabled={busy} onClick={()=>onAck(incident.id,{action:incident.needs_human_review?'confirm_review':'needs_review'})}>{incident.needs_human_review?'검토 표시 해제':'사람 검토 요청'}</button></div>
     <label className="operator-label">인계할 관제사<input value={operator} maxLength={100} onChange={e=>setOperator(e.target.value)} placeholder="관제사 식별자"/></label><button type="button" className="btn" disabled={busy||!operator.trim()} onClick={()=>onAck(incident.id,{action:'handover',to_operator:operator.trim()})}>인계 기록</button></>}
    {incident.assigned_operator&&<p>인계 대상: {incident.assigned_operator}</p>}<p className="next-note">로컬 상태 변경만 수행합니다. 실제 신고·인계·서버 요청은 전송하지 않습니다.</p>
   </section>
  </aside>
 </main>
}
