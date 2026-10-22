import { OP_LABEL, OP_SYMBOL, type Difficulty, type Op } from '../engine';
import type { GameMode, Setup } from '../store';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: '쉬움', medium: '중간', hard: '어려움' };
export const DIFFICULTY_STARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easy: '한 자리 · 10까지 · 구구단 2~5단',
  medium: '받아올림 · 십몇 · 구구단 전체',
  hard: '두 자리끼리 · □ 빈칸 찾기',
};

export const MODE_LABEL: Record<GameMode, string> = { sprint: '20문제', blitz: '60초' };
export const MODE_DESC: Record<GameMode, string> = { sprint: '20문제를 얼마나 빨리 풀까?', blitz: '60초 동안 몇 개나 맞힐까?' };

export const opsSymbols = (ops: Op[]) => (['add', 'sub', 'mul', 'div'] as Op[]).filter((o) => ops.includes(o)).map((o) => OP_SYMBOL[o]).join(' ');
export const opsLabel = (ops: Op[]) => (['add', 'sub', 'mul', 'div'] as Op[]).filter((o) => ops.includes(o)).map((o) => OP_LABEL[o]).join('·');
export const dansLabel = (dans: number[]) => (dans.length ? `${[...dans].sort().join('·')}단` : '');
export const setupTitle = (s: Setup) => [MODE_LABEL[s.mode], opsLabel(s.ops), dansLabel(s.dans), DIFFICULTY_LABEL[s.difficulty]].filter(Boolean).join(' · ');
