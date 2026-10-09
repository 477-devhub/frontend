// HACKATHON-DAY: presentation threshold, not suppression or AI classification.
import type { ApiIncident } from '../contracts/api'
export const CANDIDATE_RISK_THRESHOLD=65
export function cameraHighlight(cameraId:string,incident:ApiIncident|undefined):'signal'|'amber'|'indigo'|undefined {
 if(!incident || incident.status!=='open' || incident.primary_cam!==cameraId)return undefined
 if(incident.risk!==null&&incident.level==='CRITICAL')return 'signal'
 if(incident.risk!==null&&incident.risk>CANDIDATE_RISK_THRESHOLD)return 'amber'
 if(incident.needs_human_review)return 'indigo'
 return undefined
}
