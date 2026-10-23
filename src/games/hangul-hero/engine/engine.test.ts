import { describe, expect, it } from 'vitest';
import { FIRST_SOUND, FIRST_VOWEL, SENTENCES, WORDS } from '../data/words';
import { REGIONS } from '../data/regions';
import { OPPOSITES } from '../data/opposites';
import { CATEGORIES, farCategories, type Category } from '../data/categories';
import { VOCAB } from '../data/vocab';
import { WORDS_BY_CATEGORY } from '../data/words';
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

  it('그림이 겹치지 않고, 자음·모음마다 첫소리 낱말이 3개 이상', () => {
    expect(new Set(WORDS.map((w) => w.emoji)).size).toBe(WORDS.length);
    for (const c of CONSONANTS) expect(FIRST_SOUND[c.j]?.length ?? 0, c.j).toBeGreaterThanOrEqual(3);
    for (const v of VOWELS) expect(FIRST_VOWEL[v.j]?.length ?? 0, v.j).toBeGreaterThanOrEqual(3);
  });

  it('사전: 모든 낱말(그림+글자)이 한 무리에만 있고, 무리마다 8개 이상', () => {
    const all = Object.values(WORDS_BY_CATEGORY).flat();
    const dup = all.filter((w, i) => all.indexOf(w) !== i);
    expect(dup).toEqual([]);
    for (const w of WORDS) expect(w.word, w.word).not.toMatch(/\s/);
    for (const [c, list] of Object.entries(WORDS_BY_CATEGORY)) expect(list.length, c).toBeGreaterThanOrEqual(8);
    expect(Object.keys(VOCAB).sort()).toEqual(Object.keys(CATEGORIES).sort());
    // 사전 규모 (줄어들면 알 수 있게)
    expect(WORDS.length).toBeGreaterThanOrEqual(300);
    expect(all.length).toBeGreaterThanOrEqual(1100);
    expect(SENTENCES.length).toBeGreaterThanOrEqual(90);
    expect(OPPOSITES.length).toBeGreaterThanOrEqual(50);
  });

  it('사전: 낱말은 한글로만 (띄어쓰기·영문 없음)', () => {
    for (const w of Object.values(WORDS_BY_CATEGORY).flat()) expect(w, w).toMatch(/^[가-힣]+$/);
  });

  it('반대말: 짝이 겹치지 않고, 문장 속에 그 말이 꼭 한 번 들어 있다', () => {
    expect(new Set(OPPOSITES.flatMap((o) => [o.a, o.b])).size).toBe(OPPOSITES.length * 2);
    for (const o of OPPOSITES) {
      expect(o.sa.split(o.ya).length - 1, o.sa).toBe(1);
      expect(o.sb.split(o.yb).length - 1, o.sb).toBe(1);
      expect(o.sb.includes(o.ya), o.sb).toBe(false);
    }
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
          expect(q.options.length).toBeGreaterThanOrEqual(type === 'oppositeSentence' ? 2 : 3);
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

  it('반대말 고르기: 정답은 보여준 말의 짝이고, 헷갈리는 같은 무리 말은 보기에 없다', () => {
    const rng = seeded(5);
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion('oppositePick', rng, 4);
      if (q.kind !== 'choice') throw new Error();
      const o = OPPOSITES.find((x) => x.a === q.prompt.say || x.b === q.prompt.say)!;
      expect(q.answer).toBe(q.prompt.say === o.a ? o.b : o.a);
      expect(q.options).not.toContain(q.prompt.say);
      const kin = OPPOSITES.filter((x) => x !== o && o.group && x.group === o.group).flatMap((x) => [x.a, x.b]);
      for (const k of kin) expect(q.options).not.toContain(k);
    }
  });

  it('반대말 문장: 빈칸이 하나 있고 보기는 정답과 그 반대말', () => {
    const rng = seeded(9);
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion('oppositeSentence', rng, 4);
      if (q.kind !== 'choice') throw new Error();
      expect(q.prompt.big!.split('___')).toHaveLength(2);
      expect(q.prompt.big).not.toContain(q.answer);
      expect(q.options).toHaveLength(2);
    }
  });

  it('무리 고르기: 정답만 그 무리이고, 오답은 헷갈릴 일 없는 먼 무리', () => {
    const rng = seeded(11);
    const catOf = (w: string) => (Object.keys(WORDS_BY_CATEGORY) as Category[]).find((c) => WORDS_BY_CATEGORY[c].includes(w))!;
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('categoryPick', rng, 4);
      if (q.kind !== 'choice') throw new Error();
      const cat = (Object.keys(CATEGORIES) as Category[]).find((c) => CATEGORIES[c].name === q.prompt.big)!;
      expect(catOf(q.answer)).toBe(cat);
      for (const o of q.options.filter((x) => x !== q.answer)) expect(farCategories(cat)).toContain(catOf(o));
    }
  });

  it('하나만 다른 것: 셋은 같은 무리, 정답 하나만 먼 무리', () => {
    const rng = seeded(13);
    const catOf = (w: string) => (Object.keys(WORDS_BY_CATEGORY) as Category[]).find((c) => WORDS_BY_CATEGORY[c].includes(w))!;
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('oddOneOut', rng, 4);
      if (q.kind !== 'choice') throw new Error();
      const rest = q.options.filter((x) => x !== q.answer);
      expect(rest).toHaveLength(3);
      const cat = catOf(rest[0]);
      for (const r of rest) expect(catOf(r)).toBe(cat);
      expect(farCategories(cat)).toContain(catOf(q.answer));
    }
  });

  it('세트는 같은 문제를 반복하지 않는다', () => {
    const set = makeSet(['listenConsonant'], 6, seeded(1), 4);
    expect(new Set(set.map((q) => q.prompt.say)).size).toBe(6);
  });
});
