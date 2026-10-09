import { useEffect, useState } from 'react'
import type { ApiCamera } from '../contracts/api'
import { camLabel, previewFor } from '../data/cameras'
import { ServerVideo } from './Media'
interface Props {camera:ApiCamera; size?:'md'|'sm'|'lg'; active?:boolean;remote?:boolean}
export function CameraTile({camera,size='md',active=false,remote=false}:Props){
 const src=previewFor(camera.id,active),[broken,setBroken]=useState(false)
 useEffect(()=>setBroken(false),[src])
 const tone=camera.status==='review'?'indigo':camera.level==='CRITICAL'?'signal':camera.level==='HIGH'?'amber':undefined
 return <figure className={'tile tile-'+size} data-tone={tone}>
  {remote&&!camera.is_demo?<ServerVideo url={camera.media_available?camera.stream_url:null}/>:src&&!broken?<img className="tile-frame" src={src} alt={camLabel(camera.id)+' 합성 미리보기'} onError={()=>setBroken(true)}/>:<p className="media-placeholder">예시 이미지 미제공</p>}
  <div className="tile-shade"/>
  <figcaption className="tile-label"><b>{camLabel(camera.id)}</b><span>{camera.location??'위치 미제공'}</span></figcaption>
  <span className="tile-chip" data-tone={tone??'neutral'}>{camera.analysis_status==='not_analyzed'?'미분석':camera.status==='review'?'사람 검토':active?'사건 후보':camera.is_demo?'합성 데모':'활성 사건 없음'}</span>
  <div className="tile-time"><span>{remote&&!camera.is_demo?'서버 로컬 영상':'합성 미리보기'}</span></div>
 </figure>
}
