import { cameraHighlight } from '../console/highlightPolicy'
import { useEffect, useState } from 'react'
import type { ApiCamera, ApiIncident } from '../contracts/api'
import { camLabel, previewFor } from '../data/cameras'
import { ServerVideo } from './Media'
interface Props {camera:ApiCamera; size?:'md'|'sm'|'lg'; active?:boolean;remote?:boolean;preview?:string;incident?:ApiIncident}
export function CameraTile({camera,size='md',active=false,remote=false,preview,incident}:Props){
 const src=preview??previewFor(camera.id,active),[broken,setBroken]=useState(false)
 useEffect(()=>setBroken(false),[src])
 const tone=cameraHighlight(camera.id,incident)
 return <figure className={'tile tile-'+size} data-tone={tone}>
  {remote&&camera.media_available?<ServerVideo camId={camera.id} url={camera.stream_url}/>:remote&&!camera.is_demo?<ServerVideo url={null}/>:src&&!broken?<img className="tile-frame" src={src} alt={camLabel(camera.id)+' 합성 미리보기'} onError={()=>setBroken(true)}/>:<p className="media-placeholder">예시 이미지 미제공</p>}
  <div className="tile-shade"/>
  <figcaption className="tile-label"><b>{camLabel(camera.id)}</b><span>{camera.location??'위치 미제공'}</span></figcaption>
  <span className="tile-chip" data-tone={tone??'neutral'}>{camera.analysis_status==='not_analyzed'?'미분석':tone==='signal'?'긴급 사건':tone==='amber'?(incident?.needs_human_review?'사건 후보 · 사람 검토':'사건 후보'):tone==='indigo'?'사람 검토':camera.is_demo?'합성 데모':'활성 사건 없음'}</span>
  <div className="tile-time"><span>{remote&&!camera.is_demo?'서버 로컬 영상':'합성 미리보기'}</span></div>
 </figure>
}
