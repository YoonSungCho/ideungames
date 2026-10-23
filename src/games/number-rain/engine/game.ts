import { freshQuestion, type Mode, type Question } from './questions';
import type { Rng } from './rng';

/**
 * 숫자 비 한 판의 순수 로직 (React 없음).
 * 좌표: x = 가로 0~1 (물방울 가운데), y = 0(하늘 위, 아직 안 보임) → 1(땅에 닿음, 물방울 아래 끝 기준).
 */
export type Speed = 'slow' | 'normal' | 'fast';
export const SPEEDS: Speed[] = ['slow', 'normal', 'fast'];

/** normal: 보통 물방울, bomb: 맞히면 화면의 물방울이 다 터짐, ice: 잠깐 느려짐, heart: 목숨 +1 */
export type Kind = 'normal' | 'bomb' | 'ice' | 'heart';

export interface Drop {
  id: number;
  q: Question;
  kind: Kind;
  x: number;
  y: number;
  /** 물방울마다 조금씩 다른 속도 (0.9~1.1) */
  v: number;
}

export interface Game {
  mode: Mode;
  speed: Speed;
  status: 'ready' | 'playing' | 'done';
  drops: Drop[];
  nextId: number;
  spawnIn: number;
  input: string;
  score: number;
  /** 직접 맞힌 개수 (폭탄으로 터진 건 빼고) */
  hits: number;
  level: number;
  lives: number;
  combo: number;
  maxCombo: number;
  mistakes: number;
  missed: number;
  bombs: number;
  freezeMs: number;
  feverMs: number;
  /** 마지막 특별 물방울 뒤로 나온 물방울 수 */
  sinceSpecial: number;
  elapsedMs: number;
  /** 끝났을 때: 이전 최고 기록, 이번 순위 */
  prevBest?: number;
  rank?: number;
}

export type GameEvent =
  | { type: 'pop'; x: number; y: number; points: number; kind: Kind }
  | { type: 'burst'; x: number; y: number }
  | { type: 'bomb'; count: number }
  | { type: 'ice' }
  | { type: 'heart' }
  | { type: 'fever' }
  | { type: 'feverEnd' }
  | { type: 'freezeEnd' }
  | { type: 'level'; level: number }
  | { type: 'land'; x: number; kind: Kind; hurt: boolean }
  | { type: 'wrong' }
  | { type: 'over' };

export const MAX_LIVES = 5;
export const MAX_DROPS = 7;
export const MAX_LEVEL = 12;
export const LANES = 4;
/** 이만큼 맞히면 단계가 오르고 조금 빨라진다 */
export const LEVEL_EVERY = 10;
export const FEVER_EVERY = 10;
export const FEVER_MS = 8000;
export const FREEZE_MS = 6000;
export const FREEZE_SLOW = 0.35;

/** 땅까지 떨어지는 시간 (1단계) */
const FALL_MS: Record<Speed, number> = { slow: 15000, normal: 10500, fast: 7000 };
/** 오래 생각해야 하는 모드는 조금 천천히 */
const MODE_PACE: Record<Mode, number> = {
  digit: 1, count: 1.15, word: 1.15, add10: 1.1, sub10: 1.1, addsub20: 1.25, place: 1.25, two: 1.4, mul: 1.25,
};

export function fallMs(g: Pick<Game, 'mode' | 'speed' | 'level'>) {
  return FALL_MS[g.speed] * MODE_PACE[g.mode] * Math.max(0.5, 0.92 ** (g.level - 1));
}

/** 다음 물방울까지 — 단계가 오를수록 자주 */
export function spawnGap(g: Pick<Game, 'mode' | 'speed' | 'level'>) {
  return Math.max(900, fallMs(g) / (2.2 + 0.3 * (g.level - 1)));
}

