import { WORDS, FIRST_SOUND, FIRST_VOWEL, SENTENCES, wordByText } from '../data/words';
import { OPPOSITES } from '../data/opposites';
import { CONSONANTS, VOWELS, LOOKALIKE, compose, decompose, hasBatchim, consonantName, vowelSay } from './hangul';
import type { ChoiceQuestion, Question, QuestionType } from './types';

export type Rng = () => number;
export const randomRng: Rng = Math.random;

const pick = <T,>(rng: Rng, xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];
const shuffle = <T,>(rng: Rng, xs: readonly T[]) => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
let seq = 0;
const qid = () => `q${++seq}`;

/** 정답 + 오답 n-1개 (헷갈리는 짝을 먼저 섞는다) */
function withDistractors(rng: Rng, answer: string, pool: readonly string[], n: number, preferred: string[] = []) {
  const out = [answer];
  for (const x of shuffle(rng, preferred)) if (out.length < n && !out.includes(x) && pool.includes(x)) out.push(x);
  for (const x of shuffle(rng, pool)) if (out.length < n && !out.includes(x)) out.push(x);
  return shuffle(rng, out);
}

const consonantJ = CONSONANTS.map((c) => c.j);
const vowelJ = VOWELS.map((v) => v.j);
const sayMap = (xs: string[], f: (x: string) => string) => Object.fromEntries(xs.map((x) => [x, f(x)]));

function listenConsonant(rng: Rng, n: number): ChoiceQuestion {
  const c = pick(rng, CONSONANTS);
  const options = withDistractors(rng, c.j, consonantJ, n, LOOKALIKE[c.j]);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { ask: '띠봇이 부르는 자음을 찾아 줘!', say: c.name, listenOnly: true },
    options, answer: c.j, optionSay: sayMap(options, consonantName), pieces: [`c:${c.j}`],
  };
}

function firstSound(rng: Rng, n: number): ChoiceQuestion {
  const j = pick(rng, Object.keys(FIRST_SOUND));
  const w = wordByText(pick(rng, FIRST_SOUND[j]));
  const options = withDistractors(rng, j, consonantJ, n, LOOKALIKE[j]);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    // 낱말은 글로 쓰지 않고 소리로만 (소리가 안 나는 기기에서는 화면이 글자로 보여준다)
    prompt: { emoji: w.emoji, ask: '그림 이름은 어떤 자음으로 시작할까?', say: w.word },
    options, answer: j, optionSay: sayMap(options, consonantName), pieces: [`c:${j}`, `w:${w.word}`],
  };
}

function listenVowel(rng: Rng, n: number): ChoiceQuestion {
  const v = pick(rng, VOWELS);
  const options = withDistractors(rng, v.j, vowelJ, n, LOOKALIKE[v.j]);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { ask: '이 소리의 모음을 찾아 줘!', say: v.say, listenOnly: true },
    options, answer: v.j, optionSay: sayMap(options, vowelSay), pieces: [`v:${v.j}`],
  };
}

function syllableVowel(rng: Rng, n: number): ChoiceQuestion {
  // 그림 낱말의 첫 글자에서 모음 찾기
  const j = pick(rng, Object.keys(FIRST_VOWEL));
  const w = wordByText(pick(rng, FIRST_VOWEL[j]));
  const options = withDistractors(rng, j, vowelJ, n, LOOKALIKE[j]);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { emoji: w.emoji, big: w.word[0], ask: `"${w.word[0]}"에 숨은 모음은?`, say: w.word[0] },
    options, answer: j, optionSay: sayMap(options, vowelSay), pieces: [`v:${j}`, `w:${w.word}`],
  };
}

function randomSyllable(rng: Rng) {
  const cho = pick(rng, consonantJ);
  const jung = pick(rng, vowelJ);
  return { cho, jung, s: compose(cho, jung) };
}

function combine(rng: Rng, n: number): ChoiceQuestion {
  const { cho, jung, s } = randomSyllable(rng);
  // 오답: 자음만 바꾼 것, 모음만 바꾼 것
  const near = [
    ...(LOOKALIKE[cho] ?? []).map((c) => compose(c, jung)),
    ...(LOOKALIKE[jung] ?? []).map((v) => compose(cho, v)),
  ];
  const pool = Array.from({ length: 12 }, () => compose(pick(rng, consonantJ), pick(rng, vowelJ)));
  const options = withDistractors(rng, s, [...near, ...pool], n, near);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { big: `${cho} + ${jung}`, ask: '두 조각을 합치면 어떤 글자?', say: `${consonantName(cho)}, ${vowelSay(jung)}` },
    options, answer: s, optionSay: sayMap(options, (x) => x), pieces: [`c:${cho}`, `v:${jung}`],
  };
}

