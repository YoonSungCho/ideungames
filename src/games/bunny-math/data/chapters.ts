import type { Spec } from '../engine/types';
import type { FriendId, ItemId } from './items';

export interface Lesson {
  title: string;
  /** 지도·단계 버튼에 보일 짧은 설명 */
  desc: string;
  icon: string;
  /** 문제를 이 순서대로 돌려 가며 낸다 */
  specs: Spec[];
}

export interface Chapter {
  id: string;
  name: string;
  emoji: string;
  friend: FriendId;
  color: string;
  /** 무엇을 배우는지 (어른도 보는 문구) */
  learn: string;
  items: ItemId[];
  lessons: Lesson[];
}

/** 한 단계에 문제 5개 */
export const TASKS_PER_LESSON = 5;

/**
 * 만 4세 → 6세까지 이어지는 길.
 * 세기(하나씩 짚기 → 마지막 수가 모두) → 수 길에서 한 칸씩 뛰기(몇 칸 = 몇 번 뛰기)
 * → 하나 더/하나 덜 → 받으면 앞으로, 주면 뒤로 (물건과 수 길을 같이 움직여 덧셈·뺄셈 = 수 길 위의 이동)
 * → 10 만들기 → 20까지 → 식만 보고 계산, 이야기 문제.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: 'field',
    name: '토리의 당근밭',
    emoji: '🥕',
    friend: 'tori',
    color: '#ff9f43',
    learn: '1~5 세기',
    items: ['carrot'],
    lessons: [
      { title: '하나씩 세기', desc: '당근 1~3개', icon: '👆', specs: [{ kind: 'count', n: [1, 3], layout: 'row', tap: true }] },
      { title: '흩어진 당근', desc: '당근 2~5개', icon: '🥕', specs: [{ kind: 'count', n: [2, 5], layout: ['row', 'scatter'], tap: true }] },
      { title: '바구니 담기', desc: '1~5개 담기', icon: '🧺', specs: [{ kind: 'make', n: [1, 5] }] },
      {
        title: '한눈에 보기',
        desc: '주사위처럼 보고 맞히기',
        icon: '🎲',
        specs: [
          { kind: 'count', n: [1, 5], layout: 'dice', tap: false },
          { kind: 'count', n: [2, 5], layout: 'scatter', tap: true },
        ],
      },
    ],
  },
  {
    id: 'acorn',
    name: '다람쥐 도토리 나무',
    emoji: '🌳',
    friend: 'squirrel',
    color: '#c58b4c',
    learn: '10까지 세기 · 많고 적음',
    items: ['acorn', 'mushroom', 'blueberry'],
    lessons: [
      { title: '10까지 세기', desc: '5~8개', icon: '👆', specs: [{ kind: 'count', n: [5, 8], layout: 'row', tap: true }] },
      { title: '흩어진 도토리', desc: '6~10개', icon: '🌰', specs: [{ kind: 'count', n: [6, 10], layout: 'scatter', tap: true }] },
      { title: '바구니 담기', desc: '5~10개 담기', icon: '🧺', specs: [{ kind: 'make', n: [5, 10] }] },
      {
        title: '누가 더 많아?',
        desc: '많다 · 적다',
        icon: '⚖️',
        specs: [
          { kind: 'compare', n: [2, 8], ask: 'more', gap: 2 },
          { kind: 'compare', n: [2, 8], ask: 'fewer', gap: 2 },
          { kind: 'compare', n: [3, 9], ask: 'both', gap: 1, spread: true },
        ],
      },
    ],
  },
  {
    id: 'stream',
    name: '개구리 징검다리',
    emoji: '🪨',
    friend: 'frog',
    color: '#3fa9f5',
    learn: '수 길에서 몇 칸 뛰기',
    items: ['star'],
    lessons: [
      { title: '0에서 출발', desc: '뛴 횟수 = 도착한 수', icon: '🐸', specs: [{ kind: 'hop', from: [0, 0], k: [1, 5], dir: 1 }] },
      { title: '앞으로 깡충', desc: '어디서든 앞으로 1~3칸', icon: '➡️', specs: [{ kind: 'hop', from: [1, 6], k: [1, 3], dir: 1 }] },
      { title: '뒤로 깡충', desc: '뒤로 1~3칸', icon: '⬅️', specs: [{ kind: 'hop', from: [3, 9], k: [1, 3], dir: -1 }] },
      {
        title: '어디에 도착할까?',
        desc: '뛰기 전에 맞히기',
        icon: '🎯',
        specs: [
          { kind: 'land', from: [1, 6], k: [1, 3], dir: 1 },
          { kind: 'hop', from: [2, 7], k: [2, 3], dir: 0 },
        ],
      },
    ],
  },
  {
    id: 'flower',
    name: '꿀벌 꽃밭',
    emoji: '🌼',
    friend: 'bee',
    color: '#f5c518',
    learn: '하나 더 · 하나 덜 · 수의 크기',
    items: ['honey', 'candy', 'strawberry'],
    lessons: [
      { title: '하나 더', desc: '받으면 앞으로 한 칸', icon: '➕', specs: [{ kind: 'story', op: '+', total: [2, 6], b: [1, 1] }] },
      { title: '하나 덜', desc: '주면 뒤로 한 칸', icon: '➖', specs: [{ kind: 'story', op: '-', total: [2, 6], b: [1, 1] }] },
      { title: '어느 수가 클까?', desc: '수 길 오른쪽이 큰 수', icon: '🔢', specs: [{ kind: 'compare', n: [1, 10], numbers: true, ask: 'both', gap: 1 }] },
      {
        title: '하나 앞 · 하나 뒤',
        desc: '한 칸 뛰면 어디?',
        icon: '🎯',
        specs: [
          { kind: 'land', from: [1, 9], k: [1, 1], dir: 0 },
          { kind: 'story', op: 'mix', total: [3, 8], b: [1, 1] },
        ],
      },
    ],
  },
  {
    id: 'shop',
    name: '곰 아저씨 과일가게',
    emoji: '🍎',
    friend: 'bear',
    color: '#ef476f',
    learn: '더하기 (10까지)',
    items: ['apple', 'pear', 'peach'],
    lessons: [
      { title: '더해서 5', desc: '합이 5까지', icon: '🍎', specs: [{ kind: 'story', op: '+', total: [2, 5], b: [1, 3] }] },
      { title: '더해서 7', desc: '합이 7까지', icon: '🍐', specs: [{ kind: 'story', op: '+', total: [4, 7], b: [2, 4] }] },
      { title: '더해서 10', desc: '합이 10까지', icon: '🍑', specs: [{ kind: 'story', op: '+', total: [6, 10], b: [2, 5] }] },
      { title: '수 길로 더하기', desc: '물건 없이 뛰어서', icon: '🐰', specs: [{ kind: 'calc', op: '+', total: [3, 10], b: [1, 4] }] },
    ],
  },
  {
    id: 'cheese',
    name: '생쥐 치즈 창고',
    emoji: '🧀',
    friend: 'mouse',
    color: '#ffb703',
    learn: '빼기 (10까지)',
    items: ['cheese', 'cookie'],
    lessons: [
      { title: '나눠 주기', desc: '5에서 빼기', icon: '🧀', specs: [{ kind: 'story', op: '-', total: [3, 5], b: [1, 2] }] },
      { title: '더 나눠 주기', desc: '8에서 빼기', icon: '🍪', specs: [{ kind: 'story', op: '-', total: [5, 8], b: [2, 4] }] },
      { title: '10에서 빼기', desc: '10까지', icon: '🐭', specs: [{ kind: 'story', op: '-', total: [6, 10], b: [2, 5] }] },
      { title: '수 길로 빼기', desc: '물건 없이 뒤로 뛰어서', icon: '🐰', specs: [{ kind: 'calc', op: '-', total: [4, 10], b: [1, 4] }] },
    ],
  },
  {
    id: 'nest',
    name: '오리 알 둥지',
    emoji: '🥚',
    friend: 'duck',
    color: '#2ec4a0',
    learn: '10 만들기 · 빈칸 수',
    items: ['egg'],
    lessons: [
      { title: '알 상자 보기', desc: '10칸 상자에 몇 개?', icon: '🥚', specs: [{ kind: 'count', n: [3, 10], layout: 'frame', tap: false }] },
      { title: '10 만들기', desc: '몇 개 더 있으면 10?', icon: '🔟', specs: [{ kind: 'ten', a: [3, 9] }] },
      { title: '몇 칸 더?', desc: '3 + ? = 5', icon: '🚩', specs: [{ kind: 'calc', op: '+', total: [3, 10], b: [1, 5], missing: true }] },
      {
        title: '둥지 놀이',
        desc: '10 만들기 + 빈칸',
        icon: '🦆',
        specs: [
          { kind: 'ten', a: [1, 9] },
          { kind: 'calc', op: '+', total: [5, 10], b: [2, 6], missing: true },
        ],
      },
    ],
  },
  {
    id: 'train',
    name: '너구리 기차역',
    emoji: '🚂',
    friend: 'raccoon',
    color: '#7c5cff',
    learn: '20까지 수 · 10을 넘는 계산',
    items: ['ball', 'gift', 'candy'],
    lessons: [
      { title: '10과 몇', desc: '11~20 세기', icon: '🚃', specs: [{ kind: 'count', n: [11, 20], layout: 'frame', tap: false }] },
      { title: '긴 징검다리', desc: '20까지 앞뒤로 뛰기', icon: '🪨', specs: [{ kind: 'land', from: [8, 17], k: [2, 4], dir: 0, max: 20 }] },
      { title: '10 넘어 더하기', desc: '8 + 5 처럼', icon: '➕', specs: [{ kind: 'story', op: '+', total: [11, 15], b: [3, 6] }] },
      { title: '20까지 빼기', desc: '14 − 3 처럼', icon: '➖', specs: [{ kind: 'calc', op: '-', total: [11, 20], b: [2, 6] }] },
    ],
  },
  {
    id: 'hill',
    name: '부엉이 별빛 언덕',
    emoji: '🌙',
    friend: 'owl',
    color: '#3b4bb3',
    learn: '식으로 계산 · 이야기 문제',
    items: ['star', 'cookie', 'strawberry', 'candy'],
    lessons: [
      { title: '더하기 식', desc: '20까지', icon: '➕', specs: [{ kind: 'calc', op: '+', total: [6, 20], b: [2, 8], max: 20 }] },
      { title: '빼기 식', desc: '20까지', icon: '➖', specs: [{ kind: 'calc', op: '-', total: [6, 20], b: [2, 8], max: 20 }] },
      {
        title: '빈칸 채우기',
        desc: '? 에 들어갈 수',
        icon: '❓',
        specs: [
          { kind: 'calc', op: '+', total: [6, 20], b: [2, 8], missing: true, max: 20 },
          { kind: 'calc', op: 'mix', total: [8, 20], b: [2, 8], max: 20 },
        ],
      },
      { title: '이야기 문제', desc: '듣고 더할지 뺄지', icon: '📖', specs: [{ kind: 'calc', op: 'mix', total: [5, 20], b: [2, 8], words: true, max: 20 }] },
    ],
  },
];

export const chapterById = (id: string) => CHAPTERS.find((c) => c.id === id);
export const LESSON_COUNT = CHAPTERS.reduce((n, c) => n + c.lessons.length, 0);
