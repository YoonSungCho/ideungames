# 새 게임 추가하기

게임은 `src/games/<id>/` 폴더 하나로 완결된다. 폴더를 만들면 홈 화면 카드와 `#/games/<id>` 라우트가 자동으로 생긴다 (`src/games/registry.ts`가 `*/manifest.ts`를 수집).

## 1. 폴더 구조

```
src/games/<id>/
  manifest.ts      # 필수 — 메타데이터 (홈 카드, 라우팅)
  index.tsx        # 필수 — default export 게임 컴포넌트 (lazy-load 됨)
  Thumbnail.tsx    # 카드 썸네일 (가벼운 SVG 권장)
  store.ts         # 게임 상태 (zustand + persist, 키는 storageKey('<id>'))
  engine/          # 순수 로직 — React 의존 없음, *.test.ts 로 테스트
  ui/              # 화면 컴포넌트 + <Name>.module.css
```

## 2. manifest.ts

```ts
import { defineGame } from '../types';
import { MyThumbnail } from './Thumbnail';

export default defineGame({
  id: 'memory-cards',            // 폴더명과 동일
  title: '짝 맞추기',
  description: '같은 그림 카드를 찾아요',
  category: 'memory',            // puzzle | math | word | memory | action (types.ts)
  tags: ['그림', '기억력'],
  ages: [4, 8],
  color: '#ffe4ec',              // 카드 배경
  Thumbnail: MyThumbnail,
  load: () => import('./index'), // 반드시 동적 import (코드 분할)
  order: 10,                     // 홈 정렬 (작을수록 앞)
  badge: 'new',                  // 선택
  hidden: true,                  // 개발 중엔 true → dev 서버에서만 보임
});
```

## 3. 규칙

- **manifest.ts에서는 무거운 것을 import 하지 않는다.** 모든 manifest는 첫 화면에서 즉시 로드된다. 게임 코드는 `load()` 안으로.
- 공용 기능은 `src/shared/`에서 가져다 쓴다.
  - `useSettings()` — `playerName`, `mode`(`easy` | `challenge`), `sound`
  - `playSound(name)` — 효과음 (설정의 소리 on/off 자동 반영). 새 소리는 `shared/sound/sfx.ts`에 추가
  - `<Robot mood=… />` 마스코트 띠봇, `<Confetti />`, `<Modal>`, `<Button>`, `icons.tsx`
  - `callName(name)` — "이든아", `formatTime(ms)`
  - `useLeaveGuard(진행중)` — 진행 중엔 뒤로 가기 시 "게임을 그만할까?" 확인. 확인 창이 떠 있는 동안 `useLeaveAsking()`이 true이니 타이머 등을 멈춘다
  - `<ConfirmDialog>` — 아이가 실수로 누르기 쉬운 동작(진행 중인 판 취소 등)을 한 번 더 묻는 창
  - `storageKey('<id>')` — localStorage 키 (`ideun.<id>`). 설정 화면의 "기록 지우기"가 이 접두사로 동작
- 색/모서리/그림자는 `src/app/styles/tokens.css`의 CSS 변수를 사용한다.
- `mode === 'easy'`일 때는 실수 횟수 같은 압박 요소를 숨기고 칭찬 위주로.
- 터치(태블릿/폰)·마우스·키보드 모두 고려. 버튼은 최소 44px.
- 새 카테고리가 필요하면 `src/games/types.ts`의 `GameCategory`와 `CATEGORY_LABELS`에 추가.

## 4. 화면 안의 하위 화면

게임 라우트는 `/games/<id>/*` 이라서 게임 안에서 `<Routes>`로 하위 화면(예: `records`)을 둘 수 있다.
상단 ← 버튼은 하위 화면에서는 게임 첫 화면으로, 첫 화면에서는 홈으로 간다.

## 5. 확인

```bash
npm run dev        # http://localhost:5173/ideungames/
npm test
npm run build
```

새 화면·흐름을 만들면 `e2e/`에 Playwright 테스트를 추가하고 `npm run e2e`로 확인한다 (시스템 Chrome 사용).
`e2e/responsive.spec.ts`가 폰·폴드·태블릿·PC 크기에서 버튼이 화면 밖으로 나가지 않는지 검사한다.