function build(rng: Rng, n: number): Question {
  const { cho, jung, s } = randomSyllable(rng);
  return {
    id: qid(), kind: 'build',
    prompt: { ask: '들리는 글자를 블록으로 지어 줘!', say: s, listenOnly: true },
    cho: withDistractors(rng, cho, consonantJ, n, LOOKALIKE[cho]),
    jung: withDistractors(rng, jung, vowelJ, n, LOOKALIKE[jung]),
    answer: { cho, jung }, result: s, pieces: [`c:${cho}`, `v:${jung}`],
  };
}

const batchimWords = WORDS.filter((w) => w.word.length === 1 && hasBatchim(w.word) && ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'].includes(decompose(w.word).jong));
const BATCHIM = ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'];

function batchimPick(rng: Rng, n: number): ChoiceQuestion {
  const w = pick(rng, batchimWords);
  const { cho, jung, jong } = decompose(w.word);
  const options = withDistractors(rng, jong, BATCHIM, n);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { emoji: w.emoji, big: `${compose(cho, jung)} + ?`, ask: '그림 이름이 되려면 어떤 받침이 필요할까?', say: w.word },
    options, answer: jong, optionSay: sayMap(options, consonantName), pieces: [`w:${w.word}`],
  };
}

function batchimRead(rng: Rng, n: number): ChoiceQuestion {
  const w = pick(rng, batchimWords);
  const { cho, jung, jong } = decompose(w.word);
  const near = [...BATCHIM.filter((b) => b !== jong).map((b) => compose(cho, jung, b)), compose(cho, jung)];
  const options = withDistractors(rng, w.word, near, n);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { emoji: w.emoji, ask: '그림에 맞는 글자를 골라 줘!', say: w.word },
    options, answer: w.word, optionSay: sayMap(options, (x) => x), pieces: [`w:${w.word}`],
  };
}

const multiSyllable = WORDS.filter((w) => w.word.length >= 2);

function pictureWord(rng: Rng, n: number): ChoiceQuestion {
  const w = pick(rng, multiSyllable);
  // 비슷한 낱말(같은 글자로 시작하거나 길이가 같은 것)을 오답으로
  const similar = multiSyllable.filter((x) => x.word !== w.word && (x.word[0] === w.word[0] || x.word.at(-1) === w.word.at(-1))).map((x) => x.word);
  // 길이가 같은 낱말을 오답으로 (모자라면 한 글자 차이까지)
  const sameLen = multiSyllable.filter((x) => x.word.length === w.word.length).map((x) => x.word);
  const pool = sameLen.length > n + 2 ? sameLen : multiSyllable.filter((x) => Math.abs(x.word.length - w.word.length) <= 1).map((x) => x.word);
  const options = withDistractors(rng, w.word, pool, n, similar);
  return {
    id: qid(), kind: 'choice', optionSize: 'word',
    prompt: { emoji: w.emoji, ask: '그림의 이름은 뭘까?' },
    options, answer: w.word, optionSay: sayMap(options, (x) => x), pieces: [`w:${w.word}`],
  };
}

function missingSyllable(rng: Rng, n: number): ChoiceQuestion {
  const w = pick(rng, multiSyllable);
  const i = Math.floor(rng() * w.word.length);
  const answer = w.word[i];
  const pool = [...new Set(multiSyllable.flatMap((x) => x.word.split('')))];
  const masked = w.word.slice(0, i) + '□' + w.word.slice(i + 1);
  const options = withDistractors(rng, answer, pool, n);
  return {
    id: qid(), kind: 'choice', optionSize: 'jamo',
    prompt: { emoji: w.emoji, big: masked, ask: '빈칸에 들어갈 글자는?', say: w.word },
    options, answer, optionSay: sayMap(options, (x) => x), pieces: [`w:${w.word}`],
  };
}

function sentenceBlank(rng: Rng, n: number): ChoiceQuestion {
  const s = pick(rng, SENTENCES);
  const answer = s.words[s.blank];
  const shown = s.words.map((w, i) => (i === s.blank ? '___' : w)).join(' ');
  const options = withDistractors(rng, answer, s.wrong, n);
  return {
    id: qid(), kind: 'choice', optionSize: 'word',
    prompt: { emoji: s.emoji, big: shown, ask: '그림에 맞게 빈칸을 채워 줘!' },
    options, answer, optionSay: sayMap(options, (x) => x), pieces: [],
  };
}

