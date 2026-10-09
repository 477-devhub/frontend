// HACKATHON-DAY: shared source clock for prerecorded demo video, not live CCTV.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { DemoScenario } from './types'
interface Player {video:HTMLVideoElement;offset:number}
interface Playback {
 scenario:DemoScenario|null;playing:boolean;position:number;ready:number;error:string
 register:(video:HTMLVideoElement,offset:number)=>()=>void
 play:()=>void;pause:()=>void;reset:()=>void
}
const Context=createContext<Playback|null>(null)
export const usePlayback=()=>useContext(Context)
export function PlaybackProvider({scenario,children}:{scenario:DemoScenario|null;children:ReactNode}){
 const players=useRef(new Set<Player>()),clock=useRef(0),running=useRef(false),last=useRef(0)
 const [playing,setPlaying]=useState(false),[position,setPosition]=useState(0),[ready,setReady]=useState(0),[error,setError]=useState('')
 const playVideo=(video:HTMLVideoElement)=>{void video.play().catch(()=>{running.current=false;setPlaying(false);for(const p of players.current)p.video.pause();setError('일부 영상 재생이 차단되었습니다. 파일 또는 브라우저 재생 권한을 확인하세요.')})}
 const align=(p:Player)=>{
  if(!Number.isFinite(p.video.duration)||p.video.duration<=0)return
  const target=Math.min(p.video.duration,Math.max(0,clock.current+p.offset))
  if(Math.abs(p.video.currentTime-target)>.2)p.video.currentTime=target
  if(running.current&&target<p.video.duration&&p.video.paused)playVideo(p.video)
  else if(!running.current||target>=p.video.duration)p.video.pause()
 }
 const register=useCallback((video:HTMLVideoElement,offset:number)=>{
  const p={video,offset};players.current.add(p);setReady(players.current.size)
  const loaded=()=>align(p);video.addEventListener('loadedmetadata',loaded);align(p)
  return()=>{video.pause();video.removeEventListener('loadedmetadata',loaded);players.current.delete(p);setReady(players.current.size)}
 },[])
 const pause=()=>{running.current=false;setPlaying(false);for(const p of players.current)p.video.pause()}
 const reset=()=>{pause();clock.current=0;setPosition(0);for(const p of players.current)align(p);setError('')}
 const play=()=>{if(!players.current.size){setError('등록된 영상이 없습니다. CAM_XX.mp4를 준비하세요.');return}setError('');last.current=performance.now();running.current=true;setPlaying(true);for(const p of players.current)align(p)}
 useEffect(()=>{reset()},[scenario])
 useEffect(()=>{const timer=setInterval(()=>{
  if(!running.current)return
  const now=performance.now();clock.current+=(now-last.current)/1000;last.current=now
  let remaining=false
  for(const p of players.current){align(p);if(!Number.isFinite(p.video.duration)||clock.current+p.offset<p.video.duration)remaining=true}
  setPosition(clock.current)
  if(!remaining){running.current=false;setPlaying(false)}
 },100);return()=>{clearInterval(timer);running.current=false;for(const p of players.current)p.video.pause()}},[])
 return <Context.Provider value={{scenario,playing,position,ready,error,register,play,pause,reset}}>{children}</Context.Provider>
}
export function PlaybackControls(){
 const p=usePlayback()
 if(!p?.scenario)return null
 return <section className="playback-controls"><b>시나리오 판단 · AI 미연결</b><span>데모 재생 {p.position.toFixed(1)}초 · 등록 플레이어 {p.ready}</span><div><button className="btn" onClick={p.play}>전체 재생</button><button className="btn" onClick={p.pause}>일시정지</button><button className="btn" onClick={p.reset}>처음으로</button></div>{p.error&&<p role="alert">{p.error}</p>}<small>CAM 1·2·3 시간 정렬 · 다른 구역은 독립 사건</small></section>
}
