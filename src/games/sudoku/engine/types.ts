/** 0 = 빈 칸. 셀 인덱스는 row * size + col. */
export type Grid = number[];

export interface BoardSpec {
  size: number; // 한 변의 칸 수 (4, 6, 9 ...)
  boxRows: number; // 박스 높이
  boxCols: number; // 박스 너비
}

export const SPEC_4X4: BoardSpec = { size: 4, boxRows: 2, boxCols: 2 };
export const SPEC_9X9: BoardSpec = { size: 9, boxRows: 3, boxCols: 3 };

/** 판 크기 — 정사각 블록만 쓴다: 2×2 블록 → 4×4판, 3×3 블록 → 9×9판 */
export type BoardSize = 4 | 9;
export const SPECS: Record<BoardSize, BoardSpec> = { 4: SPEC_4X4, 9: SPEC_9X9 };

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  spec: BoardSpec;
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
}
