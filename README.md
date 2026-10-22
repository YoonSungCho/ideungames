# 이든 게임즈

이든이를 위한 두뇌 게임 놀이터. 정적 웹앱(PWA)으로 GitHub Pages에서 동작한다.

- 배포 주소: https://yoonsungcho.github.io/ideungames/
- 게임
  - 스도쿠: 2×2 블록(4×4판) · 3×3 블록(9×9판), 쉬움 / 중간 / 어려움
  - 빠른 계산: 덧셈·뺄셈·곱셈(구구단)·나눗셈, 20문제 기록 / 60초 타임어택

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
