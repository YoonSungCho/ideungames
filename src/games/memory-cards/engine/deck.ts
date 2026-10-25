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

/** same: 같은 그림 두 장 / word: 그림 한 장 + 글자 한 장 / math: 계산식 한 장 + 답 숫자 한 장 */
export type Rule = 'same' | 'word' | 'math';
export const RULES: Rule[] = ['same', 'word', 'math'];

export interface Card {
  /** 짝 번호 (같은 번호끼리 짝) */
  pair: number;
  /** 그림 (계산식이면 '12+5') */
  sym: string;
  /** 이름 (계산식이면 답 '17') */
  name: string;
  face: 'pic' | 'word' | 'expr' | 'num';
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

/** 단계별 계산식: 꼬마 10까지 더하기 → 쉬움 10까지 더하기·빼기 → 중간 20까지 → 어려움 50까지 */
const MATH: Record<Level, { max: number; minus: boolean; big?: boolean }> = {
  tiny: { max: 10, minus: false },
  easy: { max: 10, minus: true },
  medium: { max: 20, minus: true },
  hard: { max: 50, minus: true, big: true },
};

const randInt = (lo: number, hi: number, rng: Rng) => lo + Math.floor(rng() * (hi - lo + 1));

/** 답이 서로 다른 계산식 n개 ('12+5' → '17'). 답은 1 이상 */
export function mathItems(level: Level, n: number, rng: Rng): { sym: string; name: string }[] {
  const { max, minus, big } = MATH[level];
  const out: { sym: string; name: string }[] = [];
  const used = new Set<number>();
  for (let guard = 0; out.length < n && guard < 5000; guard++) {
    const sub = minus && rng() < 0.5;
    // 어려움은 두 자리 수가 꼭 하나 들어가게
    const lo = big ? 10 : 1;
    let a: number, b: number, ans: number;
    if (sub) {
      a = randInt(Math.max(lo, 2), max, rng);
      b = randInt(1, a - 1, rng);
      ans = a - b;
    } else {
      a = randInt(lo, max - 1, rng);
      b = randInt(1, max - a, rng);
      ans = a + b;
      if (rng() < 0.5) [a, b] = [b, a];
    }
    if (used.has(ans)) continue;
    used.add(ans);
    out.push({ sym: `${a}${sub ? '-' : '+'}${b}`, name: String(ans) });
  }
  return out;
}

/** 계산식 읽어 주기: '12+5', '17' → '12 더하기 5, 17' */
export const sayMath = (sym: string, ans: string) => `${sym.replace('+', ' 더하기 ').replace('-', ' 빼기 ')}, ${ans}`;

export function deal(themeId: ThemeId, level: Level, rule: Rule, rng: Rng): Board {
  const picks = rule === 'math' ? mathItems(level, PAIRS[level], rng) : shuffle(theme(themeId).items, rng).slice(0, PAIRS[level]);
  const faces: Record<Rule, [Card['face'], Card['face']]> = { same: ['pic', 'pic'], word: ['pic', 'word'], math: ['expr', 'num'] };
  const cards = shuffle(
    picks.flatMap((it, pair) => faces[rule].map((face) => ({ pair, ...it, face }))),
    rng,
  );
  return { cards, matched: cards.map(() => false), open: [], moves: 0, misses: 0, combo: 0, maxCombo: 0, found: 0 };
}

export const pairCount = (b: Board) => b.cards.length / 2;
/** 틀린 두 장이 열려 있는가 (곧 닫힘) */
export const missOpen = (b: Board) => b.open.length === 2;

/** 카드 한 장 뒤집기. 틀린 두 장이 열려 있을 때 카드를 누르면 그 둘은 바로 닫힌다 */
export function flip(b: Board, i: number): { board: Board; result: FlipResult } {
  if (i < 0 || i >= b.cards.length || b.matched[i]) return { board: b, result: 'none' };
  // 틀린 두 장이 열려 있으면 (그중 한 장을 눌러도) 둘을 닫고 누른 카드만 연다
  if (b.open.length !== 1) return { board: { ...b, open: [i] }, result: 'open' };
  if (b.open[0] === i) return { board: b, result: 'none' };
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
