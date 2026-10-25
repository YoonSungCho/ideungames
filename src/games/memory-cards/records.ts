import { medalOf, nextMedal, timeTarget, type MedalLimits } from '@/shared/game/medals';
import type { Level, Rule } from './engine/deck';

/** 단계별 [다이아, 금, 은, 동] 초 (같은 그림 기준) */
const LIMIT_SEC: Record<Level, [number, number, number, number]> = {
  tiny: [6, 10, 16, 30],
  easy: [20, 30, 45, 75],
  medium: [32, 45, 70, 110],
  hard: [60, 85, 130, 200],
};
/** 그림과 글자는 글자를 읽어야 해서 조금 넉넉하게 */
const RULE_SCALE: Record<Rule, number> = { same: 1, word: 1.3 };

type Key = { level: Level; rule: Rule };

export const medalLimits = ({ level, rule }: Key): MedalLimits =>
  LIMIT_SEC[level].map((s) => Math.round(s * RULE_SCALE[rule] * 1000)) as unknown as MedalLimits;

export const medalFor = (k: Key, ms: number | undefined) => medalOf(medalLimits(k), ms, 'lower');
export const nextMedalFor = (k: Key, best: number | undefined) => nextMedal(medalLimits(k), best, 'lower');
export const liveTarget = (k: Key, elapsedMs: number) => timeTarget(medalLimits(k), elapsedMs);
