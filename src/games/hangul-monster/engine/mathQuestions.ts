import { makeQuestion } from '../../hangul-hero/engine/questions';
import type { ChoiceQuestion, Question, QuestionType } from '../../hangul-hero/engine/types';
import { makeQuestion as rainQuestion, type Mode } from '../../number-rain/engine/questions';
import type { Rng } from './rng';

/**
 * 숫자·계산 기술의 문제. 숫자 비(세기·읽기·자릿수·계산)와 빠른 계산(나눗셈)의 문제를 보기 고르기로 바꾼다.
 */
export const MATH_KINDS = ['count', 'numWord', 'place', 'add10', 'sub10', 'addsub20', 'mul', 'div', 'two'] as const;
export type MathKind = (typeof MATH_KINDS)[number];
export const isMathKind = (t: string): t is MathKind => (MATH_KINDS as readonly string[]).includes(t);

const RAIN_MODE: Partial<Record<MathKind, Mode>> = {
  count: 'count', numWord: 'word', place: 'place', add10: 'add10', sub10: 'sub10', addsub20: 'addsub20', mul: 'mul', two: 'two',
};

let seq = 0;

/** 정답 근처의 헷갈리는 수 (음수 없이, 서로 다르게) */
export function nearNumbers(answer: number, n: number, rng: Rng, max = 999, min = 0) {
  const steps = answer >= 20 ? [1, 2, 10, 3, 11, 9] : [1, 2, 3, 4];
  const out = new Set<number>([answer]);
  const cands = steps.flatMap((s) => [answer + s, answer - s]).filter((x) => x >= min && x <= max);
  while (out.size < n && cands.length) out.add(cands.splice(Math.floor(rng() * Math.min(cands.length, 4)), 1)[0]);
  for (let x = min; out.size < n; x++) out.add(x);
  const list = [...out];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function makeMathQuestion(kind: MathKind, rng: Rng, options = 3): ChoiceQuestion {
  let answer: number;
  let prompt: ChoiceQuestion['prompt'];
  if (kind === 'div') {
    const d = 2 + Math.floor(rng() * 8);
    const k = 1 + Math.floor(rng() * 9);
    answer = k;
    prompt = { big: `${d * k} ÷ ${d} = ?`, ask: '똑같이 나누면 얼마일까?' };
  } else {
    const q = rainQuestion(RAIN_MODE[kind]!, rng);
    answer = q.answer;
    const f = q.face;
    if (f.t === 'count') prompt = { emoji: f.emoji.repeat(f.n), ask: '모두 몇 개일까?' };
    else if (f.t === 'lines') prompt = { big: f.lines.join('\n'), ask: '모두 얼마일까?' };
    else if (kind === 'numWord') prompt = { big: f.text, ask: '숫자로 쓰면 무엇일까?' };
    else prompt = { big: `${f.text} = ?`, ask: '답은 얼마일까?' };
  }
  const opts = (kind === 'count' ? nearNumbers(answer, options, rng, 9, 1) : nearNumbers(answer, options, rng)).map(String);
  return { id: `m${++seq}`, kind: 'choice', prompt, pieces: [], options: opts, answer: String(answer), optionSize: 'jamo' };
}

export type MoveQ = QuestionType | MathKind;

/** 기술 하나의 문제: 숫자·계산이면 숫자 문제, 아니면 한글 용사 문제 (보기·글자 짓기·문장 순서) */
export function makeMoveQuestion(t: MoveQ, rng: Rng, options: number): Question {
  return isMathKind(t) ? makeMathQuestion(t, rng, options) : makeQuestion(t, rng, options);
}
