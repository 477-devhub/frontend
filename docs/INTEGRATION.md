# 프론트 API 연동 기록

**HACKATHON-DAY · 2026-10-09**

백엔드 API 1.2, 모델 schema 1.1 계약을 사용합니다. 백엔드 소스는 수정하지 않았습니다.

완료: Vite 상대 경로 프록시, HTTP 조회/행동, WebSocket 전체 상태 갱신·재연결, 서버 데모 명시 조작, API/local 모드 분리, 서버 미디어/근거 표시, 오류와 오래된 상태 처리. 화면 이동과 데모 reset을 분리했습니다.

검증:
- 로컬 provider 7 PASS, API provider 6 PASS.
- 실제 localhost Vite → FastAPI HTTP/WebSocket 통합 1 PASS.
- 타입 검사 및 production build PASS.
- 통합 검증에서는 유료 모델 API 호출 없이 synthetic demo를 사용했습니다.

제한:
- browser 도구 초기화가 “failed to write kernel assets: 지정된 경로를 찾을 수 없습니다.”로 실패하여 브라우저 화면 조작·레이아웃 확인은 Not verified.
- 실제 입력 evidence/영상은 테스트 서버에 없었습니다. 재생 seek/구간 종료와 근거 이미지의 성공 렌더링은 Not verified. 파일 없음 처리는 확인했습니다.
- 새 연결 snapshot/실행ID 처리에는 기존 순서 검사 단위 테스트가 적용됩니다. 실제 서버 재시작을 동반한 브라우저 검증은 Not verified.
- 실제 모델 파이프라인 결과 ingestion, 인증, 영구저장소, 운영 배포는 별도 범위입니다.
- 개발 proxy 기준이며 정적 dist만 실행하면 API/WS proxy가 자동 제공되지 않습니다.

수동 확인:
1. localhost:5173 접속 → API 연결·합성 데모 표시 확인.
2. 상단 5단계 메뉴 클릭 → 3개 사건 및 ID별 상세 확인.
3. 확인 완료 → 큐 감소 → 화면 이동/새로고침 후 상태 유지 확인.
4. 상단 2단계 메뉴 클릭 → 제외 알림 복원 → UNKNOWN·사람 검토 확인.
5. 백엔드 중지 → 갱신 불가 표시·행동 잠금 → 재실행 후 새 snapshot 확인.
6. licensed MP4/실제 입력 evidence를 준비한 후 재생/seek/근거 확인.

## 메뉴 데모 및 레이아웃 수정 — HACKATHON-DAY
상단 단계 메뉴에서 서버 demo 또는 로컬 fixture를 적용합니다. development 모드에서는 데모 POST를 하지 않습니다. 메뉴 6은 데모 상세 상태를 생성해 첫 사건 ID를 선택합니다. 사건 카드 상세·목록 복귀는 데모를 초기화하지 않습니다. 별도 적용 버튼을 제거했습니다.
추가 상태행의 높이를 줄이고 flex 축소를 방지했습니다. 왼쪽 콘텐츠 내부 스크롤과 상세 타일 최소 높이를 지정해 고정 캔버스에서 내용이 잘리거나 영상 높이가 0으로 수축하지 않도록 했습니다. 빌드와 기존13단위 테스트 PASS. 브라우저 시각 확인은 도구 오류로 Not verified.

### 추가 상태 줄 제거 — HACKATHON-DAY
API 연결/합성 데모 표시는 기존 헤더 안으로 이동했습니다. 모드 변경·다시 조회·로컬 상태 예시는 헤더의 연결 설정 메뉴에 보관합니다. 성공/오류 안내는 캔버스 위에 겹쳐 표시하여 본문 높이를 차지하지 않습니다. 데모 적용 성공 문구는 생략합니다.

## 기존 디자인 복원 — HACKATHON-DAY
Figma pK7WGcPjkNjP7zaAbK4c13 / 50:2 및 hero50:198·summary50:235·analysis50:139의 design context와 screenshot을 확인했습니다. 기존 코드의 hero-ratio/hero-msg/hero-field/legend, 빈 큐와 현황 카드, funnel 막대·timeline·trace-summary를 복원했습니다. 원본 camera-field SVG5종과 범례·상태 점 자산을 재사용했습니다. hero p의 임의 padding12px를 제거했습니다.
데이터는 현재 snapshot/사건 API를 유지합니다. 목표477과 등록수는 구분하고 일일 누적·평균2.8초·어제 사건 같은 미제공 값은 생성하지 않습니다. 원본과 같은 구조에서 문구를 현재 의미로 표시합니다.
서버 is_demo일 때에만 기존 번들 영상 스틸/사건 썸네일을 합성 미리보기로 사용합니다. development의 실제 근거·영상은 서버 URL만 사용합니다. 점 배열은 synthetic 또는 확장 목표 장식이며 실제477 연결 지도가 아닙니다.
빌드/타입 검사 및13단위 테스트PASS. SVG 존재·root치수/사용위치 확인. 브라우저 초기화 오류로 실제 렌더링 geometry·시각 일치 검증은 Not verified.

HACKATHON-DAY: CCTV wall uses available vertical space with bounded grid rows on desktop. Removed left inner scrolling; mobile retains page scrolling. Backend transport unchanged.

HACKATHON-DAY: Removed desktop CCTV grid/tile height caps. Grid rows equally fill all remaining wall height above the analysis panel without inner scrolling.

HACKATHON-DAY: Fixed the actual flex allocation conflict: analysis previously retained flex:1 alongside wall flex:1. Desktop analysis now uses the Figma reference height of 218px, with the remaining height allocated to the 3x3 wall. API behavior unchanged. Browser visual QA remains Not verified.
