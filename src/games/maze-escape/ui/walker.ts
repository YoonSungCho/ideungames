import { canMove, holdStep, type Dir } from '../engine/maze';
import { isLive, useMazeEscape } from '../store';

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

/*
 * 조이스틱 누르고 있기: 손을 뗄 때까지 HOLD_MS마다 한 칸씩.
 * 꺾인 길은 알아서 따라 돌고, 갈림길에서 막히면 기다린다 (그때 한 번만 "쿵").
 */
export const HOLD_MS = 160;
let holdDir: Dir | null = null;
let holdTimer: ReturnType<typeof setInterval> | null = null;
let came: number | null = null;
let bumped = false;
let lastTick = 0;

function holdTick() {
  const st = useMazeEscape.getState();
  if (!holdDir || !isLive(st)) return releaseHold();
  lastTick = Date.now();
  const s = st.session!;
  const r = holdStep(s.maze, s.pos, holdDir, came);
  if (!r) {
    if (!bumped && !canMove(s.maze, s.pos, holdDir)) st.step(holdDir);
    bumped = true;
    return;
  }
  bumped = false;
  came = s.pos;
  st.stepTo(r.cell);
}

/** 이 방향으로 계속 가기 (방향만 바뀌면 걷던 흐름은 그대로) */
export function hold(d: Dir) {
  if (holdDir === d && holdTimer) return;
  stopWalk();
  const fresh = !holdTimer;
  holdDir = d;
  bumped = false;
  if (fresh) came = null;
  if (holdTimer) clearInterval(holdTimer);
  // 처음 누를 때는 바로, 손가락이 흔들려 방향이 자주 바뀌어도 너무 빨라지지 않게
  if (fresh || Date.now() - lastTick > HOLD_MS * 0.6) holdTick();
  holdTimer = setInterval(holdTick, HOLD_MS);
}

export function releaseHold() {
  holdDir = null;
  if (holdTimer) clearInterval(holdTimer);
  holdTimer = null;
  came = null;
}
