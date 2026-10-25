# 이든 게임즈

이든이를 위한 두뇌 게임 놀이터. 정적 웹앱(PWA)으로 GitHub Pages에서 동작한다.

- 배포 주소: https://yoonsungcho.github.io/ideungames/
- 게임
  - 스도쿠: 2×2 블록(4×4판) · 3×3 블록(9×9판), 쉬움 / 중간 / 어려움
  - 빠른 계산: 덧셈·뺄셈·곱셈(구구단)·나눗셈, 20문제 기록 / 60초 타임어택
  - 한글 용사: 뒤죽·박죽 마왕에게서 한글 나라 구하기 — 자음 마을 → 모음 바다 → 글자 성 → 받침 동굴 → 낱말 숲 → 반대말 다리 → 문장 하늘, 보스전·이야기·한글 도감
  - 한글 몬스터: 포켓몬처럼 지도 8곳을 걸어 다니며 몬스터 43종을 만나 턴 배틀 — 기술 = 문제 (자음·모음·받침·낱말·글자 짓기·문장 순서는 한글 용사, 숫자⚡·계산⚙️은 숫자 비·빠른 계산 문제). 체육관 6곳, 🧩 스도쿠 상자·☔ 숫자 비·⚡ 빠른 계산 미니 게임, 🗺️ 전체 지도와 다음 목표 안내
  - 짝꿍 카드: 카드를 뒤집어 짝 찾기 — 그림 5가지(동물·과일·탈것·바다·간식), 같은 그림 / 그림과 글자(낱말 읽기) 규칙, 3~12쌍 4단계, 시작할 때 잠깐 미리 보기, 시간 메달
  - 미로 탈출: 매번 새로 만들어지는 미로(5×5~13×13)를 지나 친구 5마리(토끼·강아지·펭귄·꿀벌·생쥐)를 간식까지 — 방향 버튼·밀기(굽은 길 따라 쭉)·같은 줄 칸 누르기·화살표 키, ⭐ 별 3개, 💡 길 힌트, 시간 메달
  - 숫자 비: 떨어지는 숫자를 땅에 닿기 전에 맞히기 — 모드 9가지(숫자 보기·개수 세기·숫자 읽기·10까지 더하기/빼기·20까지 넘기기·자릿수·두 자리 계산·구구단), 빠르기 3단계, 💣 폭탄(모두 터짐)·❄️ 얼음(느려짐)·💖 하트(목숨), 피버 타임, 배경 음악

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # 테스트 (vitest)
npm run build    # 타입체크 + 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
npm run e2e      # 빌드 + Playwright E2E (시스템 Chrome)
```

작업 규칙·교훈: [CLAUDE.md](CLAUDE.md) · 화면 규칙: [docs/GAME_UX_GUIDE.md](docs/GAME_UX_GUIDE.md) · 테스트: [docs/TESTING.md](docs/TESTING.md)

## 구조

```
src/
  app/        # 셸: 라우터(createHashRouter), 홈/게임/설정 페이지, 업데이트 알림(PWA), 전역 스타일·토큰
  shared/     # 공용: 설정, 효과음(Web Audio), 마스코트 Robot, 나가기 확인(leaveGuard), HeaderSlot, ConfirmDialog 등
  games/
    registry.ts       # games/*/manifest.ts 자동 수집
    types.ts          # GameManifest, 카테고리
    sudoku/           # 게임 1개 = 폴더 1개 (engine / store / records / ui)
    quick-math/       # 빠른 계산
    hangul-monster/   # 한글 몬스터 (data: 몬스터·기술·지도·사람, engine: 배틀·걷기·성장, ui: MonsterArt(부품 조립 그림)·MapArt(SVG 지도)·Minis. 다른 게임 엔진을 모두 씀)
    maze-escape/      # 미로 탈출 (engine/maze: 만들기·밀기·같은 줄 걷기·힌트 길, ui/walker: 한 칸씩 걷는 줄)
    memory-cards/     # 짝꿍 카드 (engine/deck: 테마·나누기·뒤집기 순수 로직, ui/Board: 판 크기에 맞춰 열·행 자동)
    number-rain/      # 숫자 비 (engine: 문제·떨어지기 순수 로직, 배경 음악은 shared/sound/music.ts)
    hangul-hero/      # 한글 용사 (engine: 한글 조합·문제, data: 낱말 사전(words 그림 430 + vocab 글자, 무리 21개)·문장·반대말·지역·이야기 대본)
  shared/game/  # 게임 공용: 시작하기 오버레이, 타이머·자동 멈춤, 메달, 기록
e2e/          # Playwright: flow / journeys(나가기·돌아오기) / responsive(뷰포트 12종)
```

새 게임 추가: [docs/ADDING_A_GAME.md](docs/ADDING_A_GAME.md)

## 배포

`main`에 push하면 GitHub Actions가 테스트 → 빌드 → Pages 배포를 한다.
최초 1회: 저장소 **Settings → Pages → Source = GitHub Actions**.

커스텀 도메인을 연결하면 `BASE_PATH=/` 로 빌드하도록 워크플로의 build 단계에 환경변수를 추가하고 `public/CNAME`을 만든다.

앱 업데이트: 새 버전이 배포되면 앱 상단에 "새 버전이 있어요 [업데이트]" 알림이 뜬다 (설정 → 앱 정보 → 업데이트 확인도 가능).

PWA 아이콘은 `public/favicon.svg`를 고친 뒤 `npm run icons`로 다시 생성한다.
