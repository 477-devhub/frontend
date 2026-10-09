// HACKATHON-DAY display conversion only; never calculates or sorts model risk.
import type { ApiIncident, RiskLevel } from '../contracts/api'
export const LEVEL_LABEL: Record<RiskLevel,string>={CRITICAL:'긴급',HIGH:'높음',MEDIUM:'중간',LOW:'낮음',UNKNOWN:'미측정'}
export type Tone='signal'|'amber'|'indigo'|'neutral'
export const incidentTone=(i:ApiIncident):Tone => i.needs_human_review || i.risk === null ? 'indigo' : i.level==='CRITICAL' ? 'signal' : i.level==='HIGH' ? 'amber' : 'neutral'
export const percent=(value:number | null | undefined) => value == null ? '미측정' : Math.round(value*100)+'%'
export const riskText=(value:number | null) => value === null ? '미측정' : String(value)
export function elapsed(iso:string) {
  const value=Date.parse(iso)
  if(!Number.isFinite(value)) return '시각 미제공'
  const seconds=Math.max(0,Math.floor((Date.now()-value)/1000))
  return seconds < 60 ? seconds+'초 전' : seconds < 3600 ? Math.floor(seconds/60)+'분 전' : Math.floor(seconds/3600)+'시간 전'
}
