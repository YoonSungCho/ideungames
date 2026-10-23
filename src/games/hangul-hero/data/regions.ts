import type { QuestionType } from '../engine/types';

export type Villain = 'dwijuk' | 'bakjuk' | 'both';

export interface Stage {
  types: QuestionType[];
  /** 보기 개수 */
  options: number;
}

export interface Region {
  id: string;
  name: string;
  emoji: string;
  /** 지역 색 (되찾으면 이 색으로) */
  color: string;
  learn: string;
  villain: Villain;
  stages: [Stage, Stage, Stage];
  boss: { types: QuestionType[]; options: number };
}

/** 단계당 문제 수, 보스 체력 */
export const STAGE_QUESTIONS = 6;
export const BOSS_HP = 100;

export const REGIONS: Region[] = [
  {
    id: 'consonant', name: '자음 마을', emoji: '🌱', color: '#5fc27e', learn: 'ㄱ~ㅎ 자음', villain: 'dwijuk',
    stages: [
      { types: ['listenConsonant'], options: 3 },
      { types: ['firstSound'], options: 3 },
      { types: ['listenConsonant', 'firstSound'], options: 4 },
    ],
    boss: { types: ['listenConsonant', 'firstSound'], options: 4 },
  },
  {
    id: 'vowel', name: '모음 바다', emoji: '🌊', color: '#3fa9f5', learn: 'ㅏ~ㅣ 모음', villain: 'bakjuk',
    stages: [
      { types: ['listenVowel'], options: 3 },
      { types: ['syllableVowel'], options: 3 },
      { types: ['listenVowel', 'syllableVowel'], options: 4 },
    ],
    boss: { types: ['listenVowel', 'syllableVowel'], options: 4 },
  },
  {
    id: 'castle', name: '글자 성', emoji: '🏰', color: '#9b6bff', learn: '자음+모음 = 글자', villain: 'dwijuk',
    stages: [
      { types: ['combine'], options: 3 },
      { types: ['build'], options: 3 },
      { types: ['combine', 'build'], options: 4 },
    ],
    boss: { types: ['combine', 'build'], options: 4 },
  },
  {
    id: 'cave', name: '받침 동굴', emoji: '💎', color: '#ff7a59', learn: '받침', villain: 'bakjuk',
    stages: [
      { types: ['batchimRead'], options: 3 },
      { types: ['batchimPick'], options: 3 },
      { types: ['batchimRead', 'batchimPick'], options: 4 },
    ],
    boss: { types: ['batchimRead', 'batchimPick'], options: 4 },
  },
  {
    id: 'forest', name: '낱말 숲', emoji: '🌳', color: '#2ec4a0', learn: '낱말 읽기·무리 짓기', villain: 'dwijuk',
    stages: [
      { types: ['pictureWord'], options: 3 },
      { types: ['missingSyllable'], options: 3 },
      { types: ['categoryPick', 'oddOneOut'], options: 4 },
    ],
    boss: { types: ['pictureWord', 'categoryPick', 'missingSyllable', 'oddOneOut'], options: 4 },
  },
  {
    id: 'opposite', name: '반대말 다리', emoji: '🌉', color: '#e5679f', learn: '반대말 짝꿍', villain: 'bakjuk',
    stages: [
      { types: ['oppositePick'], options: 3 },
      { types: ['oppositeSentence'], options: 2 },
      { types: ['oppositePick', 'oppositeSentence'], options: 4 },
    ],
    boss: { types: ['oppositePick', 'oppositeSentence'], options: 4 },
  },
  {
    id: 'sky', name: '문장 하늘', emoji: '☁️', color: '#ffb703', learn: '짧은 문장', villain: 'both',
    stages: [
      { types: ['sentenceBlank'], options: 3 },
      { types: ['sentenceOrder'], options: 3 },
      { types: ['sentenceBlank', 'sentenceOrder'], options: 3 },
    ],
    boss: { types: ['sentenceBlank', 'sentenceOrder', 'pictureWord'], options: 3 },
  },
];

export const regionById = (id: string) => REGIONS.find((r) => r.id === id);
