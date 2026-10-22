import type { Rng } from './rng';
import type { Blank, Difficulty, Op, Problem } from './types';

const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(rng: Rng, xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];

function make(op: Op, a: number, b: number, blank: Blank = 'result'): Problem {
  const result = op === 'add' ? a + b : op === 'sub' ? a - b : op === 'mul' ? a * b : a / b;
  const answer = blank === 'result' ? result : blank === 'a' ? a : b;
  return { op, a, b, result, blank, answer };
}

/** 어려움에서 30%는 빈칸 찾기(□) 문제 */
const blankFor = (rng: Rng, difficulty: Difficulty): Blank =>
  difficulty === 'hard' && rng() < 0.3 ? (rng() < 0.5 ? 'a' : 'b') : 'result';

/**
 * 덧셈
 *  쉬움: 합이 10 이하 (3 + 5)
 *  중간: 받아올림 있는 한 자리 + 한 자리 (7 + 8), 또는 받아올림 없는 두 자리 + 한 자리 (23 + 4)
 *  어려움: 받아올림 있는 두 자리 + 두 자리, 합 99 이하 (38 + 47) / 빈칸 찾기
 */
function add(rng: Rng, d: Difficulty): Problem {
  if (d === 'easy') {
    const a = int(rng, 1, 9);
    return make('add', a, int(rng, 1, 10 - a));
  }
  if (d === 'medium') {
    if (rng() < 0.5) {
      const a = int(rng, 2, 9);
      return make('add', a, int(rng, 11 - a, 9)); // 합 11~18
    }
    const tens = int(rng, 1, 8) * 10;
    const ones = int(rng, 0, 8);
    return make('add', tens + ones, int(rng, 1, 9 - ones));
  }
  // 받아올림: 일의 자리 합 ≥ 10, 전체 ≤ 99
  const aOnes = int(rng, 2, 9);
  const bOnes = int(rng, 10 - aOnes, 9);
  const aTens = int(rng, 1, 7);
  const bTens = int(rng, 1, 8 - aTens);
  return make('add', aTens * 10 + aOnes, bTens * 10 + bOnes, blankFor(rng, d));
}

/**
 * 뺄셈 (답은 0 이상)
 *  쉬움: 10 이하에서 빼기 (8 − 3)
 *  중간: 받아내림 있는 십몇 − 한 자리 (15 − 7), 또는 받아내림 없는 두 자리 − 한 자리 (47 − 5)
 *  어려움: 받아내림 있는 두 자리 − 두 자리 (52 − 27) / 빈칸 찾기
 */
function sub(rng: Rng, d: Difficulty): Problem {
  if (d === 'easy') {
    const a = int(rng, 2, 10);
    return make('sub', a, int(rng, 1, a));
  }
  if (d === 'medium') {
    if (rng() < 0.5) {
      const ones = int(rng, 1, 8);
      return make('sub', 10 + ones, int(rng, ones + 1, 9)); // 받아내림
    }
    const tens = int(rng, 2, 9) * 10;
    const ones = int(rng, 1, 9);
    return make('sub', tens + ones, int(rng, 1, ones));
  }
  const aTens = int(rng, 3, 9);
  const aOnes = int(rng, 0, 8);
  const bOnes = int(rng, aOnes + 1, 9); // 받아내림
  const bTens = int(rng, 1, aTens - 2);
  return make('sub', aTens * 10 + aOnes, bTens * 10 + bOnes, blankFor(rng, d));
}

/** 난이도별 기본 구구단 단 (사용자가 단을 고르면 그걸 쓴다) */
export const DEFAULT_DANS: Record<Difficulty, number[]> = {
  easy: [2, 3, 4, 5],
  medium: [2, 3, 4, 5, 6, 7, 8, 9],
  hard: [2, 3, 4, 5, 6, 7, 8, 9],
};

/** 곱셈: 단 × 1~9 (어려움은 빈칸 찾기 섞임). 단이 앞에 오는 구구단 형식 */
function mul(rng: Rng, d: Difficulty, dans: number[]): Problem {
  const dan = pick(rng, dans);
  const n = d === 'easy' ? int(rng, 1, 9) : int(rng, 2, 9);
  return make('mul', dan, n, blankFor(rng, d));
}

/** 나눗셈: 나누어떨어지는 구구단 범위 (56 ÷ 7 = 8) */
function div(rng: Rng, d: Difficulty, dans: number[]): Problem {
  const dan = pick(rng, dans);
  const q = d === 'easy' ? int(rng, 1, 9) : int(rng, 2, 9);
  return make('div', dan * q, dan, blankFor(rng, d));
}

export interface GenerateOptions {
  ops: Op[];
  difficulty: Difficulty;
  /** 곱셈·나눗셈에 쓸 단 (비우면 난이도 기본값) */
  dans?: number[];
}

export const problemKey = (p: Problem) => `${p.a}${p.op}${p.b}${p.blank}`;

/** 문제 하나. avoid에 있는 문제(직전 문제들)는 피한다 */
export function generateProblem(rng: Rng, { ops, difficulty, dans }: GenerateOptions, avoid: Set<string> = new Set()): Problem {
  const useDans = dans && dans.length ? dans : DEFAULT_DANS[difficulty];
  let p!: Problem;
  for (let tries = 0; tries < 20; tries++) {
    const op = pick(rng, ops);
    p = op === 'add' ? add(rng, difficulty) : op === 'sub' ? sub(rng, difficulty) : op === 'mul' ? mul(rng, difficulty, useDans) : div(rng, difficulty, useDans);
    if (!avoid.has(problemKey(p))) break;
  }
  return p;
}

/** n문제 세트 — 가능한 한 겹치지 않게 */
export function generateSet(rng: Rng, options: GenerateOptions, n: number): Problem[] {
  const seen = new Set<string>();
  const out: Problem[] = [];
  for (let i = 0; i < n; i++) {
    const p = generateProblem(rng, options, seen);
    seen.add(problemKey(p));
    out.push(p);
  }
  return out;
}
