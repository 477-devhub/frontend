// HACKATHON-DAY: server owns risk score; these weights describe the server policy.
export type FactorKey='severity'|'imminence'|'exposure'|'persistence'
export const FACTOR_META: {key:FactorKey;label:string}[]=[
  {key:'severity',label:'심각도'},{key:'imminence',label:'긴급성'},{key:'exposure',label:'영향 범위'},{key:'persistence',label:'지속성'}]
export const RISK_FORMULA='서버 정책: 심각도 35% + 긴급성 30% + 영향 범위 20% + 지속성 15% · 확신도와 분리'
