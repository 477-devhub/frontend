# 녹화 영상 데모
**HACKATHON-DAY · 2026-10-09**

API 모드는 백엔드 config/demo-scenario.json의 설정을 GET /api/demo/scenario로 조회합니다. 로컬 fixture 모드는 src/fixtures/demo-scenario.json 사본을 사용합니다. 두 파일은 독립 저장소용 사본이므로 로컬 모드에서도 바뀐 설정을 쓰려면 사본을 함께 갱신하세요.

CAM1/2/3: SCENE-A 사건1건, 대표CAM2만 빨간테두리, CAM1/3은 보조 영상이며 테두리 없음.
CAM4-9: 각자 다른구역, 영상 내용/역할 미정. CAM6 숫자위험도 사건후보는 임시 예시이며 데이터가 오면 변경합니다.
상단3단계는 다각도 사건,4/5단계는 임시 사건 후보 추가.6단계 메뉴는 다각도 사건 상세를 열고, 큐 카드에서는 어느 사건이나 열 수 있습니다.

상세는 primary_cam의 큰 영상과 related_cams 보조영상을 표시합니다. 위험/확신도/큐 순서는 서버 값을 사용합니다.
헤더 연결 설정에서 전체재생/일시정지/처음으로 조작합니다. 공통 원본시계와 CAM별offset을 사용하며 숨겨졌다 다시 나타나는 영상은 현재 재생시점으로 맞춥니다. 영상은 자동루프하지 않고 종료길이에서 정지합니다.
같은 재생시계를 쓰는 것과 같은 사건으로 묶는 것은 별개이며, CAM4-9는 서로 독립 사건입니다.

영상 배치: backend의 MEDIA_ROOT/CAM_01.mp4 ~ CAM_09.mp4.
파일은 아직 받지 않았습니다. 실제 재생/offset보정/동기화오차는 Not verified. 존재하는 demo MP4는 스틸 대신 재생하며 실제입력의 근거로 간주하지 않습니다.

판단출처 scripted_not_ai; AI 호출/실제모델판단 없음. UNKNOWN 후보는 안전정책에 따라 수치위험 사건보다 먼저 정렬될 수 있습니다.
프론트15단위테스트/실제API통합1PASS/타입검사빌드PASS. 브라우저 시각검증 도구 오류로 Not verified.

## HACKATHON-DAY: 사용자 지정 기준선
노란 테두리는 위험도65점 초과(66부터)이며 src/console/highlightPolicy.ts의 CANDIDATE_RISK_THRESHOLD에 있습니다. 대표CAM에만 적용합니다. 긴급은빨강, 위험미측정/별도검토는검토표시를유지합니다. 검토flag가있더라도risk>65면노란테두리+사람검토문구로 위험과검토를별도표시합니다. 낮은점수사건을자동삭제하거나정상으로판정하지않습니다.
CAM06 임시예시는risk71/confidence89%/reviewfalse입니다. 실제모델출력아닙니다.17단위+1API통합+buildPASS.
