# 이든 게임즈

이든이를 위한 두뇌 게임 놀이터. 정적 웹앱(PWA)으로 GitHub Pages에서 동작한다.

- 배포 주소: https://yoonsungcho.github.io/ideungames/
- 게임: 스도쿠 4×4 · 6×6 · 8×8 (각각 쉬움 / 중간 / 어려움)

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # 테스트 (vitest)
npm run build    # 타입체크 + 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
src/
  app/        # 셸: 라우터(HashRouter), 홈/게임/설정 페이지, 전역 스타일·토큰
  shared/     # 공용: 설정 스토어, 효과음(Web Audio), 마스코트 Robot, UI 컴포넌트
  games/
    registry.ts       # games/*/manifest.ts 자동 수집
    types.ts          # GameManifest, 카테고리
    sudoku/           # 게임 1개 = 폴더 1개 (engine / store / ui)
```

새 게임 추가: [docs/ADDING_A_GAME.md](docs/ADDING_A_GAME.md)

## 배포

`main`에 push하면 GitHub Actions가 테스트 → 빌드 → Pages 배포를 한다.
최초 1회: 저장소 **Settings → Pages → Source = GitHub Actions**.

커스텀 도메인을 연결하면 `BASE_PATH=/` 로 빌드하도록 워크플로의 build 단계에 환경변수를 추가하고 `public/CNAME`을 만든다.

PWA 아이콘은 `public/favicon.svg`를 고친 뒤 `npm run icons`로 다시 생성한다.