function sentenceOrder(rng: Rng): Question {
  const s = pick(rng, SENTENCES);
  let tiles = shuffle(rng, s.words);
  if (tiles.join() === s.words.join()) tiles = [...tiles.slice(1), tiles[0]];
  return {
    id: qid(), kind: 'order',
    prompt: { emoji: s.emoji, ask: '낱말을 순서대로 눌러 문장을 만들어 줘!', say: s.words.join(' ') },
    tiles, answer: s.words, pieces: [],
  };
}

const isNoun = (w: string) => !w.endsWith('다');

/** 크다 ↔ ? : 반대말 고르기 (오답은 다른 짝의 말 중 같은 꼴 — 낱말이면 낱말, 움직임·모양이면 그것) */
function oppositePick(rng: Rng, n: number): ChoiceQuestion {
  const o = pick(rng, OPPOSITES);
  const flip = rng() < 0.5;
  const [shown, answer, es, ea] = flip ? [o.b, o.a, o.eb, o.ea] : [o.a, o.b, o.ea, o.eb];
  const others = OPPOSITES.filter((x) => x !== o && (!o.group || x.group !== o.group)).flatMap((x) => [x.a, x.b]);
  const options = withDistractors(rng, answer, others, n, others.filter((w) => isNoun(w) === isNoun(answer)));
  return {
    id: qid(), kind: 'choice', optionSize: 'word',
    prompt: { emoji: `${es} ↔ ${ea}`, big: `${shown} ↔ ?`, ask: '반대말을 찾아 줘!', say: shown },
    options, answer, optionSay: sayMap(options, (x) => x), pieces: [`o:${o.a}`],
  };
}

/** 코끼리는 커요. 개미는 ___ : 반대말로 문장 채우기 (보기는 정답과 앞 문장의 말, 둘 중 하나) */
function oppositeSentence(rng: Rng): ChoiceQuestion {
  const o = pick(rng, OPPOSITES);
  const flip = rng() < 0.5;
  const [first, firstEmoji, second, secondEmoji, answer, other] = flip
    ? [o.sb, o.eb, o.sa, o.ea, o.ya, o.yb]
    : [o.sa, o.ea, o.sb, o.eb, o.yb, o.ya];
  const options = shuffle(rng, [answer, other]);
  return {
    id: qid(), kind: 'choice', optionSize: 'word',
    prompt: { emoji: `${firstEmoji} ↔ ${secondEmoji}`, big: `${first}.\n${second.replace(answer, '___')}.`, ask: '반대말로 빈칸을 채워 줘!', say: first },
    options, answer, optionSay: sayMap(options, (x) => x), pieces: [`o:${o.a}`],
  };
}

export function makeQuestion(type: QuestionType, rng: Rng, options = 4): Question {
  switch (type) {
    case 'listenConsonant': return listenConsonant(rng, options);
    case 'firstSound': return firstSound(rng, options);
    case 'listenVowel': return listenVowel(rng, options);
    case 'syllableVowel': return syllableVowel(rng, options);
    case 'combine': return combine(rng, options);
    case 'build': return build(rng, Math.min(options, 4));
    case 'batchimPick': return batchimPick(rng, options);
    case 'batchimRead': return batchimRead(rng, options);
    case 'pictureWord': return pictureWord(rng, options);
    case 'missingSyllable': return missingSyllable(rng, options);
    case 'sentenceBlank': return sentenceBlank(rng, Math.min(options, 3));
    case 'sentenceOrder': return sentenceOrder(rng);
    case 'oppositePick': return oppositePick(rng, options);
    case 'oppositeSentence': return oppositeSentence(rng);
  }
}

/** 같은 문제가 연달아 나오지 않게 세트 만들기 */
export function makeSet(types: QuestionType[], count: number, rng: Rng, options = 4): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    let q!: Question;
    for (let t = 0; t < 12; t++) {
      q = makeQuestion(types[i % types.length], rng, options);
      const key = JSON.stringify([q.prompt.say, q.prompt.big, q.prompt.emoji]);
      if (!seen.has(key)) {
        seen.add(key);
        break;
      }
    }
    out.push(q);
  }
  return out;
}

export const answerOf = (q: Question) => (q.kind === 'choice' ? q.answer : q.kind === 'build' ? q.result : q.answer.join(' '));
