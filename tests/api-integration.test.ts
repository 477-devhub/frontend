// HACKATHON-DAY: explicit local demo integration only; resets server demo state.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiProvider, ApiError } from '../src/console/apiProvider'
const origin='http://127.0.0.1:5173'
test('live Vite proxy + FastAPI + WebSocket + ACK + restore + media errors',async()=>{
 const p=new ApiProvider((path,options)=>fetch(origin+path,options))
 const initial=await p.getSnapshot();assert.equal(initial.is_demo,true,'integration test requires demo backend')
 Object.defineProperty(globalThis,'location',{configurable:true,value:{protocol:'http:',host:'127.0.0.1:5173'}})
 const events:any[]=[];let connection=''
 const stop=p.subscribe(s=>events.push(s),s=>connection=s,e=>{throw e})
 const until=async(check:()=>boolean)=>{const deadline=Date.now()+10000;while(!check()){if(Date.now()>deadline)throw Error('WS update timeout');await new Promise(r=>setTimeout(r,50))}}
 try{
  await until(()=>connection==='connected')
  await p.loadScene(5)
  let s=await p.getSnapshot();assert.equal(s.active_count,3)
  const id=s.incidents[0].id
  const detail=await p.getIncident(id);assert.equal(detail.risk,s.incidents[0].risk)
  const clip=await p.getClip(id);assert.equal(clip.time_unit,'seconds')
  const a=await p.ack(id,{action:'verify'},'integration-'+crypto.randomUUID())
  assert.equal(a.incident.rank,null)
  await until(()=>events.some(e=>e.revision>=a.revision&&e.active_count===2))
  s=await p.getSnapshot();assert.equal(s.active_count,2)
  assert.equal((await p.getSnapshot()).active_count,2,'reading/navigation must not reset ACK')
  await p.loadScene(2);const excluded=await p.getSuppressed();assert.ok(excluded.length)
  await p.restore(excluded[0].id,'restore-'+crypto.randomUUID())
  s=await p.getSnapshot();assert.equal(s.incidents[0].risk,null);assert.equal(s.incidents[0].needs_human_review,true)
  await assert.rejects(()=>p.getIncident('missing'),e=>e instanceof ApiError&&e.status===404)
  const key='conflict-'+crypto.randomUUID(),rid=s.incidents[0].id
  await p.ack(rid,{action:'needs_review'},key)
  await assert.rejects(()=>p.ack(rid,{action:'dismiss'},key),e=>e instanceof ApiError&&e.status===409)
  const unavailable=s.cameras.find(c=>!c.media_available)
  if(unavailable)assert.equal((await fetch(origin+unavailable.stream_url)).status,503)
 }finally{stop();await p.loadScene(1)}
})
