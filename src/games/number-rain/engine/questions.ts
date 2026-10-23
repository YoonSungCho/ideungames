import type { Rng } from './rng';

/** 모드는 쉬운 것부터: 숫자 보기 → 세기 → 읽기 → 더하기·빼기 → 자릿수 → 두 자리 → 구구단 */
export const MODES = ['digit', 'count', 'word', 'add10', 'sub10', 'addsub20', 'place', 'two', 'mul'] as const;
export type Mode = (typeof MODES)[number];

/** 물방울에 보이는 모습 */
export type Face =
  | { t: 'text'; text: string }
  | { t: 'count'; emoji: string; n: number }
  | { t: 'lines'; lines: [string, string] };

export interface Question {
  face: Face;
  answer: number;
}

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T,>(rng: Rng, xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];
const text = (s: string, answer: number): Question => ({ face: { t: 'text', text: s }, answer });

export const COUNT_EMOJI = ['🍎', '🍓', '⭐', '🐟', '🌸', '🍩', '🎈', '🐥', '🍪', '🦋'] as const;
const NATIVE = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const SINO = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

/** 34 → "삼십사", 10 → "십", 7 → "칠" */
export function sinoWord(n: number) {
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (t ? (t === 1 ? '' : SINO[t]) + '십' : '') + SINO[o];
}

export const nativeWord = (n: number) => NATIVE[n - 1];

export const MINUS = '−';

export function makeQuestion(mode: Mode, rng: Rng): Question {
  switch (mode) {
    case 'digit': {
      const n = int(rng, 0, 9);
      return text(String(n), n);
    }
    case 'count': {
      const n = int(rng, 1, 9);
      return { face: { t: 'count', emoji: pick(rng, COUNT_EMOJI), n }, answer: n };
    }
    case 'word': {
      if (rng() < 0.5) {
        const n = int(rng, 1, 10);
        return text(nativeWord(n), n);
      }
      const n = int(rng, 1, 99);
      return text(sinoWord(n), n);
    }
    case 'add10': {
      const a = int(rng, 1, 9);
      const b = int(rng, 1, 10 - a);
      return text(`${a} + ${b}`, a + b);
    }
    case 'sub10': {
      const a = int(rng, 2, 10);
      const b = int(rng, 1, a - 1);
      return text(`${a} ${MINUS} ${b}`, a - b);
    }
    case 'addsub20': {
      // 받아올림·받아내림이 있는 20까지의 계산
      if (rng() < 0.5) {
        const a = int(rng, 2, 9);
        const b = int(rng, 11 - a, 9);
        return text(`${a} + ${b}`, a + b);
      }
      const a = int(rng, 11, 18);
      const b = int(rng, a - 9, 9);
      return text(`${a} ${MINUS} ${b}`, a - b);
    }
    case 'place': {
      const t = int(rng, 1, 9);
      if (rng() < 0.5) {
        const o = int(rng, 1, 9);
        return { face: { t: 'lines', lines: [`10이 ${t}개`, `1이 ${o}개`] }, answer: t * 10 + o };
      }
      const o = int(rng, 0, 9);
      return text(`${t * 10} + ${o}`, t * 10 + o);
    }
    case 'two': {
      if (rng() < 0.5) {
        const a = int(rng, 10, 89);
        const b = int(rng, 10, Math.min(99 - a, 60));
        if (b < 10) return makeQuestion(mode, rng);
        return text(`${a} + ${b}`, a + b);
      }
      const a = int(rng, 20, 99);
      const b = int(rng, 10, a - 1);
      return text(`${a} ${MINUS} ${b}`, a - b);
    }
    case 'mul': {
      const d = int(rng, 2, 9);
      const k = int(rng, 1, 9);
      return text(`${d} × ${k}`, d * k);
    }
  }
}

/** 화면에 같이 떨어지는 답끼리 헷갈리지 않게: 같은 답, 한쪽이 다른 쪽의 앞자리(3과 34)는 피한다 */
export const clashes = (a: number, b: number) => {
  const x = String(a);
  const y = String(b);
  return x.startsWith(y) || y.startsWith(x);
};

export function freshQuestion(mode: Mode, rng: Rng, onScreen: number[]): Question {
  let q = makeQuestion(mode, rng);
  for (let i = 0; i < 40 && onScreen.some((a) => clashes(a, q.answer)); i++) q = makeQuestion(mode, rng);
  return q;
}
