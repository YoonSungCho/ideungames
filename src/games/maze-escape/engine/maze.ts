import type { Rng } from './rng';

/** 칸마다 막힌 벽 (비트): 위 1, 오른쪽 2, 아래 4, 왼쪽 8 */
export type Dir = 'up' | 'right' | 'down' | 'left';
export const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
export const BIT: Record<Dir, number> = { up: 1, right: 2, down: 4, left: 8 };
const DX: Record<Dir, number> = { up: 0, right: 1, down: 0, left: -1 };
const DY: Record<Dir, number> = { up: -1, right: 0, down: 1, left: 0 };
const OPP: Record<Dir, Dir> = { up: 'down', right: 'left', down: 'up', left: 'right' };

export interface Maze {
  w: number;
  h: number;
  walls: number[];
  start: number;
  goal: number;
  /** 보물 별 (막다른 길 끝에 숨어 있음) */
  stars: number[];
}

export const STAR_COUNT = 3;

export const xy = (m: Pick<Maze, 'w'>, i: number) => [i % m.w, Math.floor(i / m.w)] as const;
export const idx = (m: Pick<Maze, 'w'>, x: number, y: number) => y * m.w + x;

export function canMove(m: Maze, i: number, d: Dir) {
  return (m.walls[i] & BIT[d]) === 0;
}

export function neighbor(m: Maze, i: number, d: Dir) {
  const [x, y] = xy(m, i);
  return idx(m, x + DX[d], y + DY[d]);
}

const openings = (m: Maze, i: number) => DIRS.filter((d) => canMove(m, i, d));

/** 길 하나로 이어진 완전한 미로 (재귀 되돌아가기). 출발은 왼쪽 위, 도착은 가장 먼 칸 */
export function generate(w: number, h: number, rng: Rng): Maze {
  const walls = Array<number>(w * h).fill(15);
  const seen = new Set<number>([0]);
  const stack = [0];
  const m = { w, h, walls, start: 0, goal: 0, stars: [] as number[] };
  while (stack.length) {
    const i = stack[stack.length - 1];
    const [x, y] = xy(m, i);
    const next = DIRS.filter((d) => {
      const nx = x + DX[d];
      const ny = y + DY[d];
      return nx >= 0 && ny >= 0 && nx < w && ny < h && !seen.has(idx(m, nx, ny));
    });
    if (!next.length) {
      stack.pop();
      continue;
    }
    const d = next[Math.floor(rng() * next.length)];
    const j = idx(m, x + DX[d], y + DY[d]);
    walls[i] &= ~BIT[d];
    walls[j] &= ~BIT[OPP[d]];
    seen.add(j);
    stack.push(j);
  }
  const dist = distances(m, 0);
  m.goal = dist.indexOf(Math.max(...dist));
  // 별: 출발·도착이 아닌 막다른 길 중 출발에서 먼 곳부터, 서로 떨어지게
  const ends = walls
    .map((_, i) => i)
    .filter((i) => i !== 0 && i !== m.goal && openings(m, i).length === 1)
    .sort((a, b) => dist[b] - dist[a] || rng() - 0.5);
  for (const e of ends) {
    if (m.stars.length >= STAR_COUNT) break;
    const ed = distances(m, e);
    if (m.stars.every((s) => ed[s] >= 3)) m.stars.push(e);
  }
  for (let i = 1; m.stars.length < STAR_COUNT && i < w * h; i++) {
    if (i !== m.goal && !m.stars.includes(i)) m.stars.push(i);
  }
  return m;
}

/** 한 칸에서 모든 칸까지 걸음 수 */
export function distances(m: Maze, from: number) {
  const dist = Array<number>(m.w * m.h).fill(-1);
  dist[from] = 0;
  const q = [from];
  while (q.length) {
    const i = q.shift()!;
    for (const d of openings(m, i)) {
      const j = neighbor(m, i, d);
      if (dist[j] < 0) {
        dist[j] = dist[i] + 1;
        q.push(j);
      }
    }
  }
  return dist;
}

/**
 * 밀기(스와이프): 그 방향으로 가서 굽은 길은 따라가고, 갈림길·막다른 길·별·도착에서 멈춘다.
 * 처음 방향이 막혀 있으면 빈 배열.
 */
export function slide(m: Maze, from: number, d: Dir, stopAt: number[] = []): number[] {
  if (!canMove(m, from, d)) return [];
  const path: number[] = [];
  let i = from;
  let dir = d;
  for (let guard = 0; guard < m.w * m.h; guard++) {
    i = neighbor(m, i, dir);
    path.push(i);
    if (i === m.goal || stopAt.includes(i)) break;
    const ways = openings(m, i).filter((x) => x !== OPP[dir]);
    if (ways.length !== 1) break;
    dir = ways[0];
  }
  return path;
}

/** 누른 칸까지: 같은 줄에 있고 사이에 벽이 없을 때만 그 칸까지 걷는다 (미로를 대신 풀어 주지 않게) */
export function lineTo(m: Maze, from: number, to: number): number[] | null {
  if (from === to) return null;
  const [fx, fy] = xy(m, from);
  const [tx, ty] = xy(m, to);
  if (fx !== tx && fy !== ty) return null;
  const d: Dir = fx === tx ? (ty > fy ? 'down' : 'up') : tx > fx ? 'right' : 'left';
  const path: number[] = [];
  let i = from;
  while (i !== to) {
    if (!canMove(m, i, d)) return null;
    i = neighbor(m, i, d);
    path.push(i);
  }
  return path;
}

/** 지금 칸에서 도착까지 가장 짧은 길 (힌트) */
export function pathToGoal(m: Maze, from: number): number[] {
  const dist = distances(m, m.goal);
  const path: number[] = [];
  let i = from;
  while (i !== m.goal) {
    const d = openings(m, i).find((x) => dist[neighbor(m, i, x)] === dist[i] - 1)!;
    i = neighbor(m, i, d);
    path.push(i);
  }
  return path;
}
