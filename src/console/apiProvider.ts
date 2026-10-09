import type { DemoScenario } from '../scenario/types'
// HACKATHON-DAY: same-origin HTTP and WebSocket transport.
import type { AckBody, AckResponse, ApiIncident, ClipMetadata, ConsoleProvider, Snapshot, Suppressed } from '../contracts/api'
export class ApiError extends Error {
 constructor(public code:string,message:string,public status=0){super(message)}
}
export function parseSnapshot(value:unknown):Snapshot {
 const s=value as Snapshot
 if(!s || s.event_type!=='snapshot' || s.api_contract_version!=='1.2' || s.schema_version!=='1.1' ||
 typeof s.server_instance_id!=='string' || !Number.isInteger(s.revision) || !Array.isArray(s.incidents) || !Array.isArray(s.cameras) ||
 !s.level_counts || typeof s.active_count!=='number' || typeof s.configured_cameras!=='number' ||
 s.incidents.some(i=>!i || typeof i.id!=='string' || (i.risk!==null && (typeof i.risk!=='number'||i.risk<0||i.risk>100)) ||
 typeof i.confidence!=='number'||i.confidence<0||i.confidence>1||!['CRITICAL','HIGH','MEDIUM','LOW','UNKNOWN'].includes(i.level)))
 throw new ApiError('invalid_response','서버 snapshot 형식 또는 계약 버전이 맞지 않습니다.')
 return s
}
export function mediaUrl(value:string|null|undefined):string|null {
 if(!value || !/^\/(api\/incidents\/|stream\/)/.test(value) || value.includes(String.fromCharCode(92)))return null
 return value
}
export class ApiProvider implements ConsoleProvider {
 readonly kind='api' as const
 constructor(private transport:typeof fetch=(...args)=>fetch(...args)){}
 private async request<T>(path:string,body?:unknown,key?:string):Promise<T>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000)
  try {
   const response=await this.transport(path,{method:body===undefined?'GET':'POST',headers:body===undefined?undefined:{'Content-Type':'application/json','Idempotency-Key':key!},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store'})
   const data=await response.json().catch(()=>null)
   if(!response.ok)throw new ApiError(data?.error?.code ?? 'http_error',data?.error?.message ?? '서버 요청이 실패했습니다.',response.status)
   if(data===null)throw new ApiError('invalid_response','서버 응답을 읽을 수 없습니다.')
   return data as T
  }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('network_error','서버 연결에 실패했거나 요청 시간이 초과되었습니다.')}
  finally{clearTimeout(timer)}
 }
 async getScenario(){const data=await this.request<{configured:boolean;scenario:DemoScenario|null}>('/api/demo/scenario');return data.configured?data.scenario:null}
 async getSnapshot(){return parseSnapshot(await this.request<unknown>('/api/snapshot'))}
 getIncident(id:string){return this.request<ApiIncident>('/api/incidents/'+encodeURIComponent(id))}
 getSuppressed(){return this.request<Suppressed[]>('/api/suppressed')}
 getClip(id:string){return this.request<ClipMetadata>('/api/incidents/'+encodeURIComponent(id)+'/clip')}
 ack(id:string,body:AckBody,key:string){return this.request<AckResponse>('/api/incidents/'+encodeURIComponent(id)+'/ack',body,key)}
 async restore(id:string,key:string){await this.request('/api/suppressed/'+encodeURIComponent(id)+'/restore',{},key)}
 async loadScene(step:number){await this.request('/api/demo/step',{step},crypto.randomUUID())}
 subscribe(onSnapshot:(s:Snapshot,first:boolean)=>void,onState:(s:'connected'|'connecting'|'stale')=>void,onError:(error:Error)=>void){
  let stopped=false,socket:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,watchdog:ReturnType<typeof setTimeout>|undefined,attempt=0
  const connect=()=>{
   if(stopped)return
   onState('connecting');let first=true
   socket=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws/attention')
   const arm=()=>{clearTimeout(watchdog);watchdog=setTimeout(()=>{onState('stale');socket?.close()},40000)}
   socket.onopen=arm
   socket.onmessage=event=>{
    try{const snapshot=parseSnapshot(JSON.parse(event.data));onSnapshot(snapshot,first);first=false;attempt=0;onState('connected');arm()}
    catch(e){onError(e instanceof Error?e:new Error('잘못된 snapshot'));onState('stale');socket?.close()}
   }
   socket.onerror=()=>onState('stale')
   socket.onclose=()=>{clearTimeout(watchdog);if(!stopped){onState('stale');retry=setTimeout(connect,Math.min(1000*2**attempt++,10000))}}
  }
  connect()
  return()=>{stopped=true;clearTimeout(retry);clearTimeout(watchdog);socket?.close()}
 }
}
