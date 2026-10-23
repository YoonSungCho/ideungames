/** 문제를 낼 때 보여주는 것 (그림·글자·문장, 소리) */
export interface Prompt {
  /** 큰 그림 (이모지) */
  emoji?: string;
  /** 큰 글자/낱말 (예: "ㄱ", "나", "사□") */
  big?: string;
  /** 위에 작게 쓰는 안내 (예: "어떤 소리로 시작할까?") */
  ask: string;
  /** 🔊 버튼·자동 재생으로 읽어 줄 말 */
  say?: string;
  /** 큰 글자 대신 소리만 듣고 맞히는 문제 */
  listenOnly?: boolean;
}

/** 맞히면 도감에 모이는 조각: c:ㄱ (자음), v:ㅏ (모음), w:사과 (낱말), o:크다 (반대말 짝꿍, 앞쪽 낱말로) */
export type Piece = `c:${string}` | `v:${string}` | `w:${string}` | `o:${string}`;

interface Base {
  id: string;
  prompt: Prompt;
  pieces: Piece[];
}

/** 보기 중 하나 고르기 */
export interface ChoiceQuestion extends Base {
  kind: 'choice';
  options: string[];
  answer: string;
  /** 보기를 누를 때 읽어 줄 말 (자모는 이름으로) */
  optionSay?: Record<string, string>;
  /** 보기 글자 크기: 자모·글자는 크게, 낱말·어절은 작게 */
  optionSize: 'jamo' | 'word';
}

/** 자음 + 모음 블록을 골라 글자 짓기 */
export interface BuildQuestion extends Base {
  kind: 'build';
  cho: string[];
  jung: string[];
  answer: { cho: string; jung: string };
  result: string;
}

/** 어절 순서 맞추기 */
export interface OrderQuestion extends Base {
  kind: 'order';
  tiles: string[];
  answer: string[];
}

export type Question = ChoiceQuestion | BuildQuestion | OrderQuestion;

export type QuestionType =
  | 'listenConsonant' // 기역 소리 → ㄱ 고르기
  | 'firstSound' // 🐻 곰 → 첫소리 ㄱ
  | 'listenVowel' // 아 소리 → ㅏ
  | 'syllableVowel' // "도" → 모음 ㅗ
  | 'combine' // ㄴ + ㅏ = ? → 나
  | 'build' // "나" 듣고 ㄴ, ㅏ 블록 고르기
  | 'batchimPick' // 🌙 다 + ? → ㄹ
  | 'batchimRead' // 🐻 → 곰/공/곱/고
  | 'pictureWord' // 🍎 → 사과/사자/수박
  | 'missingSyllable' // 🍎 사□ → 과
  | 'sentenceBlank' // 🐰🥕 토끼가 ___ 먹어요
  | 'sentenceOrder' // 어절 순서 맞추기
  | 'oppositePick' // 크다 ↔ ? → 작다
  | 'oppositeSentence' // 코끼리는 커요. 개미는 ___ → 작아요 / 커요
  | 'categoryPick' // 🍎 과일 → 자두 / 버스 / 연필 / 의자
  | 'oddOneOut'; // 사과 · 포도 · 딸기 · 기차 → 기차
