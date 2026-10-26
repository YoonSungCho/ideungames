import { FRIENDS, type FriendId, type ItemId } from '../data/items';
import type { Rng } from './rng';
import type { Layout, Range, Spec, Spot, Task, View } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pickOf = <T>(rng: Rng, list: readonly T[]) => list[Math.floor(rng() * list.length)];

/**
 * 범위에서 수 하나. level(0~1)이 높을수록 큰 수 쪽으로 — 잘하면 조금씩 어려워지고, 헤매면 쉬워진다.
 */
export function pickIn(rng: Rng, [lo, hi]: Range, level: number) {
  const t = clamp(level + (rng() - 0.5) * 0.7, 0, 1);
  return clamp(Math.round(lo + t * (hi - lo)), lo, hi);
}

/** 수 길 구간: 11개 돌. 10까지면 0~10, 그보다 크면 두 수가 다 보이게 */
export function viewFor(a: number, b: number, max = 10): View {
  if (max <= 10) return { lo: 0, hi: 10 };
  const lo0 = Math.min(a, b);
  const hi0 = Math.max(a, b);
  let lo = clamp(lo0 - 1, 0, max - 10);
  if (hi0 > lo + 10) lo = hi0 - 10;
  return { lo, hi: lo + 10 };
}

/** 정답 근처 보기 3개 (작은 수부터) */
export function optionsFor(rng: Rng, answer: number, lo: number, hi: number, count = 3): number[] {
  const set = new Set([answer]);
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3, answer - 3].filter((v) => v >= lo && v <= hi);
  // 바로 옆 수 하나는 꼭 (하나 차이를 구별하는 게 목표)
  const first = near.slice(0, 2).filter((v) => v !== answer);
  if (first.length) set.add(pickOf(rng, first));
  for (const v of near.sort(() => rng() - 0.5)) {
    if (set.size >= count) break;
    set.add(v);
  }
  return [...set].sort((x, y) => x - y);
}

/** 겹치지 않게 흩어 놓기: 칸을 나눠 고르고 칸 안에서 조금씩 흔든다 */
export function scatter(rng: Rng, n: number): Spot[] {
  const cols = n <= 4 ? 3 : n <= 9 ? 4 : 5;
  const rows = Math.ceil((n + Math.max(1, Math.floor(n / 3))) / cols);
  const cells = Array.from({ length: cols * rows }, (_, i) => i).sort(() => rng() - 0.5).slice(0, n);
  return cells
    .sort((x, y) => x - y)
    .map((c) => {
      const x = ((c % cols) + 0.5 + (rng() - 0.5) * 0.45) / cols;
      const y = (Math.floor(c / cols) + 0.5 + (rng() - 0.5) * 0.4) / rows;
      return [Number(x.toFixed(3)), Number(y.toFixed(3))] as Spot;
    });
}

const FRIEND_IDS = (Object.keys(FRIENDS) as FriendId[]).filter((f) => f !== 'tori');
let serial = 0;
const nextId = (kind: string, rng: Rng) => `${kind}-${(++serial).toString(36)}${Math.floor(rng() * 1e6).toString(36)}`;

export interface MakeOpts {
  /** 이 단원에서 세는 물건들 */
  items: readonly ItemId[];
  /** 이야기에 나오는 친구 (단원 친구) */
  friend: FriendId;
}