export function newGame(mode: Mode, speed: Speed): Game {
  return {
    mode, speed, status: 'ready', drops: [], nextId: 1, spawnIn: 400, input: '',
    score: 0, hits: 0, level: 1, lives: MAX_LIVES, combo: 0, maxCombo: 0, mistakes: 0, missed: 0, bombs: 0,
    freezeMs: 0, feverMs: 0, sinceSpecial: 0, elapsedMs: 0,
  };
}

function pickKind(g: Game, rng: Rng): Kind {
  // 특별 물방울은 4개 이상 지난 뒤 가끔 — 폭탄은 화면에 물방울이 많을수록 잘 나온다
  if (g.sinceSpecial < 4 || rng() > 0.3) return 'normal';
  const weights: [Kind, number][] = [
    ['bomb', g.drops.length >= 2 ? 3 + g.drops.length : 0],
    ['ice', 2],
    ['heart', g.lives < MAX_LIVES ? 2.5 : 0],
  ];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of weights) {
    if ((r -= w) < 0) return k;
  }
  return 'normal';
}

/** 위쪽이 비어 있는 줄에 떨어뜨린다 (겹쳐서 안 보이는 일 없게) */
function pickLane(g: Game, rng: Rng) {
  const top = Array.from({ length: LANES }, (_, lane) =>
    Math.min(1, ...g.drops.filter((d) => Math.round(d.x * LANES - 0.5) === lane).map((d) => d.y)),
  );
  const free = top.map((y, i) => [y, i] as const).filter(([y]) => y > 0.32).map(([, i]) => i);
  if (free.length) return free[Math.floor(rng() * free.length)];
  return top.indexOf(Math.max(...top));
}

export function spawn(g: Game, rng: Rng): Game {
  const kind = pickKind(g, rng);
  const q = freshQuestion(g.mode, rng, g.drops.map((d) => d.q.answer));
  const lane = pickLane(g, rng);
  const drop: Drop = { id: g.nextId, q, kind, x: (lane + 0.5) / LANES, y: 0, v: 0.9 + rng() * 0.2 };
  return { ...g, drops: [...g.drops, drop], nextId: g.nextId + 1, sinceSpecial: kind === 'normal' ? g.sinceSpecial + 1 : 0 };
}

/** 지금 입력이 아직 어떤 답의 앞자리라도 되는지 */
const stillPossible = (g: Game, input: string) => g.drops.some((d) => String(d.q.answer).startsWith(input));

/** 시간이 dt(ms)만큼 흐름 */
export function step(g: Game, dt: number, rng: Rng): { game: Game; events: GameEvent[] } {
  if (g.status !== 'playing') return { game: g, events: [] };
  const events: GameEvent[] = [];
  const slow = g.freezeMs > 0 ? FREEZE_SLOW : 1;
  const fall = fallMs(g);
  let next: Game = { ...g, elapsedMs: g.elapsedMs + dt };

  if (g.freezeMs > 0) {
    next.freezeMs = Math.max(0, g.freezeMs - dt);
    if (next.freezeMs === 0) events.push({ type: 'freezeEnd' });
  }
  if (g.feverMs > 0) {
    next.feverMs = Math.max(0, g.feverMs - dt);
    if (next.feverMs === 0) events.push({ type: 'feverEnd' });
  }

  const kept: Drop[] = [];
  for (const d of g.drops) {
    const y = d.y + (dt / fall) * d.v * slow;
    if (y < 1) {
      kept.push({ ...d, y });
      continue;
    }
    // 보통·폭탄 물방울이 땅에 닿으면 목숨 하나 (선물 물방울은 놓쳐도 괜찮아)
    const hurt = d.kind === 'normal' || d.kind === 'bomb';
    events.push({ type: 'land', x: d.x, kind: d.kind, hurt });
    if (hurt) {
      next.lives -= 1;
      next.missed += 1;
      next.combo = 0;
    }
  }
  next.drops = kept;

  if (next.lives <= 0) {
    next = { ...next, lives: 0, status: 'done', input: '' };
    events.push({ type: 'over' });
    return { game: next, events };
  }

  next.spawnIn -= dt * slow;
  if (next.drops.length === 0) next.spawnIn = Math.min(next.spawnIn, 500);
  if (next.spawnIn <= 0 && next.drops.length < MAX_DROPS) {
    next = spawn(next, rng);
    next.spawnIn = spawnGap(next);
  }
  // 입력하던 답의 물방울이 땅에 닿았으면 입력을 비운다
  if (next.input && !stillPossible(next, next.input)) next.input = '';
  return { game: next, events };
}

