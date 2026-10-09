import type { Snapshot } from '../contracts/api'
import dot from '../assets/dot-ok-6.svg'
export function AnalysisPanel({snapshot}:{snapshot:Snapshot}){
 const counts=[snapshot.configured_cameras,snapshot.observed_cameras,snapshot.suppressed_count,snapshot.active_count]
 const labels=['등록 카메라','처리 입력 카메라','제외 알림','확인 필요']
 return <section className="card analysis">
  <div className="analysis-head"><h2>AI 분석 현황</h2><span className="muted">현재 등록 화면에서 지금 볼 곳까지</span><span className="spacer"/><span className="analysis-state"><img src={dot} alt=""/><b>{snapshot.is_demo?'합성 데모':'개발 입력'}</b><span className="muted">· 처리 시간 미측정</span></span></div>
  <div className="analysis-body"><div className="funnel"><h3>관제 상태 · 등록 {snapshot.configured_cameras}대</h3><dl className="funnel-rows">{counts.map((count,i)=><div key={labels[i]} className="funnel-row" data-stage={i} data-active={count>0||undefined}><dt>{labels[i]}</dt><div className="track"><div className="bar" style={{width:Math.min(100,Math.sqrt(count/Math.max(1,snapshot.configured_cameras))*100)+'%'}}/></div><dd>{count}</dd></div>)}</dl><p className="takeaway"><img src={dot} alt=""/>{snapshot.active_count? snapshot.active_count+'곳 확인 필요':'현재 확인 대기 사건 없음'}</p></div>
  <div className="divider-v"/><div className="trace"><h3>처리 경과 · 실측 정보 대기</h3><ol className="timeline">{['의심 구간 감지','맥락 분석','위험도 판단','큐 등록'].map((label,i)=><li key={label} className="timeline-item" data-tone="idle">{i>0&&<div className="timeline-link"><span className="timeline-line"/><span>—</span></div>}<div className="timeline-node"><span className="timeline-dot"/><b>{label}</b><span className="timeline-time">—</span></div></li>)}</ol><div className="trace-summary"><span>평균 처리 시간</span><b>—</b><span className="chip">미측정</span></div></div></div>
 </section>
}
