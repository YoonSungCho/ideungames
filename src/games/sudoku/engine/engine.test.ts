import { describe, expect, it } from 'vitest';
import { countSolutions, createRng, generatePuzzle, generateSolvedGrid, solveLogically, SPEC_4X4, unitsOf, type Difficulty } from '.';

const spec = SPEC_4X4;

describe('generateSolvedGrid', () => {
  it('모든 행/열/박스에 1~4가 한 번씩', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const grid = generateSolvedGrid(spec, createRng(seed));
      for (const unit of unitsOf(spec)) {
        expect(unit.map((i) => grid[i]).sort()).toEqual([1, 2, 3, 4]);
      }
    }
  });
});

describe('countSolutions', () => {
  it('빈 4x4 보드는 288개의 해를 가진다', () => {
    expect(countSolutions(new Array(16).fill(0), spec, 1000)).toBe(288);
  });
});

describe('generatePuzzle', () => {
  const ranges: Record<Difficulty, [number, number]> = { easy: [10, 11], medium: [7, 9], hard: [4, 6] };

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    it(`${difficulty}: 유일해, 힌트 개수 범위, 정답과 일치`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const p = generatePuzzle(difficulty, { seed });
        const givens = p.givens.filter((v) => v !== 0).length;
        expect(givens).toBeGreaterThanOrEqual(ranges[difficulty][0]);
        expect(givens).toBeLessThanOrEqual(ranges[difficulty][1]);
        expect(countSolutions(p.givens, spec)).toBe(1);
        p.givens.forEach((v, i) => v && expect(v).toBe(p.solution[i]));
      }
    });
  }

  it('easy는 nakedSingle만으로 풀린다', () => {
    for (let seed = 1; seed <= 40; seed++) {
      expect(solveLogically(generatePuzzle('easy', { seed }).givens, spec, ['nakedSingle']).solved).toBe(true);
    }
  });

  it('hard는 확정 칸이 하나뿐인 병목 단계가 2개 이상', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const p = generatePuzzle('hard', { seed });
      expect(solveLogically(p.givens, spec, ['nakedSingle']).bottlenecks).toBeGreaterThanOrEqual(2);
    }
  });

  it('같은 시드는 같은 퍼즐', () => {
    expect(generatePuzzle('medium', { seed: 7 })).toEqual(generatePuzzle('medium', { seed: 7 }));
  });
});
