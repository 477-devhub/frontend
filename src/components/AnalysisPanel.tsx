import type { Snapshot } from '../contracts/api'
export function AnalysisPanel({snapshot}:{snapshot:Snapshot}){
 return <section className="card analysis">
  <div className="analysis-head"><h2>관제 상태</h2><span className="muted">로컬 snapshot · 실측 추론 통계 아님</span></div>
  <div className="analysis-body"><div className="funnel"><h3>현재 구성</h3><dl className="funnel-rows">
   {[['등록 카메라',snapshot.configured_cameras],['처리 입력의 카메라',snapshot.observed_cameras],['확인 대기',snapshot.active_count],['제외 알림',snapshot.suppressed_count]].map(([label,count])=><div className="funnel-row" key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
  </dl></div><div className="divider-v"/><div className="trace"><h3>측정 정보</h3><p>평균 처리 시간 <strong>—</strong></p><p>단계별 처리 시간 <strong>미제공</strong></p><p>영상 및 분석 API 미연결</p><p className="footnote">미측정 값을 0초나 임의 평균으로 표시하지 않습니다.</p></div></div>
 </section>
}
