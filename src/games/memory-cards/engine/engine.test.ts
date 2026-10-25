import { describe, expect, it } from 'vitest';
import { closeMiss, deal, flip, LEVELS, PAIRS, THEMES, type Board } from './deck';
import { createRng } from './rng';

const partner = (b: Board, i: number) => b.cards.findIndex((c, k) => k !== i && c.pair === b.cards[i].pair);
const stranger = (b: Board, i: number) => b.cards.findIndex((c, k) => k !== i && c.pair !== b.cards[i].pair && !b.matched[k]);

describe('카드 나누기', () => {
  it('테마마다 그림·이름이 겹치지 않고, 가장 큰 판(12쌍)을 채울 만큼 있다', () => {
    for (const t of THEMES) {
      expect(t.items.length).toBeGreaterThanOrEqual(PAIRS.hard);
      expect(new Set(t.items.map((x) => x.sym)).size).toBe(t.items.length);
      expect(new Set(t.items.map((x) => x.name)).size).toBe(t.items.length);
      for (const x of t.items) expect(x.name).toMatch(/^[가-힣]+$/);
    }
  });

  it('단계별 짝 수만큼, 짝마다 정확히 두 장', () => {
    const rng = createRng(1);
    for (const level of LEVELS) {
      const b = deal('animal', level, 'same', rng);
      expect(b.cards).toHaveLength(PAIRS[level] * 2);
      for (let p = 0; p < PAIRS[level]; p++) expect(b.cards.filter((c) => c.pair === p)).toHaveLength(2);
    }
  });

  it('그림과 글자 규칙: 짝은 그림 한 장 + 글자 한 장', () => {
    const b = deal('fruit', 'medium', 'word', createRng(2));
    for (let p = 0; p < 8; p++) expect(b.cards.filter((c) => c.pair === p).map((c) => c.face).sort()).toEqual(['pic', 'word']);
  });
});

describe('뒤집기', () => {
  it('짝을 찾으면 그대로 열려 있고, 연속 기록이 오른다', () => {
    let b = deal('animal', 'easy', 'same', createRng(3));
    const j = partner(b, 0);
    ({ board: b } = flip(b, 0));
    const r = flip(b, j);
    expect(r.result).toBe('match');
    expect(r.board).toMatchObject({ found: 1, moves: 1, combo: 1, open: [] });
    expect(r.board.matched[0] && r.board.matched[j]).toBe(true);
    // 찾은 카드는 다시 눌러도 그대로
    expect(flip(r.board, 0).result).toBe('none');
  });

  it('틀리면 두 장이 잠깐 열려 있다가 닫히고, 다른 카드를 누르면 바로 닫힌다', () => {
    let b = deal('animal', 'easy', 'same', createRng(4));
    const k = stranger(b, 0);
    ({ board: b } = flip(b, 0));
    const r = flip(b, k);
    expect(r.result).toBe('miss');
    expect(r.board).toMatchObject({ open: [0, k], misses: 1, combo: 0 });
    expect(closeMiss(r.board).open).toEqual([]);
    const third = r.board.cards.findIndex((_, x) => x !== 0 && x !== k);
    expect(flip(r.board, third).board.open).toEqual([third]);
  });

  it('모든 짝을 찾으면 끝', () => {
    let b = deal('sea', 'tiny', 'word', createRng(5));
    let last = 'none';
    for (let i = 0; i < b.cards.length; i++) {
      if (b.matched[i]) continue;
      ({ board: b } = flip(b, i));
      ({ board: b, result: last } = flip(b, partner(b, i)) as { board: Board; result: string });
    }
    expect(last).toBe('won');
    expect(b).toMatchObject({ found: 3, moves: 3, maxCombo: 3 });
  });
});
