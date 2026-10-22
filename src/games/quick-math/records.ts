import { medalOf, nextMedal, scoreTarget, timeTarget, type Better, type MedalLimits } from '@/shared/game/medals';
import type { Difficulty } from './engine';
import type { GameMode, Setup } from './store';

export const BETTER: Record<GameMode, Better> = { sprint: 'lower', blitz: 'higher' };

/** 20문제 기록: 문제당 금메달 기준 초 */
const SPRINT_GOLD_SEC: Record<Difficulty, number> = { easy: 3, medium: 4.5, hard: 7 };
/** 60초 점수: 금메달 기준 정답 수 */
const BLITZ_GOLD: Record<Difficulty, number> = { easy: 20, medium: 13, hard: 9 };

export function medalLimits(setup: Pick<Setup, 'mode' | 'difficulty'>): MedalLimits {
  if (setup.mode === 'sprint') {
    const gold = SPRINT_GOLD_SEC[setup.difficulty] * 20 * 1000;
    return [gold * 0.65, gold, gold * 1.6, gold * 2.6].map(Math.round) as unknown as MedalLimits;
  }
  const g = BLITZ_GOLD[setup.difficulty];
  return [Math.round(g * 1.4), g, Math.round(g * 0.65), Math.max(1, Math.round(g * 0.35))];
}

export const medalFor = (setup: Pick<Setup, 'mode' | 'difficulty'>, value: number | undefined) =>
  medalOf(medalLimits(setup), value, BETTER[setup.mode]);

export const nextMedalFor = (setup: Pick<Setup, 'mode' | 'difficulty'>, best: number | undefined) =>
  nextMedal(medalLimits(setup), best, BETTER[setup.mode]);

/** 게임 중 실시간 목표: 20문제는 남은 시간, 60초는 필요한 정답 수 */
export function liveTarget(setup: Pick<Setup, 'mode' | 'difficulty'>, elapsedMs: number, correct: number) {
  const limits = medalLimits(setup);
  if (setup.mode === 'sprint') {
    const t = timeTarget(limits, elapsedMs);
    return t && { medal: t.medal, sprintLeftMs: t.leftMs };
  }
  const t = scoreTarget(limits, correct);
  return t && { medal: t.medal, need: t.need };
}
