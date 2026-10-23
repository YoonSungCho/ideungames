import { describe, expect, it } from 'vitest';
import { backspace, fallMs, MAX_DROPS, MAX_LIVES, newGame, spawn, step, submit, typeDigit, type Drop, type Game } from './game';
import { clashes, freshQuestion, makeQuestion, MODES, nativeWord, sinoWord, type Mode } from './questions';
import { createRng } from './rng';

const playing = (mode: Mode = 'digit', patch: Partial<Game> = {}): Game => ({ ...newGame(mode, 'normal'), status: 'playing', ...patch });
const drop = (answer: number, patch: Partial<Drop> = {}): Drop => ({
  id: answer + 1000, q: { face: { t: 'text', text: String(answer) }, answer }, kind: 'normal', x: 0.125, y: 0.5, v: 1, ...patch,
});

describe('문제 만들기', () => {
  const ranges: Record<Mode, [number, number]> = {
    digit: [0, 9], count: [1, 9], word: [1, 99], add10: [2, 10], sub10: [1, 9],
    addsub20: [2, 20], place: [10, 99], two: [1, 99], mul: [2, 81],
  };
  for (const mode of MODES) {
    it(`${mode}: 답이 범위 안이고 식이 맞다`, () => {
      const rng = createRng(7);
      for (let i = 0; i < 500; i++) {
        const q = makeQuestion(mode, rng);
        expect(q.answer).toBeGreaterThanOrEqual(ranges[mode][0]);
        expect(q.answer).toBeLessThanOrEqual(ranges[mode][1]);
        if (q.face.t === 'text' && /[+−×]/.test(q.face.text)) {
          const expr = q.face.text.replace('−', '-').replace('×', '*');
          expect(Function(`return ${expr}`)()).toBe(q.answer);
        }
        if (q.face.t === 'count') expect(q.face.n).toBe(q.answer);
      }
    });
  }

  it('받아올림·받아내림 문제는 정말 10을 넘나든다', () => {
    const rng = createRng(3);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('addsub20', rng);
      const t = (q.face as { text: string }).text;
      const [a, b] = t.split(/ [+−] /).map(Number);
      if (t.includes('+')) expect(a % 10 + b % 10).toBeGreaterThanOrEqual(10);
      else expect(a % 10).toBeLessThan(b);
    }
  });

  it('수 읽기', () => {
    expect(sinoWord(34)).toBe('삼십사');
    expect(sinoWord(10)).toBe('십');
    expect(sinoWord(15)).toBe('십오');
    expect(sinoWord(7)).toBe('칠');
    expect(sinoWord(90)).toBe('구십');
    expect(nativeWord(8)).toBe('여덟');
  });

  it('화면의 답과 겹치거나 앞자리가 같은 답은 피한다', () => {
    expect(clashes(3, 34)).toBe(true);
    expect(clashes(34, 3)).toBe(true);
    expect(clashes(3, 43)).toBe(false);
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const q = freshQuestion('two', rng, [3, 45, 7]);
      expect([3, 45, 7].some((a) => clashes(a, q.answer))).toBe(false);
    }
  });
});

describe('떨어지기', () => {
  it('땅에 닿으면 목숨이 줄고, 다 잃으면 끝', () => {
    const rng = createRng(1);
    let g = playing('digit', { drops: [drop(3, { y: 0.99 })], lives: 2, spawnIn: 99999 });
    let r = step(g, 1000, rng);
    expect(r.game.lives).toBe(1);
    expect(r.events.some((e) => e.type === 'land' && e.hurt)).toBe(true);
    g = { ...r.game, drops: [drop(4, { y: 0.99 })] };
    r = step(g, 1000, rng);
    expect(r.game.status).toBe('done');
    expect(r.events.at(-1)?.type).toBe('over');
  });

  it('선물 물방울(하트·얼음)은 놓쳐도 목숨이 줄지 않는다', () => {
    const r = step(playing('digit', { drops: [drop(3, { y: 0.99, kind: 'heart' }), drop(5, { y: 0.99, kind: 'ice' })], spawnIn: 99999 }), 1000, createRng(1));
    expect(r.game.lives).toBe(MAX_LIVES);
  });

  it('빠르기를 고르면 떨어지는 시간이 다르고, 단계가 오르면 빨라진다', () => {
    const base = { mode: 'digit' as Mode, level: 1 };
    expect(fallMs({ ...base, speed: 'slow' })).toBeGreaterThan(fallMs({ ...base, speed: 'normal' }));
    expect(fallMs({ ...base, speed: 'normal' })).toBeGreaterThan(fallMs({ ...base, speed: 'fast' }));
    expect(fallMs({ ...base, speed: 'normal', level: 5 })).toBeLessThan(fallMs({ ...base, speed: 'normal' }));
  });

  it('얼음을 맞히면 잠깐 느려진다', () => {
    const rng = createRng(1);
    const g = playing('digit', { drops: [drop(1, { y: 0.1 })], spawnIn: 99999 });
    const normal = step(g, 1000, rng).game.drops[0].y;
    const frozen = step({ ...g, freezeMs: 5000 }, 1000, rng).game.drops[0].y;
    expect(frozen - 0.1).toBeLessThan((normal - 0.1) / 2);
  });

  it('물방울은 한꺼번에 너무 많이 나오지 않고, 같은 답이 동시에 없다', () => {
    const rng = createRng(9);
    let g = playing('digit');
    for (let i = 0; i < 2000; i++) {
      g = step(g, 50, rng).game;
      if (g.status === 'done') g = { ...g, status: 'playing', lives: MAX_LIVES };
      expect(g.drops.length).toBeLessThanOrEqual(MAX_DROPS);
      const answers = g.drops.map((d) => d.q.answer);
      expect(new Set(answers).size).toBe(answers.length);
    }
  });

  it('특별 물방울(폭탄·얼음·하트)이 가끔 나온다', () => {
    const rng = createRng(5);
    let g = playing('add10', { lives: 3 });
    const kinds = new Set<string>();
    for (let i = 0; i < 300; i++) {
      g = spawn({ ...g, drops: g.drops.slice(-3) }, rng);
      kinds.add(g.drops.at(-1)!.kind);
    }
    expect([...kinds].sort()).toEqual(['bomb', 'heart', 'ice', 'normal']);
  });
});

