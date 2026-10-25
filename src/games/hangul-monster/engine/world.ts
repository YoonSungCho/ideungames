import { BUILDING_TILE, GRASS, MAPS, NPCS, WALK, type Building, type Exit, type MapId, type Npc } from '../data/world';
import type { SpeciesId } from '../data/species';
import type { Rng } from './rng';

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export interface Flags {
  badges: number;
  defeated: string[];
  picked: string[];
  hasStarter: boolean;
}

export const tileAt = (map: MapId, x: number, y: number) => MAPS[map].rows[y]?.[x] ?? '#';
export const mapSize = (map: MapId) => ({ w: MAPS[map].rows[0].length, h: MAPS[map].rows.length });

/** 지금 지도에 보이는 사람·물건 (이긴 졸개, 주운 물건, 비켜 준 지기는 없음) */
export function visibleNpcs(map: MapId, f: Flags): Npc[] {
  return NPCS.filter((n) => {
    if (n.map !== map) return false;
    if (n.kind === 'item' || n.kind === 'puzzle') return !f.picked.includes(n.id);
    if (n.leaves) return !f.defeated.includes(n.id);
    if (n.kind === 'guard') return f.badges < (n.needBadges ?? 0);
    return n.kind !== 'gym'; // 관장은 체육관 건물 안에 있다
  });
}

const npcAt = (map: MapId, x: number, y: number, f: Flags) => visibleNpcs(map, f).find((n) => n.x === x && n.y === y);
const exitAt = (map: MapId, x: number, y: number) => MAPS[map].exits.find((e) => e.x === x && e.y === y);
export const gymNpc = (map: MapId) => NPCS.find((n) => n.map === map && n.kind === 'gym');

export type StepResult =
  | { kind: 'move'; x: number; y: number; grass: boolean }
  | { kind: 'exit'; exit: Exit }
  | { kind: 'npc'; npc: Npc }
  | { kind: 'building'; building: Building; x: number; y: number }
  | { kind: 'blocked' };

/** 한 칸 걷기. 사람·건물에 부딪히면 말 걸기/들어가기 */
export function step(map: MapId, x: number, y: number, dir: Dir, f: Flags): StepResult {
  const [dx, dy] = DIRS[dir];
  const nx = x + dx;
  const ny = y + dy;
  const npc = npcAt(map, nx, ny, f);
  if (npc) return { kind: 'npc', npc };
  const t = tileAt(map, nx, ny);
  if (BUILDING_TILE[t]) return { kind: 'building', building: BUILDING_TILE[t], x: nx, y: ny };
  if (!WALK.has(t)) return { kind: 'blocked' };
  const exit = exitAt(map, nx, ny);
  if (exit) return { kind: 'exit', exit };
  return { kind: 'move', x: nx, y: ny, grass: GRASS.has(t) };
}

const walkable = (map: MapId, x: number, y: number, f: Flags) => WALK.has(tileAt(map, x, y)) && !npcAt(map, x, y, f);

/**
 * 누른 칸까지 가는 길 (방향 목록). 사람·건물을 누르면 그 앞까지 가서 한 번 더 부딪힌다(=말 걸기).
 * 갈 수 없으면 null.
 */
export function findPath(map: MapId, from: [number, number], to: [number, number], f: Flags): Dir[] | null {
  const { w, h } = mapSize(map);
  const [tx, ty] = to;
  const targetSolid = !walkable(map, tx, ty, f);
  const key = (x: number, y: number) => y * w + x;
  const prev = new Map<number, [number, number, Dir] | null>([[key(...from), null]]);
  const queue: [number, number][] = [from];
  const done = (x: number, y: number) =>
    targetSolid ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : x === tx && y === ty;
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (done(x, y)) {
      const dirs: Dir[] = [];
      for (let k = key(x, y), p = prev.get(k); p; k = key(p[0], p[1]), p = prev.get(k)) dirs.unshift(p[2]);
      if (targetSolid) dirs.push((Object.keys(DIRS) as Dir[]).find((d) => x + DIRS[d][0] === tx && y + DIRS[d][1] === ty)!);
      return dirs;
    }
    for (const d of Object.keys(DIRS) as Dir[]) {
      const nx = x + DIRS[d][0];
      const ny = y + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || prev.has(key(nx, ny))) continue;
      // 나가는 칸은 마지막 목적지일 때만 밟는다 (지나가다 다른 지도로 넘어가지 않게)
      if (!walkable(map, nx, ny, f) || (exitAt(map, nx, ny) && !(nx === tx && ny === ty))) continue;
      prev.set(key(nx, ny), [x, y, d]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

export const ENCOUNTER_RATE = 0.13;

/** 수풀에서 한 걸음: 야생 몬스터가 나올까? */
export function rollEncounter(map: MapId, rng: Rng): [SpeciesId, number] | null {
  const wild = MAPS[map].wild;
  if (!wild || rng() >= ENCOUNTER_RATE) return null;
  const total = wild.table.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  let sp = wild.table[0][0];
  for (const [id, w] of wild.table) {
    if ((r -= w) < 0) {
      sp = id;
      break;
    }
  }
  const [lo, hi] = wild.lv;
  return [sp, lo + Math.floor(rng() * (hi - lo + 1))];
}
