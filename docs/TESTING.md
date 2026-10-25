# 테스트 하네스

## 단위 테스트 — Vitest (`npm test`)

- `src/**/*.test.ts(x)`, 환경 jsdom.
- 게임 로직(`engine/`)은 React 없이 순수 함수로 두고 여기서 검증한다. 무작위 생성은 시드(`createRng(seed)`)로 재현.
- 스토어(zustand)는 `useSudoku.getState()`로 직접 조작해 규칙을 검증한다. persist 마이그레이션도 테스트한다
  (`localStorage`에 옛 버전 JSON을 넣고 `useX.persist.rehydrate()`).
- 무작위 판에서 "틀린 숫자"를 고를 땐 이미 다 쓴 숫자(카드 비활성)를 피한다 — 가끔 실패하는 테스트의 원인이었다.

## E2E — Playwright (`npm run e2e`)

빌드 결과를 `vite preview`(포트 4180)로 띄우고 **시스템 Chrome**(`channel: 'chrome'`)으로 돌린다. 서비스 워커는 차단.
프로젝트 2개: `phone`(Pixel 7, 터치) / `desktop`(1280×800).

| 파일 | 내용 |
|---|---|
| `e2e/helpers.ts` | `openNewGame`, `startGame`, `placeOneCorrect`, `solveAll`(저장소의 정답 사용), `timerText`, `expectFitsViewport` |
| `e2e/flow.spec.ts` | 시작하기/멈춤/모드 전환 확인/난이도 변경 확인/클리어→기록/도전 모드/키보드 |
| `e2e/journeys.spec.ts` | **나갔다 들어오는 모든 경로**에서 기대 화면 (GAME_UX_GUIDE §2 표와 1:1) |
| `e2e/quick-math.spec.ts` + `math-helpers.ts` | 빠른 계산: 메뉴·시작·정답/오답/정답 공개·20문제 완주·60초 종료(`page.clock`)·방식 전환·나가기/돌아오기·키보드 |
| `e2e/hangul-hero.spec.ts` + `hero-helpers.ts` | 한글 용사: 프롤로그·잠금·지역 이야기 1회·단계 진행·정답 공개·음성 없음/있음(`speechSynthesis.getVoices` 대체)·그만하기→이어하기·보스전·엔딩·인증서. `seed()`로 진행 상태를 심는다 |
| `e2e/number-rain.spec.ts` + `rain-helpers.ts` | 숫자 비: 시작 전엔 비가 안 내림·터뜨리기·틀림·폭탄·하트/얼음·두 자리와 ✔·목숨 다 잃으면 결과(`page.clock`)·나가기/새로고침/멈춤·음악 버튼·키보드. 물방울 답은 `data-answer`, 판은 멈출 때 저장되므로 `seedRain()`이 멈춤 → 저장소 수정 → 새로고침 |
| `e2e/hangul-monster.spec.ts` + `monster-helpers.ts` | 한글 몬스터: 처음 시작·첫 친구·누른 칸으로 걷기·졸개 배틀(문제 맞혀 공격)·틀리면 정답 안내·수풀에서 잡기·전멸하면 센터·체육관 배지와 지기·상점·센터·배틀 중 나가기·메뉴·음악·키보드. `seedMonster()`로 위치·친구를 심고, 칸은 `data-xy`, 정답 보기는 `data-correct` |
| `e2e/responsive.spec.ts` | 뷰포트 12종 × 게임·모드별: 가로 스크롤 없음, 버튼이 화면 안(스크롤 영역 안은 허용), 보드 칸 ≥30px, 카드 ≥40px, 세로는 보드가 폭을 채움, 가로는 카드가 보드 오른쪽. 클리어 창·기록 화면도 검사. 스크린샷을 `test-results/`에 남김 |

### 뷰포트 목록 (responsive.spec.ts)

폴드 커버 344×882, 폴드 와이드 커버 480×760, 폰 412×915, 폰+주소창 412×760, 작은 폰 360×640,
폴드 펼침 884×720, 폰 가로 915×412, 폰 가로+주소창 844×340, 작은 가로 740×360, 태블릿 820×1180, 태블릿 가로 1180×820, PC 1440×900.

### 쓰는 원칙

1. **기대값은 사용자가 기대하는 화면**으로 쓴다. 현재 동작을 복사하지 않는다. 먼저 "이 상황에서 아이는 무엇을 봐야 하나?"를 정하고 테스트로 고정.
2. 새 화면·흐름을 만들면 같은 커밋에 E2E를 추가한다. 나가기/돌아오기 경로가 생기면 `journeys.spec.ts`에 추가.
3. 접근 가능한 이름(role + name)으로 찾는다 → 버튼에 `aria-label`을 붙이는 습관.
4. 테스트가 통과해도 **스크린샷을 눈으로 본다** (겹침·잘림·어색한 빈 공간은 숫자 검사로 안 잡힌다).
   여러 장을 한 번에 보려면 스크린샷을 모은 HTML을 만들어 한 장으로 캡처한다.
5. 시간 제한 흐름(60초 등)은 `page.clock.install()` 후 `page.clock.runFor(ms)`로 기다리지 않고 검사한다.
6. 정답 뒤 애니메이션이 있는 게임은 **다음 문제가 나올 때까지** 기다린 뒤 다음 입력 (상태 일부만 바뀐 걸 보고 넘어가면 옛 문제를 푼다).
7. 저장소를 지우기 전에 게임을 멈춘다 (진행 중 타이머가 다시 써 버림). 지운 뒤에는 `page.reload()`.
