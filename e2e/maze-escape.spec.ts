import { expect, test } from '@playwright/test';
import { timerText } from './helpers';
import { cellPoint, holdJoystick, holdPath, joystick, mazeState, open, openMaze, press, route, startMaze, step, walkTo, walkToGoal } from './maze-helpers';

const board = (page: import('@playwright/test').Page) => page.locator('[data-pos]');

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('시작 전엔 미로가 가려지고 시간이 안 간다 → 시작하기', async ({ page }) => {
  await openMaze(page, { level: 'easy' });
  await page.waitForTimeout(1000);
  expect(await timerText(page)).toBe('0:00');
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect.poll(() => timerText(page), { timeout: 4000 }).not.toBe('0:00');
});

test('조이스틱: 벽 쪽으로 밀면 안 가고, 길 쪽으로 밀고 있으면 손을 뗄 때까지 계속 간다', async ({ page }) => {
  await startMaze(page, { level: 'medium' });
  const s = (await mazeState(page)).session!;
  const ways = open(s.maze, s.pos);
  const wall = (['up', 'right', 'down', 'left'] as const).find((d) => !ways.includes(d))!;
  await holdJoystick(page, wall, 400);
  await expect(board(page)).toHaveAttribute('data-pos', String(s.pos));

  // 가장 멀리 가는 쪽으로 (꺾인 길도 따라감)
  const d = ways.reduce((a, b) => (holdPath(s.maze, s.pos, b).length > holdPath(s.maze, s.pos, a).length ? b : a));
  const path = holdPath(s.maze, s.pos, d);
  await holdJoystick(page, d, path.length * 160 + 500);
  await expect(board(page)).toHaveAttribute('data-pos', String(path[path.length - 1]));
  // 손을 떼면 멈춘다
  await page.waitForTimeout(500);
  expect((await mazeState(page)).session!.steps).toBe(path.length);
});

test('친구를 손가락으로 잡고 길을 따라 끌면 따라온다', async ({ page }) => {
  await startMaze(page, { level: 'medium' });
  const s = (await mazeState(page)).session!;
  const dirs = route(s.maze, s.pos, s.maze.goal).slice(0, 5);
  const cells: number[] = [];
  for (let i = s.pos, k = 0; k < dirs.length; k++) cells.push((i = step(s.maze, i, dirs[k])));
  const from = await cellPoint(page, s.pos);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const c of cells) {
    const p = await cellPoint(page, c);
    await page.mouse.move(p.x, p.y, { steps: 4 });
  }
  await page.mouse.up();
  await expect(board(page)).toHaveAttribute('data-pos', String(cells[cells.length - 1]));
  // 벽 너머로 끌면 안 간다
  const wall = (['up', 'right', 'down', 'left'] as const).find((d) => {
    const pos = cells[cells.length - 1];
    const [x, y] = [pos % s.maze.w, Math.floor(pos / s.maze.w)];
    const inside = d === 'up' ? y > 0 : d === 'down' ? y < s.maze.h - 1 : d === 'left' ? x > 0 : x < s.maze.w - 1;
    return inside && !open(s.maze, pos).includes(d);
  });
  if (wall) {
    const pos = cells[cells.length - 1];
    const a = await cellPoint(page, pos);
    const b = await cellPoint(page, step(s.maze, pos, wall));
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 4 });
    await page.mouse.up();
    await expect(board(page)).toHaveAttribute('data-pos', String(pos));
  }
});

test('친구가 아닌 곳에서 휙 밀면 그쪽 길을 따라 쭉 간다', async ({ page }) => {
  await startMaze(page, { level: 'medium' });
  const s = (await mazeState(page)).session!;
  const d = open(s.maze, s.pos)[0];
  // 친구에서 먼 칸(가운데)에서 시작
  const from = await cellPoint(page, Math.floor(s.maze.h / 2) * s.maze.w + Math.floor(s.maze.w / 2));
  const dx = d === 'right' ? 80 : d === 'left' ? -80 : 0;
  const dy = d === 'down' ? 80 : d === 'up' ? -80 : 0;
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx / 2, from.y + dy / 2);
  await page.mouse.move(from.x + dx, from.y + dy);
  await page.mouse.up();
  await expect.poll(async () => (await mazeState(page)).session!.steps).toBeGreaterThanOrEqual(1);
  expect((await mazeState(page)).session!.pos).not.toBe(s.pos);
});

