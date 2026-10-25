import { describe, expect, it } from 'vitest';
import { canMove, distances, DIRS, generate, lineTo, neighbor, pathToGoal, slide, STAR_COUNT, xy } from './maze';
import { createRng } from './rng';

describe('미로 만들기', () => {
  it('모든 칸이 이어져 있고 길은 하나뿐(나무 모양), 벽은 양쪽이 맞다', () => {
    for (const [w, h] of [[5, 5], [7, 7], [10, 10], [14, 14], [9, 6]]) {
      const m = generate(w, h, createRng(w * 31 + h));
      expect(distances(m, 0).every((d) => d >= 0)).toBe(true);
      let open = 0;
      for (let i = 0; i < w * h; i++) {
        const [x, y] = xy(m, i);
        for (const d of DIRS) {
          if (!canMove(m, i, d)) continue;
          open++;
          const j = neighbor(m, i, d);
          const [nx, ny] = xy(m, j);
          expect(nx >= 0 && ny >= 0 && nx < w && ny < h && Math.abs(nx - x) + Math.abs(ny - y) === 1).toBe(true);
        }
      }
      // 통로 수 = 칸 수 - 1 (양쪽에서 세므로 ×2)
      expect(open).toBe((w * h - 1) * 2);
    }
  });

  it('도착은 출발에서 가장 먼 칸, 별은 3개가 서로 다른 곳에', () => {
    const m = generate(10, 10, createRng(7));
    const dist = distances(m, m.start);
    expect(dist[m.goal]).toBe(Math.max(...dist));
    expect(new Set(m.stars).size).toBe(STAR_COUNT);
    expect(m.stars).not.toContain(m.goal);
    expect(m.stars).not.toContain(m.start);
  });
});

describe('움직이기', () => {
  const m = generate(7, 7, createRng(3));

  it('밀기: 막힌 방향은 안 가고, 굽은 길은 따라가다 갈림길에서 멈춘다', () => {
    for (const d of DIRS) {
      const path = slide(m, m.start, d);
      if (!canMove(m, m.start, d)) {
        expect(path).toEqual([]);
        continue;
      }
      expect(path.length).toBeGreaterThan(0);
      // 이어진 한 걸음씩
      let prev = m.start;
      for (const c of path) {
        expect(distances(m, prev)[c]).toBe(1);
        prev = c;
      }
    }
  });

  it('누른 칸: 같은 줄이고 벽이 없을 때만', () => {
    const right = slide(m, m.start, 'right');
    const target = DIRS.map((d) => (canMove(m, 0, d) ? neighbor(m, 0, d) : -1)).find((x) => x >= 0)!;
    expect(lineTo(m, 0, target)).toEqual([target]);
    expect(lineTo(m, 0, 0)).toBeNull();
    // 대각선은 안 됨
    expect(lineTo(m, 0, 8)).toBeNull();
    expect(right).toBeDefined();
  });

  it('힌트 길을 따라가면 도착', () => {
    const p = pathToGoal(m, m.start);
    expect(p[p.length - 1]).toBe(m.goal);
    expect(p.length).toBe(distances(m, m.start)[m.goal]);
  });
});
