import type { BoardSize, Difficulty } from './engine';

/** 메달 — 빠를수록 높은 메달. 기준 시간(초)보다 빨리 풀면 획득. */
export type Medal = 'diamond' | 'gold' | 'silver' | 'bronze';
export const MEDALS: Medal[] = ['diamond', 'gold', 'silver', 'bronze'];
export const MEDAL_ICON: Record<Medal, string> = { diamond: '💎', gold: '🥇', silver: '🥈', bronze: '🥉' };
export const MEDAL_LABEL: Record<Medal, string> = { diamond: '다이아', gold: '금', silver: '은', bronze: '동' };

/** [다이아, 금, 은, 동] 기준 시간(초) */
const LIMITS: Record<BoardSize, Record<Difficulty, [number, number, number, number]>> = {
  4: { easy: [15, 30, 60, 120], medium: [25, 45, 90, 180], hard: [40, 70, 120, 240] },
  9: { easy: [240, 480, 900, 1500], medium: [420, 720, 1200, 2100], hard: [600, 1020, 1680, 2700] },
};

export function medalLimitMs(size: BoardSize, difficulty: Difficulty, medal: Medal) {
  return LIMITS[size][difficulty][MEDALS.indexOf(medal)] * 1000;
}

export function medalFor(size: BoardSize, difficulty: Difficulty, ms: number | undefined): Medal | null {
  if (ms === undefined) return null;
  return MEDALS.find((m) => ms <= medalLimitMs(size, difficulty, m)) ?? null;
}

/** 지금 시간 기준으로 아직 노릴 수 있는 가장 좋은 메달과 남은 시간 */
export function nextTarget(size: BoardSize, difficulty: Difficulty, elapsedMs: number) {
  for (const medal of MEDALS) {
    const left = medalLimitMs(size, difficulty, medal) - elapsedMs;
    if (left > 0) return { medal, leftMs: left };
  }
  return null;
}

/** 최고 기록보다 좋은 다음 메달 (기록 화면의 "다음 목표") */
export function nextMedalAfter(size: BoardSize, difficulty: Difficulty, bestMs: number | undefined) {
  const current = medalFor(size, difficulty, bestMs);
  const idx = current ? MEDALS.indexOf(current) : MEDALS.length;
  if (idx === 0) return null;
  const medal = MEDALS[idx - 1];
  return { medal, limitMs: medalLimitMs(size, difficulty, medal) };
}
