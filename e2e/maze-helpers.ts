import { expect, type Page } from '@playwright/test';

export interface MazeSession {
  status: 'ready' | 'playing' | 'done';
  maze: { w: number; h: number; walls: number[]; start: number; goal: number; stars: number[] };
  pos: number;
  trail: number[];
  got: number[];
  steps: number;
  hints: number;
  elapsedMs: number;
}

export async function mazeState(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ideun.maze-escape') ?? '{}').state as {
    session: MazeSession | null;
    records: Record<string, { plays: number; best?: number }>;
  });
}

export const LEVEL_NAMES = { tiny: '꼬마', easy: '쉬움', medium: '중간', hard: '어려움' } as const;
type Dir = 'up' | 'right' | 'down' | 'left';
const BIT: Record<Dir, number> = { up: 1, right: 2, down: 4, left: 8 };
const KEY: Record<Dir, string> = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' };
const OPP: Record<Dir, Dir> = { up: 'down', right: 'left', down: 'up', left: 'right' };

export const step = (m: MazeSession['maze'], i: number, d: Dir) => i + (d === 'up' ? -m.w : d === 'down' ? m.w : d === 'right' ? 1 : -1);
export const open = (m: MazeSession['maze'], i: number) => (Object.keys(BIT) as Dir[]).filter((d) => (m.walls[i] & BIT[d]) === 0);

/** from에서 to까지 방향 목록 (BFS) */
export function route(m: MazeSession['maze'], from: number, to: number): Dir[] {
  const prev = new Map<number, [number, Dir]>();
  const q = [from];
  const seen = new Set([from]);
  while (q.length) {
    const i = q.shift()!;
    if (i === to) break;
    for (const d of open(m, i)) {
      const j = step(m, i, d);
      if (seen.has(j)) continue;
      seen.add(j);
      prev.set(j, [i, d]);
      q.push(j);
    }
  }
  const dirs: Dir[] = [];
  for (let i = to; i !== from; ) {
    const [p, d] = prev.get(i)!;
    dirs.unshift(d);
    i = p;
  }
  return dirs;
}

/** 홈 → 미로 탈출 → 친구·크기 고르기 → 시작 전 화면 */
export async function openMaze(page: Page, opts: { level?: keyof typeof LEVEL_NAMES; hero?: string } = {}) {
  const { level = 'tiny', hero = '토끼' } = opts;
  await page.goto('./');
  await page.getByRole('link', { name: /미로 탈출/ }).click();
  await page.getByRole('radio', { name: hero, exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`^${LEVEL_NAMES[level]} \\d+×\\d+`) }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
}

export async function startMaze(page: Page, opts: Parameters<typeof openMaze>[1] = {}) {
  await openMaze(page, opts);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeHidden();
}

/** 화살표 키로 한 칸 */
export const press = (page: Page, d: Dir) => page.keyboard.press(KEY[d]);

/** 화살표 키로 한 칸씩 걸어서 to까지 */
export async function walkTo(page: Page, to: number) {
  const s = (await mazeState(page)).session!;
  for (const d of route(s.maze, s.pos, to)) await press(page, d);
  await expect.poll(async () => (await mazeState(page)).session!.pos).toBe(to);
}

export async function walkToGoal(page: Page) {
  const s = (await mazeState(page)).session!;
  for (const d of route(s.maze, s.pos, s.maze.goal)) await press(page, d);
  await expect.poll(async () => (await mazeState(page)).session!.status).toBe('done');
}

export const joystick = (page: Page) => page.getByRole('group', { name: '조이스틱' });

/** 조이스틱을 d쪽으로 누르고 있기 (ms 동안) */
export async function holdJoystick(page: Page, d: Dir, ms: number) {
  const box = (await joystick(page).boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width * 0.4;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + (d === 'right' ? r : d === 'left' ? -r : 0), cy + (d === 'down' ? r : d === 'up' ? -r : 0), { steps: 3 });
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** 조이스틱을 계속 누르고 있을 때 가는 칸들 (게임 규칙과 같게: 막히면 꺾인 길을 따라, 갈림길에서 멈춤) */
export function holdPath(m: MazeSession['maze'], from: number, d: Dir, max = 50): number[] {
  const path: number[] = [];
  let pos = from;
  let came: number | null = null;
  for (let k = 0; k < max && pos !== m.goal; k++) {
    let next: number | null = null;
    if (open(m, pos).includes(d)) next = step(m, pos, d);
    else if (came !== null) {
      const ways = open(m, pos).filter((x) => step(m, pos, x) !== came);
      if (ways.length === 1 && ways[0] !== OPP[d]) next = step(m, pos, ways[0]);
    }
    if (next === null) break;
    came = pos;
    pos = next;
    path.push(pos);
  }
  return path;
}

/** 미로 칸의 화면 위치 (가운데) */
export async function cellPoint(page: Page, i: number) {
  const s = (await mazeState(page)).session!;
  const box = (await page.locator('[data-pos] svg').boundingBox())!;
  const size = s.maze.w * 10 + 4;
  const x = i % s.maze.w;
  const y = Math.floor(i / s.maze.w);
  return { x: box.x + ((2 + x * 10 + 5) / size) * box.width, y: box.y + ((2 + y * 10 + 5) / size) * box.height };
}
