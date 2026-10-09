// HACKATHON-DAY: backend API 1.2 types. No transport implementation.
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
export type AckAction = 'verify' | 'request_dispatch' | 'dismiss' | 'needs_review' | 'confirm_review' | 'handover'
export interface RiskAxes { severity: number | null; imminence: number | null; exposure: number | null; persistence: number | null }
export interface BoxOverlay { frame_id: string; timestamp_ms: number; xywh: [number, number, number, number]; coordinate_space: 'normalized_xywh'; detection_confidence?: number | null }
export interface ApiCamera { id: string; name: string; location: string | null; stream_url: string; status: string; bbox: BoxOverlay[]; level: RiskLevel | null; suppressed: boolean; analysis_status: 'demo' | 'not_analyzed' | 'analyzed'; media_available: boolean; video_source: 'local_file' | 'not_configured'; is_demo: boolean }
export interface Evidence { frame_id: string; timestamp_ms: number; t: string; text: string; frame_url: string | null }
export interface TimelineItem { t: string; label: string; frame_id: string | null; frame_url: string | null }
export interface RelatedView { cam_id: string; role: 'best' | 'secondary'; snapshot_url: string | null; match_confidence: number }
export interface ApiIncident {
  id: string; sample_id: string; type: string; title: string; primary_cam: string; related_cams: string[]
  location: string | null; risk: number | null; level: RiskLevel; risk_axes: RiskAxes | null; confidence: number
  needs_human_review: boolean; uncertainty_reason: string | null; rank: number | null; rank_reason: string | null
  timeline: TimelineItem[]; evidence: Evidence[]; related_views: RelatedView[]; ai_opinion: string | null
  recommended_actions: string[]; next_incident_id: string | null; created_at: string
  status: 'open' | 'acked' | 'dismissed'; dispatch_requested: boolean; assigned_operator: string | null; revision: number
}
export interface Snapshot {
  event_type: 'snapshot'; schema_version: string; api_contract_version: string; server_instance_id: string; revision: number
  active_count: number; total_cameras: number; target_camera_capacity: number; configured_cameras: number; observed_cameras: number
  suppressed_count: number; level_counts: Record<string, number>; incidents: ApiIncident[]; cameras: ApiCamera[]; is_demo: boolean
}
export interface AckBody { action: AckAction; note?: string | null; to_operator?: string | null }
export interface AckResponse { ok: boolean; incident: ApiIncident; revision: number; server_instance_id: string; api_contract_version: string }
export interface Suppressed { id: string; cam_id: string; stage1_label: string | null; ai_verdict: string; reason: string; risk: number | null; resumed_walking: boolean | null; restored: boolean }
export interface ApiErrorShape { code: string; message: string; fields: { loc: (string | number)[]; type: string; msg: string }[] }
export interface ClipMetadata {
  clip_url: string; start: number | null; end: number | null; bbox_track: BoxOverlay[]; available: boolean; is_demo: boolean
  duration_sec: number | null; range_valid: boolean | null; duration_status: 'measured' | 'unmeasured'; time_unit: 'seconds'
  time_reference: 'source_video_start'; delivery: 'full_file'; crop_available: boolean
  range_source: 'model_input_window' | 'synthetic_demo' | 'unavailable'; bbox_coordinate_space: 'normalized_xywh'; bbox_available: boolean
  source: 'incident_source' | 'camera_file'
}
export interface ConsoleProvider {
  readonly kind: 'local-fixture'
  loadScene(step: number): Promise<void>
  getSnapshot(): Promise<Snapshot>
  getIncident(id: string): Promise<ApiIncident>
  getSuppressed(): Promise<Suppressed[]>
  getClip(id: string): Promise<ClipMetadata>
  ack(id: string, body: AckBody, key: string): Promise<AckResponse>
  restore(id: string, key: string): Promise<void>
}
