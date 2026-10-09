import { useEffect, useState } from 'react'
import type { ApiCamera } from '../contracts/api'
import { camLabel, previewFor } from '../data/cameras'
interface Props {camera:ApiCamera; size?:'md'|'sm'|'lg'; active?:boolean}
export function CameraTile({camera,size='md',active=false}:Props){
  const src=previewFor(camera.id,active)
  const [broken,setBroken]=useState(false)
  useEffect(()=>setBroken(false),[src])
  const tone=camera.status==='review'?'indigo':camera.level==='CRITICAL'?'signal':camera.level==='HIGH'?'amber':undefined
  return <figure className={'tile tile-'+size} data-tone={tone}>
    {src && !broken ? <img className="tile-frame" src={src} alt={camLabel(camera.id)+' 로컬 예시 이미지'} onError={()=>setBroken(true)}/> : <div className="media-placeholder">예시 이미지 미제공</div>}
    <div className="tile-shade"/>
    <figcaption className="tile-label"><b>{camLabel(camera.id)}</b><span>{camera.location ?? '위치 미제공'}</span></figcaption>
    <span className="tile-chip" data-tone={tone ?? 'neutral'}>{camera.analysis_status==='not_analyzed'?'미분석':camera.status==='review'?'사람 검토':active?'사건 후보':'합성 데모'}</span>
    <div className="tile-time"><span>로컬 프리뷰 · 영상 미연결</span></div>
  </figure>
}
