export type CandidateStatus = 'DETECTED' | 'SCREENING' | 'ANALYZING' | 'REQUIRES_REVIEW' | 'AI_NORMAL_ESTIMATE' | 'AI_DANGER_ESTIMATE' | 'ERROR'
export interface Candidate {
  candidate_id: string; camera_id: string; reason_codes: string[]; status: CandidateStatus
  human_disposition: null | 'reviewed' | 'dismissed' | 'requires_review'
  first_seen_pts: number; last_pts: number; merge_count: number; job_status: string
  t1: number; t2: number; t3: number | null; t4: number | null; t5: number | null
  ai_source: string; error: string | null
  assessment: null | { ai_opinion?: string; uncertainty_reason?: string; event_confidence?: number; risk_axes?: { severity: number | null; imminence: number | null; exposure: number | null; persistence: number | null } | null; evidence_refs?: string[]; evidence_descriptions?: Record<string, string> }
  stage1: null | { decision: string; action: string; reason_codes: string[] }
  recorded_result?: unknown
}
export interface RuntimeSnapshot {
  instance: string; revision: number; phase: string; mode: string; ai_enabled: boolean
  cameras: { camera_id: string; state: string; pts: number; sampled: number; error?: string }[]
  frames: Record<string, string>; candidates: Candidate[]; queue: { p1: number; p4: number }
}
export interface Distribution { mean: number; p50: number; p95: number; max: number; count: number }
export interface Metrics {
  candidate_to_frontend_ms: Distribution | null; fast_cv_batch_ms_per_sample: Distribution | null
  effective_decode_fps_aggregate: number | null; effective_cv_fps_aggregate: number | null
  frame_drop_rate: number | null; ai: { p1_api_ms?: Distribution; p4_api_ms?: Distribution }
}
export const statusLabel: Record<CandidateStatus, string> = {
  DETECTED: '관심 후보 감지', SCREENING: 'P1 분석 중', ANALYZING: 'P4 정밀 분석 중',
  REQUIRES_REVIEW: '사람 검토 필요', AI_NORMAL_ESTIMATE: 'AI 정상 추정 · 유지',
  AI_DANGER_ESTIMATE: 'AI 위험 추정 · 사람 확인', ERROR: '분석 오류 · 사람 검토',
}
export const reasonLabel = (code: string) => ({ MOTION_CHANGE: '움직임 변화', MOTION_BURST: '급격한 움직임 변화', POSTURE_CHANGE: '자세 변화', PERSON_DOWN_PROXY: '낮은 자세 관측', PROXIMITY: '근접 상호작용' }[code] ?? code)
export const isClosed = (c: Candidate) => c.human_disposition === 'reviewed' || c.human_disposition === 'dismissed'
export const needsReview = (c: Candidate) => !isClosed(c) && (c.human_disposition === 'requires_review' || ['REQUIRES_REVIEW', 'AI_DANGER_ESTIMATE', 'ERROR'].includes(c.status))
export const candidateTone = (c?: Candidate) => !c || isClosed(c) ? undefined : c.status === 'AI_DANGER_ESTIMATE' ? 'signal' : needsReview(c) ? 'indigo' : 'amber'
// Equal revisions still carry newer video frames and playback state.
export function acceptSnapshot(previous: RuntimeSnapshot | null, next: RuntimeSnapshot) {
  return previous?.instance === next.instance && next.revision < previous.revision ? previous : next
}
export const runtimeUrl = (path: string) => `/runtime${path}`
export const evidenceUrl = (c: Candidate, frame = 'preview') => runtimeUrl(`/evidence/${encodeURIComponent(c.candidate_id)}/${encodeURIComponent(frame)}`)
