import { hero, SIZE, type Level, type Setup } from '../store';

export const LEVEL_LABEL: Record<Level, string> = { tiny: '꼬마', easy: '쉬움', medium: '중간', hard: '어려움' };
export const LEVEL_STARS: Record<Level, number> = { tiny: 1, easy: 2, medium: 3, hard: 4 };
export const LEVEL_COLOR: Record<Level, string> = { tiny: 'var(--num-5)', easy: 'var(--num-3)', medium: 'var(--num-2)', hard: 'var(--num-1)' };
export const sizeLabel = (l: Level) => `${SIZE[l]}×${SIZE[l]}`;
export const setupTitle = (s: Setup) => `${hero(s.hero).icon} ${LEVEL_LABEL[s.level]} ${sizeLabel(s.level)}`;
