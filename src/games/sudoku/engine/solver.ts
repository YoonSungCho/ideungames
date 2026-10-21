import { candidatesAt, unitsOf } from './board';
import type { BoardSpec, Grid } from './types';

/** 해의 개수를 limit까지 센다 (유일해 검사용). */
export function countSolutions(input: Grid, spec: BoardSpec, limit = 2): number {
  const grid = input.slice();
  let count = 0;
  const search = (): void => {
    if (count >= limit) return;
    // 후보가 가장 적은 빈 칸부터 (MRV)
    let best = -1;
    let bestCands: number[] = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== 0) continue;
      const cands = candidatesAt(grid, i, spec);
      if (cands.length === 0) return;
      if (best === -1 || cands.length < bestCands.length) {
        best = i;
        bestCands = cands;
        if (cands.length === 1) break;
      }
    }
    if (best === -1) {
      count++;
      return;
    }
    for (const n of bestCands) {
      grid[best] = n;
      search();
      grid[best] = 0;
      if (count >= limit) return;
    }
  };
  search();
  return count;
}

export type Technique = 'nakedSingle' | 'hiddenSingle';

export interface LogicalResult {
  solved: boolean;
  /** 풀이에 필요했던 가장 어려운 기법 */
  hardest: Technique | null;
  steps: number;
  /** 확정 가능한 칸이 단 하나뿐이었던 단계 수. 많을수록 찾기 어렵다. */
  bottlenecks: number;
}

/**
 * 사람이 푸는 방식으로 한 칸씩 풀어본다.
 * nakedSingle: 칸에 들어갈 수 있는 숫자가 하나뿐
 * hiddenSingle: 행/열/박스에서 그 숫자가 들어갈 칸이 하나뿐
 * 쉬운 기법을 항상 먼저 시도하므로 hardest는 "반드시 필요했던" 기법이다.
 */
export function solveLogically(input: Grid, spec: BoardSpec, allowed: Technique[] = ['nakedSingle', 'hiddenSingle']): LogicalResult {
  const grid = input.slice();
  const units = unitsOf(spec);
  let hardest: Technique | null = null;
  let steps = 0;
  let bottlenecks = 0;

  const nakedSingles = () => {
    const found: Array<[number, number]> = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== 0) continue;
      const cands = candidatesAt(grid, i, spec);
      if (cands.length === 1) found.push([i, cands[0]]);
    }
    return found;
  };

  const hiddenSingles = () => {
    const found = new Map<number, number>();
    for (const unit of units) {
      for (let n = 1; n <= spec.size; n++) {
        if (unit.some((i) => grid[i] === n)) continue;
        const spots = unit.filter((i) => grid[i] === 0 && candidatesAt(grid, i, spec).includes(n));
        if (spots.length === 1) found.set(spots[0], n);
      }
    }
    return [...found];
  };

  for (;;) {
    let moves: Array<[number, number]> = [];
    if (allowed.includes('nakedSingle')) {
      moves = nakedSingles();
      if (moves.length) hardest ??= 'nakedSingle';
    }
    if (!moves.length && allowed.includes('hiddenSingle')) {
      moves = hiddenSingles();
      if (moves.length) hardest = 'hiddenSingle';
    }
    if (!moves.length) break;
    if (moves.length === 1) bottlenecks++;
    const [i, n] = moves[0];
    grid[i] = n;
    steps++;
  }

  return { solved: grid.every((v) => v !== 0), hardest, steps, bottlenecks };
}
