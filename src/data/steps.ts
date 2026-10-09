// HACKATHON-DAY: presentation metadata only; scenarios come from the local provider.
export type Tone = 'signal' | 'amber' | 'indigo' | 'neutral'
export interface BBox { tone:Tone; dashed?:boolean; rect:[number,number,number,number]; label:string; labelAt:[number,number] }
export interface TileOverlay { tone:Tone; alert:boolean; chip?:string; frame?:string; boxes:BBox[] }
export const STEP_NAMES=['평상시','오탐 억제','사고 감지','동시 발생','불확실성','상세 근거']
export const DETAIL_STEP=6
