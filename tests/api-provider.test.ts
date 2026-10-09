import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiProvider, ApiError, parseSnapshot, mediaUrl } from '../src/console/apiProvider'
import examples from '../src/fixtures/backend-api-v1.2.json'
test('snapshot validates contract and preserves unknown risk',()=>{
 const s=structuredClone(examples.snapshot_demo)
 s.incidents[0].risk=null;s.incidents[0].level='UNKNOWN'
 assert.equal(parseSnapshot(s).incidents[0].risk,null)
 assert.throws(()=>parseSnapshot({...s,api_contract_version:'9'}),ApiError)
 assert.throws(()=>parseSnapshot({...s,incidents:[{...s.incidents[0],confidence:92}]}),ApiError)
})
test('media URL never uses external or protocol relative assets',()=>{
 assert.equal(mediaUrl('//external.test/api/incidents/a/video'),null)
 assert.equal(mediaUrl('https://external.test/video'),null)
 assert.equal(mediaUrl('/stream/CAM_08'),'/stream/CAM_08')
 assert.equal(mediaUrl('/api/incidents/id/frames/0'),'/api/incidents/id/frames/0')
})
test('ACK encodes identifier and sends explicit stable request key',async()=>{
 const calls:any[]=[]
 const p=new ApiProvider(async(path,options)=>{calls.push([path,options]);return new Response(JSON.stringify({ok:true}),{status:200})})
 await p.ack('a/b',{action:'verify'},'stable');await p.ack('a/b',{action:'verify'},'stable')
 assert.equal(calls[0][0],'/api/incidents/a%2Fb/ack')
 assert.equal(calls[0][1].headers['Idempotency-Key'],'stable')
 assert.equal(calls[1][1].headers['Idempotency-Key'],'stable')
 assert.deepEqual(JSON.parse(calls[0][1].body),{action:'verify'})
})
test('backend 404 and 409 are not successful or replaced with fixture',async()=>{
 for(const status of [404,409,503]){
  const p=new ApiProvider(async()=>new Response(JSON.stringify({error:{code:'test_error',message:'server message'}}),{status}))
  await assert.rejects(()=>p.getIncident('missing'),e=>e instanceof ApiError&&e.status===status&&e.message==='server message')
 }
})
test('network failure and malformed response remain explicit errors',async()=>{
 const p=new ApiProvider(async()=>{throw Error('secret transport details')})
 await assert.rejects(()=>p.getSnapshot(),e=>e instanceof ApiError&&e.code==='network_error'&&!e.message.includes('secret'))
 const q=new ApiProvider(async()=>new Response('html'))
 await assert.rejects(()=>q.getSnapshot(),e=>e instanceof ApiError&&e.code==='invalid_response')
})
test('WS accepts complete first snapshot and cleans connection',()=>{
 const oldWS=globalThis.WebSocket,oldLocation=globalThis.location
 let socket:any
 class FakeSocket{onopen:any;onmessage:any;onerror:any;onclose:any;closed=false;constructor(){socket=this}close(){this.closed=true}}
 Object.defineProperty(globalThis,'location',{configurable:true,value:{protocol:'http:',host:'localhost:5173'}})
 globalThis.WebSocket=FakeSocket as any
 try{
  const seen:boolean[]=[];const states:string[]=[]
  const stop=new ApiProvider().subscribe((_,first)=>seen.push(first),s=>states.push(s),()=>{})
  socket.onmessage({data:JSON.stringify(examples.snapshot_demo)})
  socket.onmessage({data:JSON.stringify(examples.snapshot_demo)})
  assert.deepEqual(seen,[true,false]);assert.equal(states.at(-1),'connected')
  stop();assert.equal(socket.closed,true)
 }finally{globalThis.WebSocket=oldWS;Object.defineProperty(globalThis,'location',{configurable:true,value:oldLocation})}
})