describe('맞히기', () => {
  it('답을 누르면 가장 아래 물방울이 터지고 점수가 오른다', () => {
    const g = playing('digit', { drops: [drop(3), drop(5)] });
    const r = typeDigit(g, 5);
    expect(r.game.drops.map((d) => d.q.answer)).toEqual([3]);
    expect(r.game.score).toBe(1);
    expect(r.game.combo).toBe(1);
    expect(r.events[0]).toMatchObject({ type: 'pop', points: 1 });
  });

  it('두 자리 답은 다 누르면 터진다', () => {
    let r = typeDigit(playing('two', { drops: [drop(42)] }), 4);
    expect(r.game.input).toBe('4');
    expect(r.events).toEqual([]);
    r = typeDigit(r.game, 2);
    expect(r.game.drops).toEqual([]);
  });

  it('3과 34가 같이 있으면 3은 ✔로 낸다', () => {
    const g = playing('two', { drops: [drop(3), drop(34)] });
    const r = typeDigit(g, 3);
    expect(r.game.input).toBe('3');
    expect(submit(r.game).game.drops.map((d) => d.q.answer)).toEqual([34]);
  });

  it('없는 답을 누르면 틀림: 입력이 비고 연속이 끊긴다', () => {
    const r = typeDigit(playing('digit', { drops: [drop(3)], combo: 4 }), 7);
    expect(r.game.input).toBe('');
    expect(r.game.combo).toBe(0);
    expect(r.game.mistakes).toBe(1);
    expect(r.events).toEqual([{ type: 'wrong' }]);
  });

  it('지우기', () => {
    expect(backspace(playing('two', { input: '4' })).input).toBe('');
  });

  it('폭탄을 맞히면 화면의 물방울이 모두 터지고 그만큼 점수', () => {
    const g = playing('digit', { drops: [drop(1), drop(2), drop(3), drop(4, { kind: 'bomb' })] });
    const r = typeDigit(g, 4);
    expect(r.game.drops).toEqual([]);
    expect(r.game.score).toBe(4);
    expect(r.game.bombs).toBe(1);
    expect(r.events.filter((e) => e.type === 'burst')).toHaveLength(3);
    expect(r.events).toContainEqual({ type: 'bomb', count: 3 });
  });

  it('하트는 목숨 +1 (최대까지)', () => {
    expect(typeDigit(playing('digit', { drops: [drop(2, { kind: 'heart' })], lives: 3 }), 2).game.lives).toBe(4);
    expect(typeDigit(playing('digit', { drops: [drop(2, { kind: 'heart' })] }), 2).game.lives).toBe(MAX_LIVES);
  });

  it('10연속이면 피버 타임: 점수 2배', () => {
    const g = playing('digit', { drops: [drop(2), drop(3)], combo: 9 });
    const r = typeDigit(g, 2);
    expect(r.events).toContainEqual({ type: 'fever' });
    expect(typeDigit(r.game, 3).game.score).toBe(1 + 2);
  });

  it('10점마다 단계가 오른다', () => {
    const r = typeDigit(playing('digit', { drops: [drop(2)], score: 9 }), 2);
    expect(r.game.level).toBe(2);
    expect(r.events).toContainEqual({ type: 'level', level: 2 });
  });

  it('시작 전·끝난 판에서는 아무 일도 없다', () => {
    const g = { ...newGame('digit', 'slow'), drops: [drop(1)] };
    expect(typeDigit(g, 1).game).toBe(g);
    expect(step(g, 1000, createRng(1)).game).toBe(g);
  });
});
