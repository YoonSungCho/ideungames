import { theme, type Level, type Rule } from '../engine/deck';
import type { Setup } from '../store';

export const LEVEL_LABEL: Record<Level, string> = { tiny: '꼬마', easy: '쉬움', medium: '중간', hard: '어려움' };
export const LEVEL_STARS: Record<Level, number> = { tiny: 1, easy: 2, medium: 3, hard: 4 };
/** 단계 색 (카드 그림자·별) */
export const LEVEL_COLOR: Record<Level, string> = { tiny: 'var(--num-5)', easy: 'var(--num-3)', medium: 'var(--num-2)', hard: 'var(--num-1)' };
export const RULE_LABEL: Record<Rule, string> = { same: '같은 그림', word: '그림과 글자' };
export const RULE_ICON: Record<Rule, string> = { same: '🖼️', word: '🔤' };

export const setupTitle = (s: Setup) => `${theme(s.theme).name} · ${RULE_LABEL[s.rule]} · ${LEVEL_LABEL[s.level]}`;
