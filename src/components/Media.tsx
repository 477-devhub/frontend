import { useEffect, useState } from 'react'
import { mediaUrl } from '../console/apiProvider'
export function EvidenceImage({url,alt}:{url:string|null;alt:string}){
 const src=mediaUrl(url),[broken,setBroken]=useState(false)
 useEffect(()=>setBroken(false),[src])
 return src&&!broken?<img className="evidence-image" src={src} alt={alt} loading="lazy" onError={()=>setBroken(true)}/>:<p className="media-placeholder">근거 이미지 미제공 또는 불러오기 실패</p>
}
export function ServerVideo({url,start,end}:{url:string|null;start?:number|null;end?:number|null}){
 const src=mediaUrl(url),[broken,setBroken]=useState(false)
 useEffect(()=>setBroken(false),[src,start,end])
 return src&&!broken?<video key={src+':'+start+':'+end} className="tile-frame" src={src} controls muted playsInline preload="metadata"
 onError={()=>setBroken(true)}
 onLoadedMetadata={e=>{const v=e.currentTarget;if(start!=null&&start>=0&&start<v.duration)v.currentTime=start;else if(start!=null)setBroken(true)}}
 onPlay={e=>{const v=e.currentTarget;if(end!=null&&v.currentTime>=end&&start!=null)v.currentTime=start}}
 onTimeUpdate={e=>{if(end!=null&&e.currentTarget.currentTime>=end)e.currentTarget.pause()}}/>:<p className="media-placeholder">영상 미제공 또는 재생 실패</p>
}
