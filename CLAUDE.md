# 이든 게임즈 — 작업 규칙

아이(이든)를 위한 게임 허브. Vite + React 19 + TypeScript, zustand, react-router(hash), PWA, GitHub Pages.
배포: https://yoonsungcho.github.io/ideungames/ (main push → Actions가 test → build → 배포)

## 먼저 읽을 문서

- [docs/ADDING_A_GAME.md](docs/ADDING_A_GAME.md) — 새 게임 폴더 구조, manifest, 공용 모듈, 체크리스트
- [docs/GAME_UX_GUIDE.md](docs/GAME_UX_GUIDE.md) — 모든 게임이 지켜야 할 화면 흐름·배치·반응형 규칙
- [docs/TESTING.md](docs/TESTING.md) — 단위/E2E 테스트 하네스, 뷰포트 목록, 쓰는 원칙
- 게임 공용 부품: `src/shared/game/` (시작하기 오버레이, 타이머, 메달, 기록) — 새 게임은 이걸 쓴다

## 작업 방식 (사용자가 정한 것)

- **끝나면 자동으로 커밋·푸시**한다. 묻지 않는다. 푸시 전 반드시 `npx tsc -b && npm test && npm run e2e` 통과.
  푸시 후 `gh run watch`로 배포 성공까지 확인하고 결과를 보고한다.
- **말하지 않아도 모든 UI를 E2E로 점검**하고, 어색하거나 잘못된 흐름은 알아서 고친다.
- **항상 반응형**: 폰 세로/가로(주소창 포함 낮은 높이), 갤럭시 폴드 커버·와이드 커버·펼침, 태블릿, PC.
- 응답·UI 문구는 한국어. 아이가 읽는 문구는 짧고 다정하게 ("~해 봐!", "~할까?").

## 꼭 기억할 교훈

- **E2E 기대값은 "아이가 기대하는 화면"으로 쓴다.** 지금 코드가 하는 동작을 그대로 정답으로 적지 않는다.
  (예전에 "그만하기 → 다시 들어오면 멈춤 화면"을 정답으로 적어 둬서 어색한 흐름이 통과했다.)
- **CSS 모듈에서 화면 크기별 덮어쓰기(@media)는 기본 규칙보다 파일 뒤쪽에** 둔다. 앞에 두면 같은 우선순위의
  기본 규칙에 덮여서 조용히 무시된다. 더 구체적인 선택자(`.pad9 .card`)도 덮어쓰기에서 같은 구체성으로 맞춘다.
- 무한 반복 애니메이션은 **버튼 자체가 아니라 `::after` 장식**에 건다 (Playwright가 "안정되지 않음"으로 클릭 못 함, 실제 터치도 흔들림).
- 스크롤 영역에서 `align-content: center`는 넘치면 위가 잘린다 → `safe center`.
- 중첩 라우트에서 `navigate('..')`는 라우트 기준 → 게임 안 이동은 절대 경로로.
- 아이 관점 점검: 문제 글에 정답을 적지 않았는지, 음성이 없을 때도 풀 수 있는지, 조사가 맞는지, 다음 할 일이 보이는지.
- 진행 중 타이머가 1초마다 저장소에 쓰므로, 테스트에서 저장소를 지울 땐 먼저 멈춘다.

## 명령

```bash
npm run dev       # http://localhost:5173/ideungames/
npm test          # vitest (src/**/*.test.ts)
npm run e2e       # 빌드 + Playwright (시스템 Chrome, e2e/)
npx tsc -b        # 타입체크
```
