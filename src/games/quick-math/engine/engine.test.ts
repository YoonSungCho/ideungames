import { describe, expect, it } from 'vitest';
import { createRng, generateProblem, generateSet, OPS, type Difficulty, type Op, type Problem } from '.';

const D: Difficulty[] = ['easy', 'medium', 'hard'];
const many = (op: Op, difficulty: Difficulty, dans?: number[]) => {
  const rng = createRng(42);
  return Array.from({ length: 400 }, () => generateProblem(rng, { ops: [op], difficulty, dans }));
};
const check = (p: Problem) => {
  const r = p.op === 'add' ? p.a + p.b : p.op === 'sub' ? p.a - p.b : p.op === 'mul' ? p.a * p.b : p.a / p.b;
  expect(r).toBe(p.result);
  expect(Number.isInteger(p.result)).toBe(true);
  expect(p.answer).toBe(p.blank === 'result' ? p.result : p.blank === 'a' ? p.a : p.b);
  expect(p.answer).toBeGreaterThanOrEqual(0);
  expect(p.answer).toBeLessThanOrEqual(99);
};

describe('문제 생성', () => {
  for (const op of OPS) for (const d of D) {
    it(`${op} ${d}: 식이 맞고 답은 0~99 정수`, () => many(op, d).forEach(check));
  }

  it('덧셈 쉬움: 합 10 이하 / 어려움: 받아올림 있는 두 자리', () => {
    many('add', 'easy').forEach((p) => expect(p.result).toBeLessThanOrEqual(10));
    many('add', 'hard').forEach((p) => {
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.b).toBeGreaterThanOrEqual(10);
      expect((p.a % 10) + (p.b % 10)).toBeGreaterThanOrEqual(10);
    });
  });

  it('뺄셈은 음수가 없고, 어려움은 받아내림', () => {
    for (const d of D) many('sub', d).forEach((p) => expect(p.result).toBeGreaterThanOrEqual(0));
    many('sub', 'hard').forEach((p) => expect(p.a % 10).toBeLessThan(p.b % 10));
  });

  it('곱셈·나눗셈: 고른 단만 나온다', () => {
    many('mul', 'medium', [7]).forEach((p) => expect(p.a).toBe(7));
    many('div', 'medium', [3, 6]).forEach((p) => expect([3, 6]).toContain(p.b));
    many('mul', 'easy').forEach((p) => expect([2, 3, 4, 5]).toContain(p.a));
  });

  it('빈칸 찾기는 어려움에서만', () => {
    for (const op of OPS) {
      expect(many(op, 'easy').every((p) => p.blank === 'result')).toBe(true);
      expect(many(op, 'hard').some((p) => p.blank !== 'result')).toBe(true);
    }
  });

  it('여러 연산을 고르면 섞여 나오고, 세트는 겹치지 않는다', () => {
    const set = generateSet(createRng(1), { ops: ['add', 'mul'], difficulty: 'medium' }, 20);
    expect(new Set(set.map((p) => p.op))).toEqual(new Set(['add', 'mul']));
    expect(new Set(set.map((p) => `${p.a}${p.op}${p.b}${p.blank}`)).size).toBe(20);
  });
});
