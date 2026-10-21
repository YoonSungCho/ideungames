import { candidatesAt } from './board';
import { createRng, shuffle, type Rng } from './rng';
import { countSolutions, solveLogically } from './solver';
import { SPEC_4X4, type BoardSpec, type Difficulty, type Grid, type Puzzle } from './types';

export function generateSolvedGrid(spec: BoardSpec, rng: Rng): Grid {
  const grid: Grid = new Array(spec.size * spec.size).fill(0);
  const fill = (i: number): boolean => {
    if (i === grid.length) return true;
    for (const n of shuffle(candidatesAt(grid, i, spec), rng)) {
      grid[i] = n;
      if (fill(i + 1)) return true;
    }
    grid[i] = 0;
    return false;
  };
  fill(0);
  return grid;
}

interface DifficultyRule {
  /** 남길 힌트(주어진 숫자) 개수 범위 */
  minGivens: number;
  maxGivens: number;
  /** 이 기법만으로 풀려야 함 */
  allowed: Array<'nakedSingle' | 'hiddenSingle'>;
  /** 확정 가능한 칸이 하나뿐인 단계가 최소 이만큼 (숨은 칸을 찾아야 하는 퍼즐) */
  minBottlenecks: number;
}

/**
 * 4x4(16칸) 기준 난이도 규칙. 유일해를 갖는 4x4의 최소 힌트 수는 4.
 * 유일해 4x4는 모두 nakedSingle만으로 풀리므로, 힌트 수와 병목 단계 수로 난이도를 나눈다.
 */
const RULES_4X4: Record<Difficulty, DifficultyRule> = {
  easy: { minGivens: 10, maxGivens: 11, allowed: ['nakedSingle'], minBottlenecks: 0 },
  medium: { minGivens: 7, maxGivens: 9, allowed: ['nakedSingle'], minBottlenecks: 0 },
  hard: { minGivens: 4, maxGivens: 6, allowed: ['nakedSingle'], minBottlenecks: 2 },
};

function rulesFor(spec: BoardSpec): Record<Difficulty, DifficultyRule> {
  if (spec.size === 4) return RULES_4X4;
  // 다른 크기는 칸 수 비율로 근사 (추후 크기별 규칙을 추가)
  const cells = spec.size * spec.size;
  const scale = (ratio: number) => Math.round(cells * ratio);
  return {
    easy: { minGivens: scale(0.5), maxGivens: scale(0.55), allowed: ['nakedSingle'], minBottlenecks: 0 },
    medium: { minGivens: scale(0.4), maxGivens: scale(0.48), allowed: ['nakedSingle', 'hiddenSingle'], minBottlenecks: 0 },
    hard: { minGivens: scale(0.3), maxGivens: scale(0.38), allowed: ['nakedSingle', 'hiddenSingle'], minBottlenecks: 3 },
  };
}

/** 유일해를 유지하면서 target 개수까지 숫자를 지운다. */
function dig(solution: Grid, spec: BoardSpec, target: number, rng: Rng): Grid {
  const puzzle = solution.slice();
  let givens = puzzle.length;
  for (const i of shuffle([...puzzle.keys()], rng)) {
    if (givens <= target) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, spec, 2) === 1) givens--;
    else puzzle[i] = keep;
  }
  return puzzle;
}

function matches(puzzle: Grid, spec: BoardSpec, rule: DifficultyRule): boolean {
  const givens = puzzle.filter((v) => v !== 0).length;
  if (givens < rule.minGivens || givens > rule.maxGivens) return false;
  const result = solveLogically(puzzle, spec, rule.allowed);
  return result.solved && result.bottlenecks >= rule.minBottlenecks;
}

export interface GenerateOptions {
  spec?: BoardSpec;
  seed?: number;
  maxAttempts?: number;
}

export function generatePuzzle(difficulty: Difficulty, options: GenerateOptions = {}): Puzzle {
  const spec = options.spec ?? SPEC_4X4;
  const rng = createRng(options.seed ?? Math.floor(Math.random() * 2 ** 32));
  const rule = rulesFor(spec)[difficulty];
  const maxAttempts = options.maxAttempts ?? 300;

  let fallback: { givens: Grid; solution: Grid } | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = generateSolvedGrid(spec, rng);
    const span = rule.maxGivens - rule.minGivens + 1;
    const target = rule.minGivens + Math.floor(rng() * span);
    const givens = dig(solution, spec, target, rng);
    if (matches(givens, spec, rule)) return { spec, difficulty, givens, solution };
    // 조건을 완전히 만족하진 못해도 유일해 + 개수 범위는 맞는 퍼즐을 대비책으로 보관
    const count = givens.filter((v) => v !== 0).length;
    if (!fallback && count >= rule.minGivens && count <= rule.maxGivens) fallback = { givens, solution };
  }
  if (fallback) return { spec, difficulty, ...fallback };
  const solution = generateSolvedGrid(spec, rng);
  return { spec, difficulty, givens: dig(solution, spec, rule.maxGivens, rng), solution };
}
