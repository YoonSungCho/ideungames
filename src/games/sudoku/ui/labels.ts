import type { BoardSize, Difficulty } from '../engine';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: '쉬움', medium: '중간', hard: '어려움' };
export const DIFFICULTY_STARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** 모드는 블록 크기로 부른다: 2×2(4×4판), 3×3(9×9판) */
export const SIZES: BoardSize[] = [4, 9];
export const modeLabel = (size: number) => {
  const b = Math.round(Math.sqrt(size));
  return `${b}×${b}`;
};
export const boardLabel = (size: number) => `${size}×${size}판`;
