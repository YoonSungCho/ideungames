import { medalOf, nextMedal, timeTarget, type MedalLimits } from '@/shared/game/medals';
import type { Level } from './store';

/** 단계별 [다이아, 금, 은, 동] 초 */
const LIMIT_SEC: Record<Level, [number, number, number, number]> = {
  tiny: [6, 10, 18, 30],
  easy: [12, 20, 32, 55],
  medium: [25, 40, 65, 100],
  hard: [45, 70, 110, 170],
};

export const medalLimits = (level: Level): MedalLimits => LIMIT_SEC[level].map((s) => s * 1000) as unknown as MedalLimits;
export const medalFor = (level: Level, ms: number | undefined) => medalOf(medalLimits(level), ms, 'lower');
export const nextMedalFor = (level: Level, best: number | undefined) => nextMedal(medalLimits(level), best, 'lower');
export const liveTarget = (level: Level, elapsedMs: number) => timeTarget(medalLimits(level), elapsedMs);
