import type { FriendId, ItemId } from '../data/items';

export type Op = '+' | '-';
export type Range = [number, number];
/** 물건 늘어놓기: 한 줄 · 흩어짐 · 주사위 무늬(한눈에 보기) · 10칸 상자 */
export type Layout = 'row' | 'scatter' | 'dice' | 'frame';

/** 수 길(징검다리)에서 보이는 구간 — 늘 11개 돌 (lo ~ lo+10) */
export interface View {
  lo: number;
  hi: number;
}

/**
 * 한 문제. 아이가 하는 일에 따라 종류가 나뉜다.
 * - count: 물건을 하나씩 눌러 세고(tap) → 모두 몇 개인지 고르기
 * - make: 바구니에 n개 담기
 * - compare: 누가 더 많이/적게 (물건) · 어느 수가 더 큰지/작은지 (숫자)
 * - hop: 토리를 k칸 앞/뒤로 뛰게 하기 (한 번에 한 칸)
 * - land: k칸 뛰면 어디에 도착할지 돌 고르기
 * - story: 이야기 — 물건을 받거나(+) 주면서(−) 토리가 한 칸씩 뛰고 → 모두 몇 개
 * - calc: 식 (3 + 2 = ?, 3 + ? = 5), 이야기 글만 있는 문제도. 수 길에서 토리를 뛰게 해 볼 수 있다
 * - ten: 10칸 알 상자를 꽉 채우려면 몇 개 더
 */
export type Task =
  | { id: string; kind: 'count'; item: ItemId; n: number; layout: Layout; tap: boolean; spots: Spot[]; options: number[] }
  | { id: string; kind: 'make'; item: ItemId; n: number; field: number; spots: Spot[] }
  | { id: string; kind: 'compare'; item?: ItemId; a: number; b: number; ask: 'more' | 'fewer'; who: [FriendId, FriendId]; spread: 0 | 1 | null }
  | { id: string; kind: 'hop'; from: number; k: number; dir: 1 | -1; view: View }
  | { id: string; kind: 'land'; from: number; k: number; dir: 1 | -1; view: View }
  | { id: string; kind: 'story'; op: Op; a: number; b: number; item: ItemId; who: FriendId; view: View; options: number[] }
  | { id: string; kind: 'calc'; op: Op; a: number; b: number; missing: boolean; words?: { item: ItemId; who: FriendId }; view: View; options: number[] }
  | { id: string; kind: 'ten'; a: number; options: number[] };

export type TaskKind = Task['kind'];

/** 흩어 놓은 물건 자리 (0~1, 왼쪽 위 기준) */
export type Spot = [number, number];

/** 단원 설정: 이 단계에서 낼 문제의 범위 */
export type Spec =
  | { kind: 'count'; n: Range; layout: Layout | Layout[]; tap: boolean }
  | { kind: 'make'; n: Range }
  | { kind: 'compare'; n: Range; numbers?: boolean; ask?: 'more' | 'fewer' | 'both'; gap?: number; spread?: boolean }
  | { kind: 'hop'; from: Range; k: Range; dir: 1 | -1 | 0; max?: number }
  | { kind: 'land'; from: Range; k: Range; dir: 1 | -1 | 0; max?: number }
  /** total: 더하기는 합, 빼기는 처음 수 */
  | { kind: 'story'; op: Op | 'mix'; total: Range; b: Range }
  | { kind: 'calc'; op: Op | 'mix'; total: Range; b: Range; missing?: boolean; words?: boolean; max?: number }
  | { kind: 'ten'; a: Range };
