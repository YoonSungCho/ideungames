/** 세는 물건 — 모두 "개"로 세는 것만 (송이·마리처럼 단위가 바뀌면 문장이 어색해진다) */
export const ITEMS = {
  carrot: { emoji: '🥕', name: '당근' },
  acorn: { emoji: '🌰', name: '도토리' },
  apple: { emoji: '🍎', name: '사과' },
  strawberry: { emoji: '🍓', name: '딸기' },
  cheese: { emoji: '🧀', name: '치즈' },
  egg: { emoji: '🥚', name: '알' },
  candy: { emoji: '🍬', name: '사탕' },
  cookie: { emoji: '🍪', name: '쿠키' },
  mushroom: { emoji: '🍄', name: '버섯' },
  star: { emoji: '⭐', name: '별' },
  blueberry: { emoji: '🫐', name: '블루베리' },
  pear: { emoji: '🍐', name: '배' },
  honey: { emoji: '🍯', name: '꿀단지' },
  peach: { emoji: '🍑', name: '복숭아' },
  ball: { emoji: '⚽', name: '공' },
  gift: { emoji: '🎁', name: '선물' },
} as const;

export type ItemId = keyof typeof ITEMS;

/** 숲의 친구들 — 단원마다 한 명씩 잔치에 초대한다 */
export const FRIENDS = {
  tori: { emoji: '🐰', name: '토리', call: '토리' },
  squirrel: { emoji: '🐿️', name: '다람쥐 알밤이', call: '알밤이' },
  frog: { emoji: '🐸', name: '개구리 퐁당이', call: '퐁당이' },
  bee: { emoji: '🐝', name: '꿀벌 윙윙이', call: '윙윙이' },
  bear: { emoji: '🐻', name: '곰 아저씨', call: '곰 아저씨' },
  mouse: { emoji: '🐭', name: '생쥐 쪼르', call: '쪼르' },
  duck: { emoji: '🦆', name: '오리 뒤뚱이', call: '뒤뚱이' },
  raccoon: { emoji: '🦝', name: '너구리 기관사', call: '너구리 기관사' },
  owl: { emoji: '🦉', name: '부엉 박사', call: '부엉 박사' },
} as const;

export type FriendId = keyof typeof FRIENDS;
