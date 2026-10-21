import { beforeEach, describe, expect, it } from 'vitest';
import { remainingOf, useSudoku } from './store';

const s = () => useSudoku.getState();
const firstEmpty = () => s().game!.values.findIndex((v) => v === 0);

describe('sudoku store', () => {
  beforeEach(() => {
    localStorage.clear();
    s().newGame('medium');
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

  it('숫자 먼저 → 칸: 들고 있던 숫자를 놓는다', () => {
    const i = firstEmpty();
    const n = s().game!.solution[i];
    s().pressNumber(n);
    expect(s().armed).toBe(n);
    s().selectCell(i);
    expect(s().game!.values[i]).toBe(n);
    expect(s().armed).toBe(n);
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
    expect(s().records.medium?.wins).toBe(1);
  });

  it('힌트 제한을 넘으면 동작하지 않는다', () => {
    s().hint(1);
    s().hint(1);
    expect(s().game!.hintsUsed).toBe(1);
  });
});
