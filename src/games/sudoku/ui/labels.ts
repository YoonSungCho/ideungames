import type { BoardSize, Difficulty } from '../engine';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: '쉬움', medium: '중간', hard: '어려움' };
export const DIFFICULTY_STARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const SIZES: BoardSize[] = [4, 6, 8];
export const sizeLabel = (size: number) => `${size}×${size}`;
