import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../data/chapters';
import { CHAPTER_DONE, CHAPTER_INTRO } from '../data/story';
import { native, nativeAdj, pieces, sayExpr, sino } from './numbers';
import { explainOf, firstPhase, hintOf, promptOf, revealOf } from './prompts';
import { createRng } from './rng';
import { answerOf, makeTask, optionsFor, scatter, stepPath, viewFor } from './tasks';
import type { Task } from './types';

describe('수 말', () => {
  it('고유어와 한자어', () => {
    expect([1, 2, 3, 4, 5, 10, 11, 14, 20].map(native)).toEqual(['하나', '둘', '셋', '넷', '다섯', '열', '열하나', '열넷', '스물']);
    expect([1, 2, 3, 4, 11, 12, 13, 14, 20].map(nativeAdj)).toEqual(['한', '두', '세', '네', '열한', '열두', '열세', '열네', '스무']);
    expect(pieces(3)).toBe('세 개');
    expect([0, 3, 10, 13, 20].map(sino)).toEqual(['영', '삼', '십', '십삼', '이십']);
    expect(sayExpr(3, '+', 2)).toBe('삼 더하기 이');
    expect(sayExpr(12, '-', 5)).toBe('십이 빼기 오');
  });
});

describe('문제 만들기', () => {
  const all = CHAPTERS.flatMap((c) => c.lessons.flatMap((l) => l.specs.map((spec) => ({ c, spec }))));

  it('모든 단계의 문제가 범위 안에서 만들어지고, 보기에 정답이 있다', () => {
    const rng = createRng(7);
    for (const { c, spec } of all) {
      for (let k = 0; k < 60; k++) {
        const level = k / 59;
        const t = makeTask(spec, rng, level, { items: c.items, friend: c.friend });
        const a = answerOf(t);
        expect(Number.isInteger(a)).toBe(true);
        if ('options' in t) {
          expect(t.options).toContain(a);
          expect(new Set(t.options).size).toBe(t.options.length);
          expect(t.options.length).toBe(3);
          expect(Math.min(...t.options)).toBeGreaterThanOrEqual(0);
        }
        if ('view' in t) {
          expect(t.view.hi - t.view.lo).toBe(10);
          const ends = t.kind === 'hop' || t.kind === 'land' ? [t.from, a] : [t.a, t.op === '+' ? t.a + t.b : t.a - t.b];
          for (const e of ends) {
            expect(e).toBeGreaterThanOrEqual(t.view.lo);
            expect(e).toBeLessThanOrEqual(t.view.hi);
          }
        }
        if (t.kind === 'story' || t.kind === 'calc') {
          expect(t.a).toBeGreaterThanOrEqual(1);
          expect(t.b).toBeGreaterThanOrEqual(1);
          if (t.op === '-') expect(t.a - t.b).toBeGreaterThanOrEqual(1);
        }
        if (t.kind === 'count' && t.layout === 'scatter') expect(t.spots).toHaveLength(t.n);
        if (t.kind === 'count' && t.layout === 'dice') expect(t.n).toBeLessThanOrEqual(6);
        if (t.kind === 'make') expect(t.field).toBeGreaterThan(t.n);
        if (t.kind === 'compare') expect(t.a).not.toBe(t.b);
        if (t.kind === 'ten') expect(t.a).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('잘할수록(level↑) 큰 수, 헤맬수록 작은 수', () => {
    const spec = CHAPTERS[0].lessons[1].specs[0];
    const avg = (level: number) => {
      const rng = createRng(1);
      let sum = 0;
      for (let k = 0; k < 200; k++) sum += answerOf(makeTask(spec, rng, level, { items: ['carrot'], friend: 'tori' }));
      return sum / 200;
    };
    expect(avg(1)).toBeGreaterThan(avg(0) + 1);
  });

  it('흩어 놓은 물건은 서로 겹치지 않는다', () => {
    const rng = createRng(3);
    for (let n = 1; n <= 14; n++) {
      const spots = scatter(rng, n);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) expect(Math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1])).toBeGreaterThan(0.08);
    }
  });

  it('보기는 정답 바로 옆 수를 꼭 하나 넣는다', () => {
    const rng = createRng(5);
    for (let k = 0; k < 50; k++) {
      const o = optionsFor(rng, 5, 0, 10);
      expect(o.some((v) => Math.abs(v - 5) === 1)).toBe(true);
    }
  });

  it('수 길 구간: 10까지는 0~10, 20까지는 두 수가 다 보이게', () => {
    expect(viewFor(3, 5)).toEqual({ lo: 0, hi: 10 });
    expect(viewFor(8, 13, 20)).toEqual({ lo: 7, hi: 17 });
    expect(viewFor(18, 12, 20)).toEqual({ lo: 10, hi: 20 });
  });

  it('지나온 길: 되돌아가면 지우고, 뛴 횟수 = 길이 - 1', () => {
    let p = [3];
    p = stepPath(p, 4);
    p = stepPath(p, 5);
    expect(p).toEqual([3, 4, 5]);
    p = stepPath(p, 4);
    expect(p).toEqual([3, 4]);
  });
});

describe('문제 말', () => {
  const sample: Task[] = [
    { id: 'a', kind: 'count', item: 'carrot', n: 3, layout: 'row', tap: true, spots: [], options: [2, 3, 4] },
    { id: 'b', kind: 'make', item: 'apple', n: 4, field: 6, spots: [] },
    { id: 'c', kind: 'compare', item: 'acorn', a: 3, b: 5, ask: 'more', who: ['bee', 'frog'], spread: null },
    { id: 'd', kind: 'hop', from: 3, k: 2, dir: 1, view: { lo: 0, hi: 10 } },
    { id: 'e', kind: 'land', from: 3, k: 2, dir: -1, view: { lo: 0, hi: 10 } },
    { id: 'f', kind: 'story', op: '+', a: 3, b: 2, item: 'carrot', who: 'bear', view: { lo: 0, hi: 10 }, options: [4, 5, 6] },
    { id: 'g', kind: 'story', op: '-', a: 5, b: 2, item: 'cheese', who: 'mouse', view: { lo: 0, hi: 10 }, options: [2, 3, 4] },
    { id: 'h', kind: 'calc', op: '+', a: 3, b: 3, missing: false, view: { lo: 0, hi: 10 }, options: [5, 6, 7] },
    { id: 'i', kind: 'calc', op: '+', a: 3, b: 2, missing: true, view: { lo: 0, hi: 10 }, options: [1, 2, 3] },
    { id: 'j', kind: 'ten', a: 4, options: [5, 6, 7] },
    { id: 'k', kind: 'calc', op: '-', a: 7, b: 3, missing: false, words: { item: 'apple', who: 'squirrel' }, view: { lo: 0, hi: 10 }, options: [3, 4, 5] },
  ];

  it('읽어 줄 말에는 숫자를 쓰지 않는다 (기기 음성이 "3개"를 "삼 개"로 읽지 않게)', () => {
    for (const t of sample) {
      const lines = [promptOf(t, firstPhase(t)), promptOf(t, 'answer'), hintOf(t, { count: 2 }), revealOf(t), explainOf(t)].filter(Boolean);
      for (const l of lines) expect(l!.say, l!.say).not.toMatch(/[0-9]/);
    }
  });

  it('조사가 받침에 맞는다', () => {
    expect(promptOf(sample[0], 'act').text).toBe('당근을 하나씩 눌러서 세어 봐!');
    expect(promptOf(sample[2], 'answer').text).toBe('누가 도토리를 더 많이 가졌을까?');
    expect(promptOf(sample[5], 'act').say).toContain('곰 아저씨가 두 개를 더 줬어');
    expect(promptOf(sample[6], 'act').say).toContain('쪼르에게 두 개를 나눠 줄 거야');
    expect(promptOf(sample[7], 'answer').say).toBe('삼 더하기 삼은 얼마일까?');
    expect(explainOf(sample[5])!.say).toBe('삼 더하기 이는 오. 앞으로 두 칸 뛰니까 오!');
    expect(promptOf(sample[10], 'answer').say).toContain('알밤이에게 세 개를 줬어');
    expect(promptOf(sample[3], 'act').say).toBe('토리는 삼에 있어. 앞으로 두 칸 깡충깡충 뛰어 볼까?');
  });

  it('문제 글에 정답을 적지 않는다', () => {
    for (const t of sample) {
      if (t.kind === 'story' || t.kind === 'count' || t.kind === 'make' || t.kind === 'compare') continue;
      const ans = new RegExp(`(^|\\D)${answerOf(t)}(\\D|$)`);
      expect(promptOf(t, firstPhase(t)).text, t.kind).not.toMatch(ans);
      expect(promptOf(t, 'answer').text, t.kind).not.toMatch(ans);
    }
  });
});

describe('이야기', () => {
  it('모든 단원에 소개와 마무리 이야기가 있다', () => {
    for (const c of CHAPTERS) {
      expect(CHAPTER_INTRO[c.id]?.length).toBeGreaterThan(0);
      expect(CHAPTER_DONE[c.id]?.length).toBeGreaterThan(0);
    }
  });
});