/** 물방울 하나를 맞혔을 때 */
function pop(g: Game, drop: Drop): { game: Game; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const points = g.feverMs > 0 ? 2 : 1;
  const combo = g.combo + 1;
  let next: Game = {
    ...g,
    drops: g.drops.filter((d) => d.id !== drop.id),
    input: '',
    combo,
    maxCombo: Math.max(g.maxCombo, combo),
    hits: g.hits + 1,
    score: g.score + points,
  };
  events.push({ type: 'pop', x: drop.x, y: drop.y, points, kind: drop.kind });

  if (drop.kind === 'bomb') {
    for (const d of next.drops) events.push({ type: 'burst', x: d.x, y: d.y });
    events.push({ type: 'bomb', count: next.drops.length });
    next = { ...next, score: next.score + next.drops.length * points, drops: [], bombs: next.bombs + 1, spawnIn: Math.max(next.spawnIn, 1200) };
  } else if (drop.kind === 'ice') {
    next.freezeMs = FREEZE_MS;
    events.push({ type: 'ice' });
  } else if (drop.kind === 'heart') {
    next.lives = Math.min(MAX_LIVES, next.lives + 1);
    events.push({ type: 'heart' });
  }

  if (combo % FEVER_EVERY === 0) {
    next.feverMs = FEVER_MS;
    events.push({ type: 'fever' });
  }
  const level = Math.min(MAX_LEVEL, 1 + Math.floor(next.score / LEVEL_EVERY));
  if (level > next.level) {
    next.level = level;
    events.push({ type: 'level', level });
  }
  return { game: next, events };
}

const lowest = (ds: Drop[]) => ds.reduce((a, b) => (b.y > a.y ? b : a));

/**
 * 숫자 하나 누름. 답과 같아지면 (더 긴 답이 기다리지 않는 한) 바로 터진다.
 * 어떤 답의 앞자리도 아니면 틀림 → 입력을 비운다.
 */
export function typeDigit(g: Game, digit: number): { game: Game; events: GameEvent[] } {
  if (g.status !== 'playing') return { game: g, events: [] };
  const input = g.input === '0' ? String(digit) : g.input + digit;
  const exact = g.drops.filter((d) => String(d.q.answer) === input);
  const longer = g.drops.some((d) => String(d.q.answer).length > input.length && String(d.q.answer).startsWith(input));
  if (exact.length && !longer) return pop(g, lowest(exact));
  if (exact.length || longer) return { game: { ...g, input }, events: [] };
  // "0"을 눌렀는데 0이 답인 물방울이 없을 때도 틀림
  return { game: { ...g, input: '', combo: 0, mistakes: g.mistakes + 1 }, events: [{ type: 'wrong' }] };
}

/** ✔: 짧은 답을 바로 낼 때 (예: 3과 34가 같이 있을 때 3) */
export function submit(g: Game): { game: Game; events: GameEvent[] } {
  if (g.status !== 'playing' || !g.input) return { game: g, events: [] };
  const exact = g.drops.filter((d) => String(d.q.answer) === g.input);
  if (exact.length) return pop(g, lowest(exact));
  return { game: { ...g, input: '', combo: 0, mistakes: g.mistakes + 1 }, events: [{ type: 'wrong' }] };
}

export const backspace = (g: Game): Game => ({ ...g, input: g.input.slice(0, -1) });
