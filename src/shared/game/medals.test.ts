import { describe, expect, it } from 'vitest';
import { medalOf, nextMedal, scoreTarget, timeTarget } from './medals';
import { addRun } from './records';

const time = [10, 20, 30, 40] as const;
const score = [30, 20, 10, 5] as const;

describe('medals', () => {
  it('시간(작을수록 좋음)', () => {
    expect(medalOf(time, 9, 'lower')).toBe('diamond');
    expect(medalOf(time, 25, 'lower')).toBe('silver');
    expect(medalOf(time, 41, 'lower')).toBeNull();
    expect(nextMedal(time, 25, 'lower')).toEqual({ medal: 'gold', limit: 20 });
    expect(nextMedal(time, 5, 'lower')).toBeNull();
    expect(timeTarget(time, 15)).toEqual({ medal: 'gold', leftMs: 5 });
    expect(timeTarget(time, 50)).toBeNull();
  });

  it('점수(클수록 좋음)', () => {
    expect(medalOf(score, 31, 'higher')).toBe('diamond');
    expect(medalOf(score, 12, 'higher')).toBe('silver');
    expect(medalOf(score, 4, 'higher')).toBeNull();
    expect(nextMedal(score, 12, 'higher')).toEqual({ medal: 'gold', limit: 20 });
    expect(scoreTarget(score, 3)).toEqual({ medal: 'bronze', need: 2 });
    expect(scoreTarget(score, 12)).toEqual({ medal: 'gold', need: 8 });
    expect(scoreTarget(score, 30)).toBeNull();
  });

  it('addRun: 좋은 순 정렬, 순위, 최고 기록', () => {
    let r = addRun(undefined, { value: 50, at: 1 }, 'lower');
    expect(r.rank).toBe(1);
    r = addRun(r.book, { value: 40, at: 2 }, 'lower');
    expect(r).toMatchObject({ rank: 1, prevBest: 50, book: { plays: 2, best: 40 } });
    const h = addRun(addRun(undefined, { value: 5, at: 1 }, 'higher').book, { value: 3, at: 2 }, 'higher');
    expect(h).toMatchObject({ rank: 2, book: { best: 5 } });
  });
});
