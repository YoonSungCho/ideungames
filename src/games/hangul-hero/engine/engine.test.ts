import { describe, expect, it } from 'vitest';
import { FIRST_SOUND, FIRST_VOWEL, SENTENCES, WORDS } from '../data/words';
import { REGIONS } from '../data/regions';
import { compose, decompose, CONSONANTS, VOWELS } from './hangul';
import { answerOf, makeQuestion, makeSet } from './questions';
import type { QuestionType } from './types';

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('한글 조합·분해', () => {
  it('조합과 분해가 서로 맞는다', () => {
    expect(compose('ㄱ', 'ㅏ')).toBe('가');
    expect(compose('ㄷ', 'ㅏ', 'ㄹ')).toBe('달');
    expect(decompose('곰')).toEqual({ cho: 'ㄱ', jung: 'ㅗ', jong: 'ㅁ' });
    for (const c of CONSONANTS) for (const v of VOWELS) expect(decompose(compose(c.j, v.j))).toEqual({ cho: c.j, jung: v.j, jong: '' });
  });
});

describe('낱말 데이터', () => {
  it('첫소리·모음 표의 낱말은 사전에 있고 정말 그 소리로 시작한다', () => {
    const words = new Set(WORDS.map((w) => w.word));
    for (const [j, list] of Object.entries(FIRST_SOUND)) for (const w of list) {
      expect(words.has(w), w).toBe(true);
      expect(decompose(w[0]).cho, w).toBe(j);
    }
    for (const [j, list] of Object.entries(FIRST_VOWEL)) for (const w of list) {
      expect(words.has(w), w).toBe(true);
      expect(decompose(w[0]).jung, w).toBe(j);
    }
    expect(Object.keys(FIRST_SOUND)).toHaveLength(14);
    expect(Object.keys(FIRST_VOWEL)).toHaveLength(10);
  });

  it('낱말이 겹치지 않는다', () => {
    expect(new Set(WORDS.map((w) => w.word)).size).toBe(WORDS.length);
  });

  it('문장 빈칸 오답은 정답과 다르다', () => {
    for (const s of SENTENCES) expect(s.wrong).not.toContain(s.words[s.blank]);
  });
});

describe('문제 생성', () => {
  const types: QuestionType[] = [...new Set(REGIONS.flatMap((r) => [...r.stages.flatMap((s) => s.types), ...r.boss.types]))];
  for (const type of types) {
    it(`${type}: 정답이 보기에 꼭 하나 있고 보기는 겹치지 않는다`, () => {
      const rng = seeded(7);
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(type, rng, 4);
        if (q.kind === 'choice') {
          expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(3);
        } else if (q.kind === 'build') {
          expect(q.cho).toContain(q.answer.cho);
          expect(q.jung).toContain(q.answer.jung);
          expect(compose(q.answer.cho, q.answer.jung)).toBe(q.result);
        } else {
          expect([...q.tiles].sort()).toEqual([...q.answer].sort());
          expect(q.tiles.join()).not.toBe(q.answer.join());
        }
        expect(answerOf(q)).toBeTruthy();
      }
    });
  }

  it('받침 문제: 그림 낱말과 정답이 맞는다', () => {
    const rng = seeded(3);
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion('batchimPick', rng, 4);
      if (q.kind !== 'choice') throw new Error();
      const w = q.prompt.say!;
      expect(decompose(w).jong).toBe(q.answer);
    }
  });

  it('세트는 같은 문제를 반복하지 않는다', () => {
    const set = makeSet(['listenConsonant'], 6, seeded(1), 4);
    expect(new Set(set.map((q) => q.prompt.say)).size).toBe(6);
  });
});
