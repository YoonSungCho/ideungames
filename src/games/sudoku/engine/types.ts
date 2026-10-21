/** 0 = 빈 칸. 셀 인덱스는 row * size + col. */
export type Grid = number[];

export interface BoardSpec {
  size: number; // 한 변의 칸 수 (4, 6, 9 ...)
  boxRows: number; // 박스 높이
  boxCols: number; // 박스 너비
}

export const SPEC_4X4: BoardSpec = { size: 4, boxRows: 2, boxCols: 2 };

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  spec: BoardSpec;
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
}
