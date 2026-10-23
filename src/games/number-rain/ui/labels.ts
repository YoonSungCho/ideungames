import type { Speed } from '../engine/game';
import type { Mode } from '../engine/questions';
import type { Setup } from '../store';

export const MODE_INFO: Record<Mode, { name: string; emoji: string; example: string; ages: string }> = {
  digit: { name: '숫자 보기', emoji: '👀', example: '7 → 7', ages: '4살~' },
  count: { name: '개수 세기', emoji: '🍎', example: '🍎🍎🍎 → 3', ages: '4살~' },
  word: { name: '숫자 읽기', emoji: '📖', example: '다섯 · 삼십사', ages: '5살~' },
  add10: { name: '10까지 더하기', emoji: '➕', example: '3 + 4', ages: '5살~' },
  sub10: { name: '10까지 빼기', emoji: '➖', example: '9 − 2', ages: '5살~' },
  addsub20: { name: '20까지 넘기기', emoji: '🔟', example: '8 + 5 · 13 − 6', ages: '6살~' },
  place: { name: '자릿수', emoji: '🧱', example: '10이 3개, 1이 4개', ages: '6살~' },
  two: { name: '두 자리 계산', emoji: '💯', example: '23 + 14', ages: '7살~' },
  mul: { name: '구구단', emoji: '✖️', example: '6 × 7', ages: '8살~' },
};

export const SPEED_INFO: Record<Speed, { name: string; emoji: string; hint: string; stars: number }> = {
  slow: { name: '느리게', emoji: '🐢', hint: '천천히 내려와요', stars: 1 },
  normal: { name: '보통', emoji: '🐰', hint: '조금 더 빨리!', stars: 2 },
  fast: { name: '빠르게', emoji: '🐆', hint: '번개처럼 쏟아져요', stars: 3 },
};

export const setupTitle = (s: Setup) => `${MODE_INFO[s.mode].name} · ${SPEED_INFO[s.speed].name}`;
