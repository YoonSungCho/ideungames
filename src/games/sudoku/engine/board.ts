import type { BoardSpec, Grid } from './types';

const peerCache = new Map<string, number[][]>();

/** 각 셀과 같은 행/열/박스에 있는 다른 셀 인덱스 목록. */
export function peersOf(spec: BoardSpec): number[][] {
  const key = `${spec.size}:${spec.boxRows}x${spec.boxCols}`;
  const cached = peerCache.get(key);
  if (cached) return cached;
  const { size, boxRows, boxCols } = spec;
  const peers: number[][] = [];
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const set = new Set<number>();
    for (let k = 0; k < size; k++) {
      set.add(r * size + k);
      set.add(k * size + c);
    }
    const br = r - (r % boxRows);
    const bc = c - (c % boxCols);
    for (let dr = 0; dr < boxRows; dr++) {
      for (let dc = 0; dc < boxCols; dc++) set.add((br + dr) * size + bc + dc);
    }
    set.delete(i);
    peers.push([...set]);
  }
  peerCache.set(key, peers);
  return peers;
}

/** 행, 열, 박스 단위(unit)별 셀 인덱스 목록. */
export function unitsOf(spec: BoardSpec): number[][] {
  const { size, boxRows, boxCols } = spec;
  const units: number[][] = [];
  for (let r = 0; r < size; r++) units.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) units.push(Array.from({ length: size }, (_, r) => r * size + c));
  for (let br = 0; br < size; br += boxRows) {
    for (let bc = 0; bc < size; bc += boxCols) {
      const box: number[] = [];
      for (let dr = 0; dr < boxRows; dr++) {
        for (let dc = 0; dc < boxCols; dc++) box.push((br + dr) * size + bc + dc);
      }
      units.push(box);
    }
  }
  return units;
}

export function candidatesAt(grid: Grid, index: number, spec: BoardSpec): number[] {
  if (grid[index] !== 0) return [];
  const used = new Set(peersOf(spec)[index].map((p) => grid[p]));
  const out: number[] = [];
  for (let n = 1; n <= spec.size; n++) if (!used.has(n)) out.push(n);
  return out;
}

/** value를 index에 두었을 때 같은 행/열/박스와 충돌하는 셀들. */
export function conflictsAt(grid: Grid, index: number, value: number, spec: BoardSpec): number[] {
  if (value === 0) return [];
  return peersOf(spec)[index].filter((p) => grid[p] === value);
}

export function isSolved(grid: Grid, solution: Grid): boolean {
  return grid.every((v, i) => v === solution[i]);
}

export function rowOf(index: number, spec: BoardSpec) {
  return Math.floor(index / spec.size);
}
export function colOf(index: number, spec: BoardSpec) {
  return index % spec.size;
}
export function boxOf(index: number, spec: BoardSpec) {
  const r = rowOf(index, spec);
  const c = colOf(index, spec);
  const boxesPerRow = spec.size / spec.boxCols;
  return Math.floor(r / spec.boxRows) * boxesPerRow + Math.floor(c / spec.boxCols);
}
