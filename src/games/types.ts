import type { ComponentType } from 'react';

export type GameCategory = 'puzzle' | 'math' | 'word' | 'memory' | 'action' | 'art';

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  puzzle: '퍼즐',
  math: '숫자',
  word: '한글',
  memory: '기억력',
  action: '순발력',
  art: '그리기',
};

/**
 * 각 게임 폴더의 manifest.ts가 default export 하는 메타데이터.
 * 홈 화면 카드와 라우팅은 전부 이 정보로 만들어진다.
 */
export interface GameManifest {
  /** URL에 쓰이는 고유 id (폴더명과 동일하게) — #/games/<id> */
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  tags: string[];
  /** 추천 나이 [최소, 최대] */
  ages: [number, number];
  /** 카드 배경 색 */
  color: string;
  /** 카드에 보일 썸네일 (가벼운 SVG 컴포넌트 권장) */
  Thumbnail: ComponentType;
  /** 게임 본체 — 동적 import로 게임별 코드 분할 */
  load: () => Promise<{ default: ComponentType }>;
  /** 홈 정렬용 (작을수록 앞) */
  order?: number;
  badge?: 'new' | 'beta';
  /** true면 목록에서 숨김 (개발 중) */
  hidden?: boolean;
}

export const defineGame = (m: GameManifest) => m;