/** 단원 설정 하나로 문제 하나 */
export function makeTask(spec: Spec, rng: Rng, level: number, opts: MakeOpts): Task {
  const item = pickOf(rng, opts.items);
  switch (spec.kind) {
    case 'count': {
      const n = pickIn(rng, spec.n, level);
      const layouts = Array.isArray(spec.layout) ? spec.layout : [spec.layout];
      // 주사위 무늬는 6까지, 10칸 상자는 10이 넘을 때 쓴다
      const fit = layouts.filter((l) => (l === 'dice' ? n <= 6 : true));
      const layout = pickOf<Layout>(rng, fit.length ? fit : ['row']);
      const hi = Math.max(spec.n[1] + 1, 5);
      return { id: nextId('count', rng), kind: 'count', item, n, layout, tap: spec.tap, spots: layout === 'scatter' ? scatter(rng, n) : [], options: optionsFor(rng, n, 1, hi) };
    }
    case 'make': {
      const n = pickIn(rng, spec.n, level);
      const field = Math.min(n + randInt(rng, 2, 3), 14);
      return { id: nextId('make', rng), kind: 'make', item, n, field, spots: scatter(rng, field) };
    }
    case 'compare': {
      const gap = spec.gap ?? 1;
      let a = 0;
      let b = 0;
      for (let k = 0; k < 50 && (a === b || Math.abs(a - b) < gap); k++) {
        a = pickIn(rng, spec.n, level);
        b = randInt(rng, spec.n[0], spec.n[1]);
      }
      if (a === b) b = a === spec.n[0] ? a + gap : a - gap;
      const ask = spec.ask === 'both' || !spec.ask ? (rng() < 0.5 ? 'more' : 'fewer') : spec.ask;
      const who = [...FRIEND_IDS].sort(() => rng() - 0.5).slice(0, 2) as [FriendId, FriendId];
      // 적은 쪽을 넓게 벌려 놓으면 "길이"가 아니라 "개수"를 봐야 한다
      const spread = spec.spread ? (a < b ? 0 : 1) : null;
      return { id: nextId('compare', rng), kind: 'compare', item: spec.numbers ? undefined : item, a, b, ask, who, spread };
    }
    case 'hop':
    case 'land': {
      const max = spec.max ?? 10;
      const dir: 1 | -1 = spec.dir === 0 ? (rng() < 0.5 ? 1 : -1) : spec.dir;
      const k = pickIn(rng, spec.k, level);
      let from = pickIn(rng, spec.from, level);
      // 길 밖으로 나가지 않게
      from = dir === 1 ? Math.min(from, max - k) : Math.max(from, k);
      return { id: nextId(spec.kind, rng), kind: spec.kind, from, k, dir, view: viewFor(from, from + dir * k, max) };
    }
    case 'story':
    case 'calc': {
      const op = spec.op === 'mix' ? (rng() < 0.5 ? '+' : '-') : spec.op;
      const total = pickIn(rng, spec.total, level);
      // 더하기: total = a + b (a ≥ 1), 빼기: total = 처음 수, 남는 수 ≥ 1
      const b = clamp(pickIn(rng, spec.b, level), 1, Math.max(1, total - 1));
      const a = op === '+' ? total - b : total;
      const result = op === '+' ? total : total - b;
      const max = spec.kind === 'calc' && spec.max ? spec.max : total > 10 ? 20 : 10;
      const view = viewFor(a, result, max);
      if (spec.kind === 'story') {
        return { id: nextId('story', rng), kind: 'story', op, a, b, item, who: opts.friend, view, options: optionsFor(rng, result, 0, max) };
      }
      const missing = !!spec.missing && op === '+';
      const answer = missing ? b : result;
      const words = spec.words ? { item, who: pickOf(rng, FRIEND_IDS) } : undefined;
      return { id: nextId('calc', rng), kind: 'calc', op, a, b, missing, words, view, options: optionsFor(rng, answer, missing ? 1 : 0, max) };
    }
    case 'ten': {
      const a = pickIn(rng, spec.a, 1 - level);
      return { id: nextId('ten', rng), kind: 'ten', a, options: optionsFor(rng, 10 - a, 1, 9) };
    }
  }
}

/** 이 문제의 정답 (compare는 고를 쪽 0/1, hop·land는 도착할 돌) */
export function answerOf(t: Task): number {
  switch (t.kind) {
    case 'count':
    case 'make':
      return t.n;
    case 'compare': {
      const bigger = t.a > t.b ? 0 : 1;
      return t.ask === 'more' ? bigger : 1 - bigger;
    }
    case 'hop':
    case 'land':
      return t.from + t.dir * t.k;
    case 'story':
      return t.op === '+' ? t.a + t.b : t.a - t.b;
    case 'calc':
      return t.missing ? t.b : t.op === '+' ? t.a + t.b : t.a - t.b;
    case 'ten':
      return 10 - t.a;
  }
}

/** 이야기·식에서 토리가 뛰어 도착하는 돌 */
export const resultOf = (t: Extract<Task, { kind: 'story' | 'calc' }>) => (t.op === '+' ? t.a + t.b : t.a - t.b);

/** 숫자 보기를 고르는 단계가 있는 문제 */
export const hasChoices = (t: Task): t is Extract<Task, { options: number[] }> => 'options' in t;

/**
 * 수 길에서 토리가 지나온 돌 (되돌아가면 지운다) — 뛴 횟수 = 길이 - 1.
 * 화살표(호)에 1, 2, 3… 번호를 붙여 "몇 칸"을 눈으로 센다.
 */
export function stepPath(path: number[], to: number): number[] {
  if (path.length >= 2 && path[path.length - 2] === to) return path.slice(0, -1);
  return [...path, to];
}
