import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Header } from './components/Header'
import { useFitScale } from './useFitScale'
import { useRuntime } from './runtime/useRuntime'
import { candidateTone, evidenceUrl, isClosed, needsReview, reasonLabel, runtimeUrl, statusLabel, type Candidate } from './runtime/model'
import field from './assets/camera-field-1.svg'
import dotRec from './assets/dot-rec.svg'
import timelineMuted from './assets/dot-timeline-muted.svg'
import timelineSignal from './assets/dot-timeline-signal.svg'
import timelineAmber from './assets/dot-timeline-amber.svg'
import evidenceDot from './assets/dot-signal-8.svg'
import { FACTOR_META } from './risk'
import './runtime/runtime.css'

// Emit a receipt after a visible candidate has had a browser paint opportunity.
function VisibleCandidate({ id, onDisplay, children }: { id?: string; onDisplay: (id: string) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!id) return
    let visible = false, first = 0, second = 0
    const report = () => {
      if (!visible || document.visibilityState !== 'visible') return
      cancelAnimationFrame(first); cancelAnimationFrame(second)
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { if (visible) onDisplay(id) }) })
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; report() })
    if (ref.current) observer.observe(ref.current)
    const retry = setInterval(report, 500)
    document.addEventListener('visibilitychange', report)
    return () => { observer.disconnect(); clearInterval(retry); cancelAnimationFrame(first); cancelAnimationFrame(second); document.removeEventListener('visibilitychange', report) }
  }, [id, onDisplay])
  return <div ref={ref} data-runtime-candidate={id}>{children}</div>
}
function Preview({ candidate, frame = 'preview' }: { candidate: Candidate; frame?: string }) {
  const [broken, setBroken] = useState(false)
  return broken ? <span className="media-placeholder">근거 이미지 미제공</span> : <img src={evidenceUrl(candidate, frame)} alt={`${candidate.camera_id} ${frame} 실제 관측 프레임`} onError={() => setBroken(true)} />
}
function CandidateCard({ candidate: c, onOpen, onDisplay }: { candidate: Candidate; onOpen: (id: string) => void; onDisplay: (id: string) => void }) {
  return <VisibleCandidate id={c.candidate_id} onDisplay={onDisplay}>
    <button className="card runtime-candidate" data-tone={candidateTone(c)} onClick={() => onOpen(c.candidate_id)}>
      <div className="runtime-thumb"><Preview candidate={c} /></div>
      <div><span className="runtime-status">{isClosed(c) ? c.human_disposition === 'dismissed' ? '관제사 종결' : '관제사 확인 완료' : statusLabel[c.status]}</span><h3>{c.camera_id} · {c.reason_codes.map(reasonLabel).join(', ')}</h3><p>영상 {c.first_seen_pts.toFixed(2)}초 · 병합 {c.merge_count}회</p><small>{c.ai_source === 'recorded' ? '저장 결과 재생' : c.ai_source === 'live' ? '실제 AI 분석' : 'AI 미호출'} · 상세 보기 →</small></div>
    </button>
  </VisibleCandidate>
}
const videoTime = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`
}
export function CandidateDetail({ candidate: c, next, busy, connected, onBack, onOpen, onAct, onDisplay }: {
  candidate: Candidate; next?: Candidate; busy: boolean; connected: boolean; onBack: () => void;
  onOpen: (id: string) => void; onAct: (id: string, action: 'reviewed' | 'dismissed') => void; onDisplay: (id: string) => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const [videoBroken, setVideoBroken] = useState(false)
  const tone = candidateTone(c)
  const assessment = c.assessment
  const confidence = assessment?.event_confidence
  const frames = assessment?.evidence_refs ?? []
  const sourceLabel = c.ai_source === 'recorded' ? '저장 결과 재생' : c.ai_source === 'live' ? '실제 AI 분석' : 'AI 미호출'
  const decision = isClosed(c) ? '처리 완료' : c.status === 'AI_DANGER_ESTIMATE' ? '위험 추정' : needsReview(c) ? '사람 검토' : c.status === 'AI_NORMAL_ESTIMATE' ? '정상 추정' : '분석 대기'
  const seek = (seconds: number) => {
    const player = video.current
    if (player && Number.isFinite(player.duration)) player.currentTime = Math.min(Math.max(0, seconds), player.duration)
  }
  return <main className="body detail runtime-detail" data-tone={tone}>
    <div className="detail-left">
      <div className="detail-title"><button type="button" className="back" onClick={onBack}>← 목록</button><h1>{c.camera_id.replace('CAM_', 'CAM ')} · 후보 상세</h1><span className="badge">{decision}</span><span className="spacer"/><span className="detail-camera-meta">첫 관측 {videoTime(c.first_seen_pts)}</span></div>
      <div className="detail-video">
        {videoBroken ? <p className="media-placeholder" role="alert">원본 영상을 불러올 수 없습니다.</p> : <video ref={video} controls preload="metadata" src={runtimeUrl(`/original/${encodeURIComponent(c.camera_id)}`)} onError={() => setVideoBroken(true)} onLoadedMetadata={() => seek(c.first_seen_pts - 3)}/>}
        <div className="candidate-video-label"><b>{c.camera_id.replace('CAM_', 'CAM ')}</b><span>원본 영상</span></div>
        <span className="candidate-video-status">{decision}</span>
        <span className="playback-chip">후보 구간 · {videoTime(c.first_seen_pts)} – {videoTime(c.last_pts)}</span>
      </div>
      <section className="card moments candidate-timeline">
        <div className="moments-head"><h2>후보 타임라인</h2><span>{videoTime(c.first_seen_pts)} → {videoTime(c.last_pts)} · 병합 {c.merge_count}회</span></div>
        <div className="candidate-time-track"><span className="candidate-time-range"/>
          <button type="button" className="candidate-moment" onClick={() => seek(Math.max(0, c.first_seen_pts - 3))}><img src={timelineMuted} alt=""/><b>{videoTime(Math.max(0, c.first_seen_pts - 3))}</b><span>직전 영상</span></button>
          <button type="button" className="candidate-moment" onClick={() => seek(c.first_seen_pts)}><img src={timelineSignal} alt=""/><b>{videoTime(c.first_seen_pts)}</b><span>후보 첫 관측</span></button>
          <button type="button" className="candidate-moment" onClick={() => seek(c.last_pts)}><img src={timelineAmber} alt=""/><b>{videoTime(c.last_pts)}</b><span>최근 관측</span></button>
        </div>
      </section>
      <section className="card candidate-frames" aria-label="관측 근거 이미지">
        <div className="candidate-frame-strip"><figure><Preview candidate={c}/><figcaption>Fast CV · 후보 시점</figcaption></figure>{frames.map(frame => <figure key={frame}><Preview candidate={c} frame={frame}/><figcaption>{frame} · {assessment?.evidence_descriptions?.[frame] ?? 'P4 근거 프레임'}</figcaption></figure>)}</div>
        <div className="candidate-frame-description"><h2>관측 근거 {1 + frames.length}개</h2><p>{c.reason_codes.map(reasonLabel).join(' · ') || '관측 사유 미제공'}</p><span>{sourceLabel} · 관측 후보는 위험 확정이 아닙니다.</span></div>
      </section>
    </div>
    <aside className="detail-right">
      <VisibleCandidate id={c.candidate_id} onDisplay={onDisplay}><section className="risk candidate-risk">
        <div className="risk-head"><span>위험도 판단</span><span className="badge badge-solid">{isClosed(c) ? '처리 완료' : '관제사 확인 필요'}</span></div>
        <div className="candidate-risk-summary"><strong>{decision}</strong><div className="risk-conf"><b>확신도 {confidence == null ? '미제공' : `${Math.round(confidence * 100)}%`}</b><span>위험도와 따로 표시합니다</span></div></div>
        <dl className="risk-factors">{FACTOR_META.map(({ key, label }) => {
          const value = assessment?.risk_axes?.[key]
          const score = value == null ? null : Math.max(0, Math.min(100, Math.round(value * 100)))
          return <div key={key}><dt>{label}</dt><div className="risk-track"><div style={{ width: `${score ?? 0}%` }}/></div><dd>{score ?? '—'}</dd></div>
        })}</dl><p className="risk-formula">{assessment?.risk_axes ? 'AI 분석의 위험도 항목 · 최종 판단은 관제사가 수행합니다.' : '위험도 항목 미제공 · 분석 상태와 확신도를 확인하세요.'}</p>
      </section></VisibleCandidate>
      <section className="card why candidate-why"><h2>왜 확인이 필요한가요?</h2><ol>
        <li><span className="why-when">관측</span><span className="why-rail"><img src={evidenceDot} alt=""/></span><div><b>{c.reason_codes.map(reasonLabel).join(' · ') || '관측 사유 미제공'}</b><p>Fast CV 후보 · 위험 확정 아님</p></div></li>
        {frames.map(frame => <li key={frame}><span className="why-when">근거</span><span className="why-rail"><img src={evidenceDot} alt=""/></span><div><b>{assessment?.evidence_descriptions?.[frame] ?? 'P4 근거 프레임'}</b><p>{frame}</p></div></li>)}
        {!frames.length && <li><span className="why-when">분석</span><span className="why-rail"><img src={evidenceDot} alt=""/></span><div><b>{statusLabel[c.status]}</b><p>추가 분석 근거를 기다리고 있습니다.</p></div></li>}
      </ol></section>
      <section className="card next-action candidate-actions"><h2>AI 의견과 다음 행동</h2><p className="candidate-opinion">{assessment?.ai_opinion ?? '분석 결과 대기 · 관측 부족을 정상으로 판단하지 않습니다.'}</p>{assessment?.uncertainty_reason && <p className="candidate-uncertainty">{assessment.uncertainty_reason}</p>}
        {next && <><p className="next-label">다음으로 확인할 후보</p><button type="button" className="next-incident" data-tone={candidateTone(next)} onClick={() => onOpen(next.candidate_id)}><span className="candidate-next-dot"/><b>{next.camera_id.replace('CAM_', 'CAM ')} · {next.reason_codes.map(reasonLabel).join(', ') || '관측 후보'}</b><span>→</span></button></>}
        <div className="candidate-human-actions">{isClosed(c) ? <p className="candidate-completed" role="status">{c.human_disposition === 'reviewed' ? '확인 완료' : '이상 없음으로 종결'} · 서버에 기록됨</p> : <><button type="button" className="btn btn-primary btn-lg" disabled={busy || !connected} onClick={() => onAct(c.candidate_id, 'reviewed')}>확인 완료</button><button type="button" className="btn btn-lg" disabled={busy || !connected} onClick={() => onAct(c.candidate_id, 'dismissed')}>이상 없음으로 종결</button></>}</div>
        {c.error && <p className="candidate-error" role="alert">{c.error}</p>}
        <details className="candidate-diagnostics"><summary>분석 상태 · {statusLabel[c.status]}</summary><p>Stage 1: {c.stage1?.decision ?? '미도착'} · {c.job_status}</p><p>{sourceLabel} · 후보 생성→UI {c.t3 === null ? '미측정' : `${((c.t3 - c.t1) * 1000).toFixed(1)} ms`}</p>{c.ai_source === 'recorded' && <><p>저장 결과 · 실시간 추론 아님</p><pre>{JSON.stringify(c.recorded_result, null, 2)}</pre></>}</details>
        <p className="next-note">최종 판단은 관제사가 수행합니다. 판단 변경은 Audit Log에 보존됩니다.</p>
      </section>
    </aside>
  </main>
}
export default function LiveReplay() {
  const rt = useRuntime(), s = rt.snapshot, fit = useFitScale()
  const [selected, setSelected] = useState<string | null>(null)
  const [onlyCandidates, setOnlyCandidates] = useState(false)
  const [clock, setClock] = useState(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
  useEffect(() => { const timer = setInterval(() => setClock(new Date().toLocaleTimeString('ko-KR', { hour12: false })), 1000); return () => clearInterval(timer) }, [])
  const all = s?.candidates ?? [], pending = all.filter(c => !isClosed(c))
  const review = pending.filter(needsReview).sort((a, b) => Number(b.status === 'AI_DANGER_ESTIMATE') - Number(a.status === 'AI_DANGER_ESTIMATE') || a.t1 - b.t1)
  const previews = pending.filter(c => !needsReview(c)), completed = all.filter(isClosed)
  const selectedCandidate = all.find(c => c.candidate_id === selected)
  const phase = ({ IDLE: '재생 대기', WARMING_UP: 'GPU 준비 중', PLAYING: '1× 재생 중', FINISHED: '재생 완료 · 결과 확인', ERROR: '런타임 오류' } as Record<string, string>)[s?.phase ?? ''] ?? '연결 대기'
  const fmt = (value?: number | null, suffix = '') => value == null ? '미측정' : `${value.toFixed(1)}${suffix}`
  return <div className="app runtime-app" style={fit}>
    <Header clock={clock} connection={rt.connected ? '런타임 연결' : '재연결 중'} activeStep={0} showSteps={false} onNavigate={() => {}} detailAvailable={false}>
      <div className="runtime-tools"><b>Fast Alert Runtime</b><p>기존 관제 UI에 직접 연결</p><a href="/">기존 시나리오 데모</a><a href={runtimeUrl('/api/metrics')} target="_blank" rel="noreferrer">실측 지표 JSON</a></div>
    </Header>
    <div className="runtime-toolbar"><span className="runtime-mode">{s?.mode ?? 'LIVE_REPLAY_MODE'}</span><b>{phase}</b><span>{s?.ai_enabled ? 'P1 Luna → P4 Sol · 비동기 실제 호출' : s?.mode === 'RECORDED_RESULT_DEMO_MODE' ? '저장 결과 · 실시간 AI 추론 아님' : 'Fast CV 실측 · AI 호출 비활성'}</span><span className="spacer"/><button className="btn btn-primary" disabled={!rt.connected || rt.busy || s?.phase !== 'IDLE'} onClick={() => void rt.act()}>9개 영상 동시 시작</button></div>
    {!rt.connected && <p className="runtime-notice" role="status">런타임 연결 대기 중입니다. 남아 있는 화면은 마지막 수신 상태입니다. 서버 포트 8011을 확인하세요.</p>}
    {rt.error && <p className="runtime-notice" role="alert">{rt.error}</p>}
    {selectedCandidate ? <CandidateDetail key={selectedCandidate.candidate_id} candidate={selectedCandidate} next={review.find(c => c.candidate_id !== selectedCandidate.candidate_id) ?? previews.find(c => c.candidate_id !== selectedCandidate.candidate_id)} busy={rt.busy} connected={rt.connected} onBack={() => setSelected(null)} onOpen={setSelected} onAct={(id, action) => void rt.act(id, action)} onDisplay={rt.displayed}/> : <main className="body">
      <div className="left"><section className="wall"><div className="wall-head"><div className="wall-title"><h2>CCTV 화면</h2><span>등록 {s?.cameras.length ?? 0}대 · 실제 MP4 / 1×</span></div><div className="toggle"><button aria-pressed={!onlyCandidates} onClick={() => setOnlyCandidates(false)}>전체 보기</button><button aria-pressed={onlyCandidates} onClick={() => setOnlyCandidates(true)}>관심 후보만</button></div></div>
        <div className="grid">{s?.cameras.map(camera => {
          const candidates = pending.filter(c => c.camera_id === camera.camera_id)
          const c = candidates.find(c => c.status === 'AI_DANGER_ESTIMATE') ?? candidates.find(needsReview) ?? candidates[0]
          if (onlyCandidates && !c) return null
          return <VisibleCandidate key={camera.camera_id} id={c?.candidate_id} onDisplay={rt.displayed}><button className="runtime-camera" disabled={!c} onClick={() => c && setSelected(c.candidate_id)} aria-label={`${camera.camera_id} ${c ? statusLabel[c.status] + ' 상세' : camera.state}`}><figure className="tile tile-md" data-tone={candidateTone(c)}>{s.frames[camera.camera_id] ? <img className="tile-frame" src={`data:image/jpeg;base64,${s.frames[camera.camera_id]}`} alt={`${camera.camera_id} 실제 재생 프레임`}/> : <p className="media-placeholder">{camera.state === 'ERROR' ? '카메라 오류' : '영상 시작 대기'}</p>}<div className="tile-shade"/><figcaption className="tile-label"><b>{camera.camera_id}</b><span>실제 CV · 관측 {camera.sampled}회</span></figcaption><span className="tile-chip" data-tone={candidateTone(c) ?? 'neutral'}>{c ? statusLabel[c.status] : camera.state === 'ERROR' ? '카메라 오류' : camera.state === 'ENDED' ? '재생 종료' : '관측 중 · 위험 판단 아님'}</span><div className="tile-time"><img src={dotRec} alt=""/><span>{camera.pts.toFixed(2)}초 · {camera.state}</span></div></figure></button></VisibleCandidate>
        })}</div>{!s && <div className="card runtime-section">실제 카메라 목록을 기다리고 있습니다.</div>}{onlyCandidates && !pending.length && <p className="wall-empty">관심 후보가 없습니다. 정상 확정 판정은 아닙니다.</p>}
      </section><section className="card runtime-monitor"><div className="queue-head"><h2>실시간 처리 현황</h2><span className="muted">P4 완료와 무관하게 먼저 표시</span></div><div className="runtime-flow"><span>9개 MP4</span><i>→</i><span>Fast CV</span><i>→</i><b>후보 먼저 표시</b><i>→</i><span>P1 / P4 비동기</span></div><dl><div><dt>후보→UI p50 / p95</dt><dd>{fmt(rt.metrics?.candidate_to_frontend_ms?.p50)} / {fmt(rt.metrics?.candidate_to_frontend_ms?.p95)} ms</dd></div><div><dt>전체 Decode / CV FPS</dt><dd>{fmt(rt.metrics?.effective_decode_fps_aggregate)} / {fmt(rt.metrics?.effective_cv_fps_aggregate)}</dd></div><div><dt>P1 / P4 대기 작업</dt><dd>{s?.queue.p1 ?? '—'} / {s?.queue.p4 ?? '—'}</dd></div><div><dt>P1 / P4 API 평균</dt><dd>{fmt(rt.metrics?.ai.p1_api_ms?.mean)} / {fmt(rt.metrics?.ai.p4_api_ms?.mean)} ms</dd></div></dl><p>T0 Human Annotation 미완료 · Time-to-First-Alert(T3−T0) 미측정. 위 지연은 T3−T1입니다.</p></section></div>
      <aside className="queue runtime-queue"><section className="hero"><p className="hero-kicker">지금 사람의 눈이 필요한 곳</p><div className="hero-ratio"><strong data-active={review.length > 0 || undefined}>{review.length}</strong><span className="hero-total">/ {s?.cameras.length ?? '—'}</span><span className="spacer"/><div className="hero-msg"><b>사람 검토 {review.length}건</b><span>초기 후보 {previews.length}건 · 확장 목표 477대</span></div></div><img className="hero-field" src={field} alt="477개 카메라 확장 목표 장식 · 실제 연결 상태 아님"/><ul className="legend"><li>실제 검증 범위 9대</li><li>후보 ≠ 위험 확정</li></ul></section>
        <div className="runtime-queue-list"><div className="queue-head"><h2>사람 확인 순서</h2><span className="muted">AI 위험 추정 우선 · 발생순</span></div>{review.length ? review.map(c => <CandidateCard key={c.candidate_id} candidate={c} onOpen={setSelected} onDisplay={rt.displayed}/>) : <section className="card queue-empty"><h3>사람 검토 대기 없음</h3><p>현장의 안전을 확정하는 판정은 아닙니다.</p></section>}
        <div className="queue-head"><h2>초기 후보 Preview</h2><span className="muted">분석 중에도 즉시 표시</span></div>{previews.length ? previews.map(c => <CandidateCard key={c.candidate_id} candidate={c} onOpen={setSelected} onDisplay={rt.displayed}/>) : <section className="card queue-empty"><h3>새로운 관측 후보 대기</h3><p>P1 정상 추정도 자동 삭제하지 않습니다.</p></section>}
        {!!completed.length && <><div className="queue-head"><h2>관제사 처리 기록</h2><span className="muted">{completed.length}건</span></div>{completed.map(c => <CandidateCard key={c.candidate_id} candidate={c} onOpen={setSelected} onDisplay={rt.displayed}/>)}</>}</div>
      </aside></main>}
  </div>
}
