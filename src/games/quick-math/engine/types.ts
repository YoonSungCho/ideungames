export type Op = 'add' | 'sub' | 'mul' | 'div';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** 어느 자리를 비워 두고 묻는지 — 보통은 답(result), 어려움에선 가끔 앞/뒤 수 (7 × □ = 56) */
export type Blank = 'result' | 'a' | 'b';

export interface Problem {
  op: Op;
  a: number;
  b: number;
  result: number;
  blank: Blank;
  /** 아이가 입력해야 하는 수 */
  answer: number;
}

export const OPS: Op[] = ['add', 'sub', 'mul', 'div'];
export const OP_SYMBOL: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' };
export const OP_LABEL: Record<Op, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈', div: '나눗셈' };
/** 구구단 단 */
export const DANS = [2, 3, 4, 5, 6, 7, 8, 9] as const;