test('같은 줄에 벽 없이 이어진 칸을 누르면 거기까지 걸어간다', async ({ page }) => {
  await startMaze(page, { level: 'medium' });
  const s = (await mazeState(page)).session!;
  const d = open(s.maze, s.pos)[0];
  // 그 방향으로 벽 없이 갈 수 있는 가장 먼 칸
  let target = s.pos;
  while ((s.maze.walls[target] & { up: 1, right: 2, down: 4, left: 8 }[d]) === 0) target = step(s.maze, target, d);
  const p = await cellPoint(page, target);
  await page.mouse.click(p.x, p.y);
  await expect(board(page)).toHaveAttribute('data-pos', String(target));
});

test('도착 → 탈출 성공·첫 기록 → 기록 화면 → 뒤로 메뉴', async ({ page }) => {
  await startMaze(page, { level: 'tiny', hero: '펭귄' });
  // 별 하나를 들렀다가 도착
  const s = (await mazeState(page)).session!;
  await walkTo(page, s.maze.stars[0]);
  await expect(page.getByLabel(/^별 [123]개, 모두 3개$/)).toBeVisible();
  await walkToGoal(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('탈출 성공');
  await expect(dialog).toContainText('펭귄이 물고기를 먹었어요');
  await expect(dialog).toContainText('첫 기록');
  await expect(dialog.getByLabel(/^별 [123]개$/)).toBeVisible();
  expect((await mazeState(page)).records.tiny).toMatchObject({ plays: 1 });
  await dialog.getByRole('link', { name: /기록 보기/ }).click();
  await expect(page.getByText('내 최고 기록')).toBeVisible();
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page.getByRole('radiogroup', { name: '친구 고르기' })).toBeVisible();
  await expect(page.getByRole('button', { name: /하던 미로 이어하기/ })).toBeHidden();
});

test('💡 힌트를 누르면 도착까지 길이 잠깐 반짝인다', async ({ page }) => {
  await startMaze(page, { level: 'easy' });
  await expect(board(page)).not.toHaveAttribute('data-hint');
  await page.getByRole('button', { name: /^힌트/ }).click();
  await expect(board(page)).toHaveAttribute('data-hint', 'true');
  await expect(board(page)).not.toHaveAttribute('data-hint', { timeout: 5000 });
});

test('그만하기 → 다시 들어오면 메뉴, 이어하기는 바로 진행', async ({ page }) => {
  await startMaze(page, { level: 'easy' });
  const s = (await mazeState(page)).session!;
  await press(page, route(s.maze, s.pos, s.maze.goal)[0]);
  await page.getByRole('link', { name: '홈으로' }).click();
  await page.getByRole('button', { name: '그만하기' }).click();
  await page.getByRole('link', { name: /미로 탈출/ }).click();
  await expect(page.getByRole('radiogroup', { name: '친구 고르기' })).toBeVisible();
  await page.getByRole('button', { name: /하던 미로 이어하기/ }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  await walkToGoal(page);
});

test('새로고침 → 멈춘 상태, 계속하기', async ({ page }) => {
  await startMaze(page, { level: 'easy' });
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await walkToGoal(page);
});

test('진행 중에 다른 크기를 고르면 묻는다', async ({ page }) => {
  await startMaze(page, { level: 'easy' });
  await page.getByRole('button', { name: /바꾸기$/ }).click();
  await page.getByRole('button', { name: /^중간 10×10/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '취소하고 새로 시작' }).click();
  expect((await mazeState(page)).session!.maze.w).toBe(10);
});

test('키보드 화살표로 움직이기: 벽 쪽은 안 가고, 길 쪽은 한 칸', async ({ page }) => {
  await startMaze(page, { level: 'tiny' });
  const s = (await mazeState(page)).session!;
  const wall = (['up', 'right', 'down', 'left'] as const).find((d) => !open(s.maze, s.pos).includes(d))!;
  await press(page, wall);
  await expect(board(page)).toHaveAttribute('data-pos', String(s.pos));
  for (const d of route(s.maze, s.pos, s.maze.goal)) await press(page, d);
  await expect(page.getByRole('dialog')).toContainText('탈출 성공');
});

test('조이스틱 손잡이는 친구 얼굴이고, 미는 쪽 화살표가 켜진다', async ({ page }) => {
  await startMaze(page, { level: 'easy', hero: '펭귄' });
  await expect(joystick(page)).toContainText('🐧');
  const box = (await joystick(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 4, { steps: 3 });
  await expect(joystick(page)).toHaveAttribute('data-dir', 'up');
  await page.mouse.up();
  await expect(joystick(page)).not.toHaveAttribute('data-dir');
});
