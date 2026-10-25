import { beforeEach, describe, expect, it } from 'vitest';
import { canMove, DIRS, neighbor, pathToGoal } from './engine/maze';
import { useMazeEscape } from './store';

const S = () => useMazeEscape.getState();

beforeEach(() => {
  useMazeEscape.setState({ records: {}, session: null });
  S().newGame({ level: 'tiny', hero: 'rabbit' });
});

describe('한 판', () => {
  it('시작 전에는 못 움직이고, 시작하면 벽 없는 쪽으로만 간다', () => {
    const s = S().session!;
    const open = DIRS.find((d) => canMove(s.maze, s.pos, d))!;
    const closed = DIRS.find((d) => !canMove(s.maze, s.pos, d))!;
    expect(S().step(open)).toBe(false);
    S().start();
    expect(S().step(closed)).toBe(false);
    expect(S().event?.kind).toBe('bump');
    expect(S().step(open)).toBe(true);
    expect(S().session).toMatchObject({ pos: neighbor(s.maze, s.pos, open), steps: 1 });
    expect(S().session!.trail).toHaveLength(2);
  });

  it('이웃이 아닌 칸으로는 못 건너뛴다', () => {
    S().start();
    const s = S().session!;
    expect(S().stepTo(s.maze.goal)).toBe(false);
  });

  it('도착하면 기록이 남고, 길에 있던 별은 주워진다', () => {
    S().start();
    S().tick(3000);
    for (const c of pathToGoal(S().session!.maze, S().session!.pos)) S().stepTo(c);
    expect(S().session).toMatchObject({ status: 'done', rank: 1 });
    expect(S().records.tiny).toMatchObject({ plays: 1, best: 3000 });
  });

  it('별을 주우면 개수가 오른다', () => {
    S().start();
    const m = S().session!.maze;
    const star = m.stars[0];
    // 별까지 가는 길: 별에서 출발 쪽으로 거꾸로
    const back = (() => {
      const path: number[] = [];
      let i = star;
      const dist = (() => {
        const d = Array(m.w * m.h).fill(-1);
        d[m.start] = 0;
        const q = [m.start];
        while (q.length) {
          const c = q.shift()!;
          for (const x of DIRS) if (canMove(m, c, x) && d[neighbor(m, c, x)] < 0) { d[neighbor(m, c, x)] = d[c] + 1; q.push(neighbor(m, c, x)); }
        }
        return d;
      })();
      while (i !== m.start) {
        path.unshift(i);
        i = DIRS.map((x) => (canMove(m, i, x) ? neighbor(m, i, x) : -1)).find((j) => j >= 0 && dist[j] === dist[i] - 1)!;
      }
      return path;
    })();
    for (const c of back) S().stepTo(c);
    expect(S().session!.got).toContain(star);
  });

  it('힌트는 정해진 수만큼', () => {
    S().start();
    S().hint(1);
    S().hint(1);
    expect(S().session!.hints).toBe(1);
    expect(S().hintUntil).toBeGreaterThan(Date.now());
  });
});
