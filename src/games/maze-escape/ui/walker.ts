import { useMazeEscape } from '../store';

/** 여러 칸을 한 칸씩 걸어가게 하는 줄 (한 번에 순간이동하면 벽을 뚫고 가는 것처럼 보인다) */
export const STEP_MS = 80;
let queue: number[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

export function stopWalk() {
  queue = [];
  if (timer) clearInterval(timer);
  timer = null;
}

export function walk(path: number[]) {
  stopWalk();
  if (!path.length) return;
  queue = [...path];
  // 첫 걸음은 바로
  if (!useMazeEscape.getState().stepTo(queue.shift()!)) return stopWalk();
  if (!queue.length) return;
  timer = setInterval(() => {
    const c = queue.shift();
    if (c === undefined || !useMazeEscape.getState().stepTo(c)) stopWalk();
    if (!queue.length) stopWalk();
  }, STEP_MS);
}
