import dotSignal from '../assets/dot-signal-6.svg'
import dotAmber from '../assets/dot-amber-6.svg'
import dotReview from '../assets/dot-indigo-6.svg'
import type { ApiIncident } from '../contracts/api'
import { mediaUrl } from '../console/apiProvider'
import { EvidenceImage } from './Media'
import { camLabel, previewFor } from '../data/cameras'
import { elapsed, incidentTone, LEVEL_LABEL, percent, riskText } from '../console/presentation'
interface Props {incident:ApiIncident;remote?:boolean;remoteDemo?:boolean;busy:boolean;onOpen:(id:string)=>void;onVerify:(id:string)=>void}
export function IncidentCard({incident,busy,onOpen,onVerify,remote=false,remoteDemo=false}:Props){
 const tone=incidentTone(incident)
 const dot=tone==="signal"?dotSignal:tone==="amber"?dotAmber:dotReview
 const thumb=remote&&!remoteDemo?mediaUrl(incident.evidence.find(e=>e.frame_url)?.frame_url):previewFor(incident.primary_cam,true)
 const filled=incident.risk===null?0:Math.round(incident.risk/10)
 return <article className="incident" data-tone={tone} data-emphasis={incident.rank===1||undefined}>
  <div className="incident-head"><span className="rank">{incident.rank ?? '—'}</span><span className="incident-cam">{camLabel(incident.primary_cam)} · {incident.location ?? '위치 미제공'}</span><span className="spacer"/><span className="incident-status"><img src={dot} alt=""/><b>{LEVEL_LABEL[incident.level]}{incident.needs_human_review?' · 사람 검토':''}</b><span> · {elapsed(incident.created_at)}</span></span></div>
  <div className="incident-body">{thumb?remote&&!remoteDemo?<EvidenceImage url={thumb} alt="사건 입력 근거"/>:<img className="thumb" src={thumb} alt="합성 데모 예시 이미지"/>:<div className="thumb media-placeholder">이미지 없음</div>}<div><h3>{incident.title}</h3><p>{incident.ai_opinion ?? incident.uncertainty_reason ?? '상세 근거는 사건 화면에서 확인하세요.'}</p></div></div>
  <div className="incident-foot"><span className="incident-key">위험도</span><strong>{riskText(incident.risk)}</strong><span className="ticks" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} data-on={i<filled||undefined}/>)}</span><span className="spacer"/><span className="incident-key">확신도</span><b className="incident-conf">{percent(incident.confidence)}</b></div>
  {incident.needs_human_review&&<p className="incident-review">위험도와 확신도를 별도로 표시합니다. {incident.risk===null?'위험도 미측정 · 정상으로 처리하지 않습니다.':'최종 판단은 관제사가 합니다.'}</p>}
  <div className="incident-actions"><button type="button" className="btn btn-primary" onClick={()=>onOpen(incident.id)}>자세히 보기 →</button><button type="button" className="btn" disabled={busy} onClick={()=>onVerify(incident.id)}>확인 완료</button></div>
 </article>
}
