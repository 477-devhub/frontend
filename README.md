# 477 Frontend

범위: **HACKATHON-DAY**, 2026-10-09. 사전 제작 UI·이미지·API 예시 위에 API 연동을 추가했습니다.

## 로컬 실행

백엔드 터미널에서 (Python 3.12 테스트 환경):
```powershell
cd C:\477\backend
$env:APP_MODE = "demo"
$env:DEMO_SCENARIO_PATH = "config/demo-scenario.json"
$env:CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
.\.venv-test\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

프론트 터미널에서:
```powershell
cd C:\477\477_front
npm run dev
```

- API 모드: http://127.0.0.1:5173/
- 로컬 fixture 모드: http://127.0.0.1:5173/?source=local
- 서버 demo 모드에서는 상단 단계 메뉴를 누르면 해당 서버 데모를 적용합니다. 이 동작은 기존 데모 ACK 상태도 초기화합니다.
- 서버 데모의 단계 메뉴는 명시적으로 데모를 초기화합니다. 사건 카드 상세 이동·뒤로가기는 API 상태를 초기화하지 않습니다. 서버가 없으면 오류를 표시하며 fixture로 자동 대체하지 않습니다.
- Vite가 /api, /stream, /ws를 127.0.0.1:8000으로 전달합니다. 이 프록시는 개발 서버용입니다. 배포 시 동일 경로 reverse proxy와 WebSocket 업그레이드 설정이 별도로 필요합니다.

## 연결 범위

API 1.2 snapshot/사건 상세/제외 알림/clip/ACK/복원/데모 조작과 WebSocket 전체 snapshot을 연결합니다. 서버 순위·nullable 위험도·별도 confidence를 유지합니다. 재연결 첫 snapshot과 server_instance_id 변경을 처리하며 낮은 revision은 무시합니다. heartbeat가 40초 동안 없으면 오래된 상태로 전환하고 재연결합니다.

POST에는 작업별 Idempotency-Key를 사용합니다. ACK·복원에서 전송 실패 재시도는 같은 키를 사용합니다. 불확실한 연결 상태에서는 행동을 잠급니다. request_dispatch와 handover는 서버의 의도/담당자 기록이며 외부 신고나 통신을 수행하지 않습니다.

서버가 제공하는 상대 영상 URL과 입력 evidence 이미지 URL을 표시합니다. full_file 영상은 원본 구간 시작으로 이동하고 끝에서 정지합니다. 현재 bbox_track이 없는 경우 임의 박스를 만들지 않습니다. 파일 없음·재생 실패·근거 없음은 빈 상태로 표시합니다. 서버 is_demo인 경우 원본 UI의 번들 이미지를 합성 미리보기로 표시합니다. development의 실제 근거는 번들 이미지로 대체하지 않습니다.

**API 연결 성공은 실제 AI 분석 성공을 뜻하지 않습니다.** demo의 사건은 합성 데이터입니다. 기존 CLI 모델 실행 결과는 자동 입력되지 않으며 모델 ingestion 연결은 별도 범위입니다. 카메라 수·처리 입력 수는 실시간 CCTV 접속 수가 아닙니다. latency/cost/accuracy 개선 수치는 미측정입니다.

## 검증

- npm test: 로컬 provider 7개 + API provider 6개 테스트
- npm run test:integration: 실행 중인 로컬 demo 백엔드와 Vite를 통해 HTTP/WS/ACK/복원/404/409/미디어503 검증
- npm run build: 타입 검사 + 빌드

통합 테스트는 서버 demo 상태를 변경하고 마지막에 1단계로 초기화합니다. 공유 데모가 진행 중일 때는 실행하지 마세요.

## 코드와 출처

src/contracts/api.ts: API 타입.
src/console/apiProvider.ts: 네트워크 요청 및 재연결.
src/console/useConsole.ts: 공통 화면 상태.
src/console/localProvider.ts: 네트워크 없는 fixture.
src/fixtures/backend-api-v1.2.json: 백엔드 docs/api-examples-v1.2.json의 사본이며 실제 모델 결과가 아닙니다.

팀 push 대상: https://github.com/477-devhub/frontend.git
백엔드 팀 저장소: https://github.com/477-devhub/backend.git
커밋·push는 이번 작업에서 수행하지 않았습니다.

## 다각도 시나리오
새 설정과 영상 배치는 docs/DEMO_SCENARIO.md 참조. CAM1-3 사건1건/대표CAM2, 독립CAM6 임시사건후보 예시이며 나머지구역의 내용은 미정입니다. 헤더 연결 설정에 녹화 영상 전체 재생 제어가 있습니다. 현재 사용자 제공 녹화 영상 9개(서로 다른 원본9개)를 배치했고 실제 재생/종료를 확인했습니다. 실제 AI 분석 시연은 docs/MONITORING_CYCLE.md의 development/cascade_v1 실행을 사용합니다.
