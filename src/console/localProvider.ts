import type { DemoScenario } from '../scenario/types'
// HACKATHON-DAY: pure local fixture source. Never requests backend media or APIs.
import examples from '../fixtures/backend-api-v1.2.json'
import type { AckBody, AckResponse, ApiIncident, ClipMetadata, ConsoleProvider, Snapshot, Suppressed } from '../contracts/api'
const clone = <T,>(value: T): T => structuredClone(value)

export class ConsoleError extends Error {
  constructor(public code: string, message: string) { super(message) }
}

export function shouldAcceptSnapshot(current: Snapshot | null, next: Snapshot, firstOnConnection = false): boolean {
  return firstOnConnection || !current || current.server_instance_id !== next.server_instance_id || next.revision >= current.revision
}

export class LocalProvider implements ConsoleProvider {
  constructor(private scenario:DemoScenario|null=null){}
  async getScenario(){return this.scenario}
  readonly kind = 'local-fixture' as const
  private snapshot = clone(examples.snapshot_initial) as Snapshot
  private records = new Map<string, ApiIncident>()
  private excluded: Suppressed[] = []
  private requests = new Map<string, { signature: string; result: AckResponse | null }>()
  private rebuild() {
    const active = [...this.records.values()].filter(i => i.status === 'open')
    active.sort((a,b) => (a.risk === null ? 0 : 1) - (b.risk === null ? 0 : 1) || (b.risk ?? 0) - (a.risk ?? 0) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    this.snapshot.incidents = active.map((i,n) => ({ ...clone(i), rank: n+1, next_incident_id: active[n+1]?.id ?? null, rank_reason: i.risk === null ? '위험도 미측정: 사람 검토 우선' : '서버 위험도 내림차순' }))
    this.snapshot.active_count = active.length
    this.snapshot.suppressed_count = this.excluded.filter(s => !s.restored).length
    this.snapshot.level_counts = { critical:0, high:0, medium:0, low:0, review:0, unknown:0 }
    for (const i of active) this.snapshot.level_counts[i.needs_human_review ? 'review' : i.level.toLowerCase()]++
    this.snapshot.cameras = this.snapshot.cameras.map(c => {
      const incident = this.snapshot.incidents.find(i => i.primary_cam === c.id)
      return { ...c, bbox: [], status: incident ? incident.needs_human_review ? 'review' : 'incident' : this.scenario || c.analysis_status === 'not_analyzed' ? 'unobserved' : 'normal',
        level: incident?.level ?? null, suppressed: this.excluded.some(s => s.cam_id === c.id && !s.restored) }
    })
  }
  async loadScene(step: number) {
    if (!Number.isInteger(step) || step < 1 || step > 6) throw new ConsoleError('validation_error','잘못된 데모 단계입니다.')
    const revision = this.snapshot.revision + 1
    const epoch = this.snapshot.server_instance_id
    this.snapshot = clone(examples.snapshot_initial) as Snapshot
    this.snapshot.server_instance_id = epoch
    this.snapshot.revision = revision
    this.records.clear(); this.excluded = []
    const seeds = clone(examples.snapshot_demo.incidents) as ApiIncident[]
    const count = step < 3 ? 0 : step === 3 ? 1 : step === 4 ? 2 : 3
    for (const [index,i] of seeds.slice(0,count).entries()) {
      i.created_at = new Date(Date.now() - (index+1)*15000).toISOString()
      this.records.set(i.id,i)
    }
    if (step === 2) this.excluded.push({ id:'SUP-001', cam_id:'CAM_04', stage1_label:'Possible fall', ai_verdict:'normal', reason:'합성 데모: 자세를 낮춘 뒤 다시 걸음', risk:8, resumed_walking:true, restored:false })
    if(this.scenario){
      this.records.clear();this.excluded=[]
      this.snapshot.cameras=this.snapshot.cameras.map(c=>({...c,location:this.scenario!.cameras.find(x=>x.id===c.id)?.region??null}))
      for(const e of this.scenario.incidents.filter(e=>e.enabled&&step>=e.min_step)){
        const a=e.risk_axes
        const score=a&&Object.values(a).every(v=>v!==null)?Math.round(100*(.35*a.severity!+.30*a.imminence!+.20*a.exposure!+.15*a.persistence!)):null
        const base=clone(examples.incident_demo) as ApiIncident
        this.records.set(e.id,{...base,id:e.id,sample_id:'scripted-'+e.id,type:e.type,title:e.title,primary_cam:e.primary_cam,related_cams:e.members.filter(c=>c!==e.primary_cam),risk:score,level:score===null?'UNKNOWN':score>=85?'CRITICAL':score>=65?'HIGH':score>=40?'MEDIUM':'LOW',risk_axes:a,confidence:e.confidence,needs_human_review:e.needs_human_review,evidence:[],timeline:[],related_views:[],ai_opinion:'시나리오 지정 판단 · AI 분석 결과가 아닙니다.',created_at:new Date().toISOString()})
      }
    }
    this.rebuild()
  }
  async getSnapshot() { return clone(this.snapshot) }
  async getSuppressed() { return clone(this.excluded) }
  async getIncident(id: string) {
    const stored=this.records.get(id)
    if (!stored) throw new ConsoleError('not_found','사건을 찾을 수 없습니다.')
    return clone(this.snapshot.incidents.find(i => i.id===id) ?? { ...stored, rank:null, next_incident_id:null, rank_reason:null })
  }
  async getClip(id: string) {
    await this.getIncident(id)
    return { ...clone(examples.clip_without_media), clip_url:'/stream/'+this.records.get(id)!.primary_cam } as ClipMetadata
  }
  private validateKey(key: string, signature: string) {
    if (!key || key.length > 200) throw new ConsoleError('invalid_request','작업 식별자가 필요합니다.')
    const previous=this.requests.get(key)
    if (previous && previous.signature !== signature) throw new ConsoleError('conflict','다른 작업에 사용한 식별자입니다.')
    return previous
  }
  async ack(id: string, body: AckBody, key: string) {
    const signature=JSON.stringify([id,body.action,body.note ?? null,body.to_operator ?? null])
    const previous=this.validateKey(key,signature)
    if (previous) return clone(previous.result!)
    const stored=this.records.get(id)
    if (!stored) throw new ConsoleError('not_found','사건을 찾을 수 없습니다.')
    const item=clone(stored)
    if (item.status === 'dismissed' && body.action !== 'dismiss') throw new ConsoleError('conflict','이미 종결된 사건입니다.')
    if (body.note && body.note.length > 2000) throw new ConsoleError('validation_error','메모는 2,000자 이내로 입력하세요.')
    if (body.action === 'handover' && (!body.to_operator?.trim() || body.to_operator.length > 100)) throw new ConsoleError('conflict','인계할 관제사를 입력하세요.')
    switch(body.action) {
      case 'verify': item.status='acked'; break
      case 'dismiss': item.status='dismissed'; break
      case 'needs_review': item.status='open'; item.needs_human_review=true; break
      case 'confirm_review': item.status='open'; item.needs_human_review=false; break
      case 'request_dispatch': item.dispatch_requested=true; break
      case 'handover': item.assigned_operator=body.to_operator!; break
      default: throw new ConsoleError('validation_error','지원하지 않는 작업입니다.')
    }
    item.revision++
    this.records.set(id,item); this.snapshot.revision++; this.rebuild()
    const response: AckResponse = { ok:true, incident:clone(this.snapshot.incidents.find(i => i.id===id) ?? { ...item,rank:null,next_incident_id:null,rank_reason:null }), revision:this.snapshot.revision,
      server_instance_id:this.snapshot.server_instance_id, api_contract_version:'1.2' }
    this.requests.set(key,{ signature,result:clone(response) })
    return response
  }
  async restore(id: string, key: string) {
    const signature=JSON.stringify(['restore',id])
    if (this.validateKey(key,signature)) return
    const source=this.excluded.find(s => s.id===id)
    if (!source) throw new ConsoleError('not_found','제외 알림을 찾을 수 없습니다.')
    if (!source.restored) {
      const seed=clone(examples.incident_demo) as ApiIncident
      const incident: ApiIncident = { ...seed,id:'RESTORED-'+id,sample_id:'restore-'+id,type:'uncertain',title:'제외 알림 재검토',primary_cam:source.cam_id,
        related_cams:[],risk:null,level:'UNKNOWN',risk_axes:null,confidence:0,needs_human_review:true,uncertainty_reason:'operator_restored',
        evidence:[],timeline:[],related_views:[],ai_opinion:null,recommended_actions:[],rank:null,rank_reason:null,next_incident_id:null,
        created_at:new Date().toISOString(),status:'open',dispatch_requested:false,assigned_operator:null }
      this.records.set(incident.id,incident); source.restored=true; this.snapshot.revision++; this.rebuild()
    }
    this.requests.set(key,{signature,result:null})
  }
}
