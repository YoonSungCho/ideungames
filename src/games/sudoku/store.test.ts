import { beforeEach, describe, expect, it } from 'vitest';
import { remainingOf, useSudoku } from './store';

const s = () => useSudoku.getState();
const firstEmpty = () => s().game!.values.findIndex((v) => v === 0);

describe('sudoku store', () => {
  beforeEach(() => {
    localStorage.clear();
    s().newGame('medium', 4);
    s().start();
  });

  it('칸 먼저 → 숫자: 정답이면 놓이고 남은 개수가 줄어든다', () => {
    const i = firstEmpty();
    const n = s().game!.solution[i];
    const before = remainingOf(s().game!, n);
    s().selectCell(i);
    s().pressNumber(n);
    expect(s().game!.values[i]).toBe(n);
    expect(remainingOf(s().game!, n)).toBe(before - 1);
    expect(s().game!.mistakes).toBe(0);
  });

  it('칸을 고르지 않고 숫자 카드를 누르면 하이라이트만 토글된다', () => {
    const i = firstEmpty();
    const n = s().game!.solution[i];
    s().pressNumber(n);
    expect(s().focus).toBe(n);
    s().selectCell(i);
    expect(s().game!.values[i]).toBe(0);
    expect(s().focus).toBe(null);
    s().pressNumber(n);
    expect(s().game!.values[i]).toBe(n);
    expect(s().focus).toBe(n);
  });

  it('숫자가 있는 칸을 누르면 그 숫자가 하이라이트된다', () => {
    const given = s().game!.givens.findIndex((v) => v !== 0);
    s().selectCell(given);
    expect(s().focus).toBe(s().game!.givens[given]);
  });

  it('오답은 실수로 기록되고, 되돌리기로 되돌릴 수 있다', () => {
    const i = firstEmpty();
    const wrong = (s().game!.solution[i] % 4) + 1;
    s().selectCell(i);
    s().pressNumber(wrong);
    expect(s().game!.values[i]).toBe(wrong);
    expect(s().game!.mistakes).toBe(1);
    s().undo();
    expect(s().game!.values[i]).toBe(0);
  });

  it('정답 칸은 잠긴다 (지울 수 없음)', () => {
    const i = firstEmpty();
    s().selectCell(i);
    s().pressNumber(s().game!.solution[i]);
    s().erase();
    expect(s().game!.values[i]).toBe(s().game!.solution[i]);
  });

  it('메모 모드는 비트를 토글하고, 정답이 놓이면 주변 메모가 지워진다', () => {
    const i = firstEmpty();
    const n = s().game!.solution[i];
    const peer = s().game!.values.findIndex((v, k) => v === 0 && k !== i && Math.floor(k / 4) === Math.floor(i / 4));
    s().toggleNoteMode();
    if (peer !== -1) {
      s().selectCell(peer);
      s().pressNumber(n);
      expect(s().game!.notes[peer] & (1 << n)).toBeTruthy();
    }
    s().toggleNoteMode();
    s().selectCell(i);
    s().pressNumber(n);
    if (peer !== -1) expect(s().game!.notes[peer] & (1 << n)).toBe(0);
  });

  it('힌트와 정답으로 모두 채우면 승리하고 기록이 남는다', () => {
    while (s().game!.status === 'playing') s().hint(Infinity);
    expect(s().game!.status).toBe('won');
    expect(s().records['4-medium']?.wins).toBe(1);
    expect(s().game!.prevBestMs).toBeUndefined();
    const first = s().records['4-medium']!.bestMs!;

    s().newGame('medium');
    s().start();
    s().tick(first + 5000);
    while (s().game!.status === 'playing') s().hint(Infinity);
    expect(s().game!.prevBestMs).toBe(first);
    expect(s().records['4-medium']).toMatchObject({ wins: 2, bestMs: first });
    expect(s().records['4-medium']!.runs!.map((r) => r.ms)).toEqual([first, first + 5000]);
    expect(s().game!.rank).toBe(2);
  });

  it('힌트 제한을 넘으면 동작하지 않는다', () => {
    s().hint(1);
    s().hint(1);
    expect(s().game!.hintsUsed).toBe(1);
  });

  it.each([6, 8] as const)('%ix%i 게임: 크기를 기억하고 크기별로 기록한다', (size) => {
    s().newGame('easy', size);
    s().start();
    expect(s().size).toBe(size);
    expect(s().game!.values).toHaveLength(size * size);
    const g = s().game!;
    g.values.forEach((v, i) => {
      if (v) return;
      s().selectCell(i);
      s().pressNumber(g.solution[i]);
    });
    expect(s().game!.status).toBe('won');
    expect(s().records[`${size}-easy`]?.wins).toBe(1);
    expect(s().records['4-easy']).toBeUndefined();
    s().newGame('hard');
    expect(s().game!.spec.size).toBe(size);
  });

  it('v1 기록(난이도 키)은 4x4 기록으로 옮겨진다', async () => {
    localStorage.setItem(
      'ideun.sudoku',
      JSON.stringify({ version: 1, state: { game: null, history: [], noteMode: false, records: { easy: { wins: 3, bestMs: 5000 } } } }),
    );
    await useSudoku.persist.rehydrate();
    expect(s().records['4-easy']).toMatchObject({ wins: 3, bestMs: 5000, runs: [{ ms: 5000 }] });
    expect(s().size).toBe(4);
  });

  it('시작 전·멈춤 중에는 시간이 흐르지 않고 입력도 안 된다', () => {
    s().newGame('easy', 4);
    expect(s().game!.status).toBe('ready');
    const i = firstEmpty();
    s().tick(1000);
    s().selectCell(i);
    expect(s().game!.elapsedMs).toBe(0);
    expect(s().selected).toBeNull();
    s().start();
    s().tick(1000);
    expect(s().game!.elapsedMs).toBe(1000);
    s().pause();
    s().tick(1000);
    s().selectCell(i);
    expect(s().game!.elapsedMs).toBe(1000);
    expect(s().selected).toBeNull();
    s().start();
    s().selectCell(i);
    expect(s().selected).toBe(i);
  });
});
