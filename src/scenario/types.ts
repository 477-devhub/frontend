import type { RiskAxes } from '../contracts/api'
export interface DemoCamera {id:string;region:string;sync_group:string|null;offset_sec:number;role:'same_event'|'unassigned';video_file:string}
export interface DemoEvent {id:string;title:string;type:string;members:string[];primary_cam:string;min_step:number;enabled:boolean;risk_axes:RiskAxes|null;confidence:number;needs_human_review:boolean}
export interface DemoScenario {schema_version:'demo-scenario-1';decision_source:'scripted_not_ai';cameras:DemoCamera[];incidents:DemoEvent[]}
