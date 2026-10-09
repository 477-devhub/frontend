# Figma 관제 UI / Fast Alert 직접 연결

## 실행

먼저 D:/projects/477에서 `python -m runtime477.run --ai --max-ai-jobs 3 --port 8011` 실행.
API 없이 실제 CV만 시연하려면 `--ai` 생략. 기존 실험 환경·영상·모델을 사용한다.

프론트:

```powershell
cd D:\projects\477-frontend
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
```

http://127.0.0.1:5174/?mode=live-replay 에서 `9개 영상 동시 시작`을 누른다.
브라우저 탭을 전면에 유지한다. 재시연은 런타임 서버를 종료 후 재시작한다.
기존 `/` 시나리오 데모는 그대로 유지한다.

## 실제 연결

- iframe 제거. 기존 Header/자산/스타일/반응형 확대축소와 Figma 50:2의 3×3 + 우측 관제 구성을 재사용.
- `/runtime/ws` 최신 프레임·후보·상태를 React로 직접 렌더링. 동일 revision에서도 프레임 갱신 허용.
- 초기 후보는 황색, 사람 검토는 보라색, AI 위험 **추정**은 신호색. 단계별 판단을 위험 확정과 구분.
- P1 정상 추정 자동 제거 없음. 관제사 확인/종결만 처리 기록으로 이동.
- 원본 MP4 range 재생, 후보 시점으로 seek, 실제 preview/P4 evidence 표시.
- 화면에 보인 후보만 IntersectionObserver + 두 animation frame 뒤 서버 시간축의 T3 ACK 전송.
- T3−T1과 T3−T0를 구분. T0 미주석이므로 Time-to-First-Alert는 미측정.
- 연결 끊김/오래된 프레임 안내, 재접속, 상태 회귀 방지. AI 실패는 사람 검토.
- 기존 Incident DB에는 복제하지 않음. 런타임 ledger가 상태와 audit의 소유자.

Vite의 `/runtime` 프록시는 8011을 가리키며 기존 8000 API 프록시는 변경하지 않는다.
프로덕션 정적 배포에는 동일 prefix rewrite + WebSocket upgrade 프록시 설정이 필요하다.

## 검증

`npm run build`, `node scripts/test-local.mjs`.
새 4개 테스트: 예비/정상 후보 유지, 오류 검토 분기, Human 판단 우선, 같은 revision 프레임 및 stale/restart 처리.
실제 브라우저/9 MP4 결과는 D:/projects/477/runtime477/reports/REACT_UI_INTEGRATION.ko.md 참조.
