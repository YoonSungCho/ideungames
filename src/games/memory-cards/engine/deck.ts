import type { Rng } from './rng';

/** 카드 그림 묶음 (테마). 이름은 짝을 찾으면 읽어 주고, "그림과 글자" 규칙에서는 글자 카드가 된다 */
export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  /** 카드 뒷면 색 */
  color: string;
  items: { sym: string; name: string }[];
}

export type ThemeId = 'animal' | 'fruit' | 'car' | 'sea' | 'snack';

const items = (s: string) =>
  s.split(' ').map((pair) => {
    const [sym, name] = pair.split(':');
    return { sym, name };
  });

export const THEMES: Theme[] = [
  {
    id: 'animal', name: '동물', icon: '🐶', color: '#ff9f43',
    items: items('🐶:강아지 🐱:고양이 🐰:토끼 🐻:곰 🐼:판다 🦁:사자 🐯:호랑이 🐸:개구리 🐵:원숭이 🐷:돼지 🐮:소 🐔:닭 🐧:펭귄 🦊:여우 🐨:코알라'),
  },
  {
    id: 'fruit', name: '과일', icon: '🍎', color: '#ef476f',
    items: items('🍎:사과 🍌:바나나 🍇:포도 🍓:딸기 🍉:수박 🍊:귤 🍑:복숭아 🍒:체리 🍍:파인애플 🥝:키위 🍋:레몬 🍐:배 🥭:망고 🫐:블루베리'),
  },
  {
    id: 'car', name: '탈것', icon: '🚗', color: '#3fa9f5',
    items: items('🚗:자동차 🚌:버스 🚓:경찰차 🚑:구급차 🚒:소방차 🚲:자전거 🚀:로켓 ✈️:비행기 🚁:헬리콥터 🚂:기차 🚢:배 🛵:오토바이 🚜:트랙터 🚕:택시'),
  },
  {
    id: 'sea', name: '바다', icon: '🐠', color: '#0e9aa7',
    items: items('🐠:열대어 🐙:문어 🦀:게 🐳:고래 🐬:돌고래 🦈:상어 🐢:거북 🦑:오징어 🐚:조개 🦞:가재 🪼:해파리 🐡:복어 🦭:물개 🦐:새우'),
  },
  {
    id: 'snack', name: '간식', icon: '🍩', color: '#9b6bff',
    items: items('🍩:도넛 🍪:쿠키 🍰:케이크 🍦:아이스크림 🍭:사탕 🍫:초콜릿 🍕:피자 🍔:햄버거 🍟:감자튀김 🧁:컵케이크 🍿:팝콘 🍙:주먹밥 🌭:핫도그 🥨:프레첼'),
  },
];

export const theme = (id: ThemeId) => THEMES.find((t) => t.id === id)!;

export type Level = 'tiny' | 'easy' | 'medium' | 'hard';
export const LEVELS: Level[] = ['tiny', 'easy', 'medium', 'hard'];
/** 단계별 짝 수 */
export const PAIRS: Record<Level, number> = { tiny: 3, easy: 6, medium: 8, hard: 12 };

/** same: 같은 그림 두 장 / word: 그림 한 장 + 글자 한 장 */
export type Rule = 'same' | 'word';

export interface Card {
  /** 짝 번호 (같은 번호끼리 짝) */
  pair: number;
  sym: string;
  name: string;
  face: 'pic' | 'word';
}

export interface Board {
  cards: Card[];
  matched: boolean[];
  /** 지금 앞면인(아직 짝이 안 된) 카드. 2장이 열려 있으면 틀린 짝 → 곧 닫힌다 */
  open: number[];
  /** 두 장을 뒤집은 횟수 */
  moves: number;
  misses: number;
  combo: number;
  maxCombo: number;
  found: number;
}

export type FlipResult = 'none' | 'open' | 'match' | 'miss' | 'won';

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deal(themeId: ThemeId, level: Level, rule: Rule, rng: Rng): Board {
  const picks = shuffle(theme(themeId).items, rng).slice(0, PAIRS[level]);
  const cards = shuffle(
    picks.flatMap((it, pair) => [
      { pair, ...it, face: 'pic' as const },
      { pair, ...it, face: rule === 'word' ? ('word' as const) : ('pic' as const) },
    ]),
    rng,
  );
  return { cards, matched: cards.map(() => false), open: [], moves: 0, misses: 0, combo: 0, maxCombo: 0, found: 0 };
}

export const pairCount = (b: Board) => b.cards.length / 2;
/** 틀린 두 장이 열려 있는가 (곧 닫힘) */
export const missOpen = (b: Board) => b.open.length === 2;

/** 카드 한 장 뒤집기. 틀린 두 장이 열려 있을 때 다른 카드를 누르면 그 둘은 바로 닫힌다 */
export function flip(b: Board, i: number): { board: Board; result: FlipResult } {
  if (i < 0 || i >= b.cards.length || b.matched[i] || b.open.includes(i)) return { board: b, result: 'none' };
  if (b.open.length !== 1) return { board: { ...b, open: [i] }, result: 'open' };
  const j = b.open[0];
  const moves = b.moves + 1;
  if (b.cards[i].pair === b.cards[j].pair) {
    const matched = b.matched.map((m, k) => m || k === i || k === j);
    const combo = b.combo + 1;
    const found = b.found + 1;
    const board = { ...b, matched, open: [], moves, combo, maxCombo: Math.max(b.maxCombo, combo), found };
    return { board, result: found === pairCount(b) ? 'won' : 'match' };
  }
  return { board: { ...b, open: [j, i], moves, misses: b.misses + 1, combo: 0 }, result: 'miss' };
}

export const closeMiss = (b: Board): Board => (missOpen(b) ? { ...b, open: [] } : b);
