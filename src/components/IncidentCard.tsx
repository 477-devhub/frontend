import dotSignal from '../assets/dot-signal-6.svg'
import dotAmber from '../assets/dot-amber-6.svg'
import dotReview from '../assets/dot-indigo-6.svg'
import type { ApiIncident } from '../contracts/api'
import { mediaUrl } from '../console/apiProvider'
import { EvidenceImage } from './Media'
import { camLabel, previewFor } from '../data/cameras'
import { elapsed, incidentTone, LEVEL_LABEL, percent, riskText } from '../console/presentation'
interface Props {incident:ApiIncident;remote?:boolean;remoteDemo?:boolean;onOpen:(id:string)=>void}
export function IncidentCard({incident,onOpen,remote=false,remoteDemo=false}:Props){
 const tone=incidentTone(incident)
 const dot=tone==="signal"?dotSignal:tone==="amber"?dotAmber:dotReview
 const thumb=remote&&!remoteDemo?mediaUrl(incident.evidence.find(e=>e.frame_url)?.frame_url):previewFor(incident.primary_cam,true)
 const filled=incident.risk===null?0:Math.round(incident.risk/10)
 const lowConfidence=incident.confidence<0.6
 return <article className="incident" role="button" tabIndex={0} aria-label={camLabel(incident.primary_cam)+' · '+incident.title+' · 상세 보기'} onClick={()=>onOpen(incident.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen(incident.id)}}} data-tone={tone} data-emphasis={tone==='indigo'||undefined}>
  <div className="incident-head"><span className="rank">{incident.rank ?? '—'}</span><span className="incident-cam">{camLabel(incident.primary_cam)} · {incident.location ?? '위치 미제공'}</span><span className="spacer"/><span className="incident-status"><img src={dot} alt=""/><b>{incident.needs_human_review?'확인 필요':LEVEL_LABEL[incident.level]}</b><span> · {elapsed(incident.created_at)}</span></span></div>
  <div className="incident-body">{thumb?remote&&!remoteDemo?<EvidenceImage url={thumb} alt="사건 입력 근거"/>:<img className="thumb" src={thumb} alt="합성 데모 예시 이미지"/>:<div className="thumb media-placeholder">이미지 없음</div>}<div className="incident-info"><h3>{incident.title}</h3><p>{incident.needs_human_review ? incident.uncertainty_reason ?? incident.ai_opinion ?? '사람의 판단이 필요합니다.' : incident.ai_opinion ?? '상세 근거는 사건 화면에서 확인하세요.'}</p></div></div>
  <div className="incident-foot"><span className="incident-key">위험도</span><strong>{riskText(incident.risk)}</strong><span className="ticks" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} data-on={i<filled||undefined}/>)}</span><span className="spacer"/>{lowConfidence?<span className="incident-low"><img src={dot} alt=""/>확신도 낮음 {percent(incident.confidence)}</span>:<><span className="incident-key">확신도</span><b className="incident-conf">{percent(incident.confidence)}</b></>}</div>
  {incident.needs_human_review&&<p className="incident-review"><img src={dot} alt=""/>{incident.risk===null?'위험도 미측정 · 사람에게 판단을 요청합니다.':lowConfidence&&incident.risk>=65?'위험은 높지만 확신이 낮아, 사람에게 판단을 요청합니다.':'사람에게 최종 판단을 요청합니다.'}</p>}
 </article>
}
