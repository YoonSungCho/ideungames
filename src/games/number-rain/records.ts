import { medalOf, nextMedal, scoreTarget, type MedalLimits } from '@/shared/game/medals';
import type { Speed } from './engine/game';
import type { Mode } from './engine/questions';

/** 금메달 점수 (모드별 — 오래 생각하는 모드일수록 낮게) */
const GOLD: Record<Mode, number> = { digit: 40, count: 30, word: 25, add10: 30, sub10: 28, addsub20: 22, place: 22, two: 18, mul: 20 };
const SPEED_BONUS: Record<Speed, number> = { slow: 1, normal: 1, fast: 0.85 };

export function medalLimits(mode: Mode, speed: Speed): MedalLimits {
  const g = Math.round(GOLD[mode] * SPEED_BONUS[speed]);
  return [Math.round(g * 1.6), g, Math.round(g * 0.6), Math.max(3, Math.round(g * 0.3))];
}

export const medalFor = (mode: Mode, speed: Speed, score: number | undefined) => medalOf(medalLimits(mode, speed), score, 'higher');
export const nextMedalFor = (mode: Mode, speed: Speed, best: number | undefined) => nextMedal(medalLimits(mode, speed), best, 'higher');
export const liveTarget = (mode: Mode, speed: Speed, score: number) => scoreTarget(medalLimits(mode, speed), score);
