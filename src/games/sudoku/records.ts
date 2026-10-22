import { MEDALS, medalOf, nextMedal, timeTarget, type Medal, type MedalLimits } from '@/shared/game/medals';
import type { BoardSize, Difficulty } from './engine';

export { MEDAL_ICON, MEDAL_LABEL, MEDALS, type Medal } from '@/shared/game/medals';

/** [다이아, 금, 은, 동] 기준 시간(초) — 빨리 풀수록 좋은 메달 */
const LIMITS: Record<BoardSize, Record<Difficulty, MedalLimits>> = {
  4: { easy: [15, 30, 60, 120], medium: [25, 45, 90, 180], hard: [40, 70, 120, 240] },
  9: { easy: [240, 480, 900, 1500], medium: [420, 720, 1200, 2100], hard: [600, 1020, 1680, 2700] },
};

const limitsMs = (size: BoardSize, difficulty: Difficulty) => LIMITS[size][difficulty].map((s) => s * 1000) as unknown as MedalLimits;

export function medalLimitMs(size: BoardSize, difficulty: Difficulty, medal: Medal) {
  return limitsMs(size, difficulty)[MEDALS.indexOf(medal)];
}

export function medalFor(size: BoardSize, difficulty: Difficulty, ms: number | undefined): Medal | null {
  return medalOf(limitsMs(size, difficulty), ms, 'lower');
}

/** 지금 시간 기준으로 아직 노릴 수 있는 가장 좋은 메달과 남은 시간 */
export function nextTarget(size: BoardSize, difficulty: Difficulty, elapsedMs: number) {
  return timeTarget(limitsMs(size, difficulty), elapsedMs);
}

/** 최고 기록보다 좋은 다음 메달 (기록 화면의 "다음 목표") */
export function nextMedalAfter(size: BoardSize, difficulty: Difficulty, bestMs: number | undefined) {
  const next = nextMedal(limitsMs(size, difficulty), bestMs, 'lower');
  return next && { medal: next.medal, limitMs: next.limit };
}
