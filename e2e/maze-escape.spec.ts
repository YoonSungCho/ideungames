import { expect, test } from '@playwright/test';
import { timerText } from './helpers';
import { cellPoint, dirBtn, mazeState, open, openMaze, route, startMaze, step, walkTo, walkToGoal } from './maze-helpers';

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

test('방향 버튼: 벽 쪽은 안 가고, 길 쪽은 한 칸 간다', async ({ page }) => {
  await startMaze(page, { level: 'easy' });
  const s = (await mazeState(page)).session!;
  const ways = open(s.maze, s.pos);
  const wall = (['up', 'right', 'down', 'left'] as const).find((d) => !ways.includes(d))!;
  await dirBtn(page, wall).click();
  await expect(board(page)).toHaveAttribute('data-pos', String(s.pos));
  await dirBtn(page, ways[0]).click();
  await expect(board(page)).toHaveAttribute('data-pos', String(step(s.maze, s.pos, ways[0])));
  expect((await mazeState(page)).session!.steps).toBe(1);
});

test('미로 위를 밀면 그쪽 길을 따라 쭉 간다', async ({ page }) => {
  await startMaze(page, { level: 'medium' });
  const s = (await mazeState(page)).session!;
  const d = open(s.maze, s.pos)[0];
  const from = await cellPoint(page, s.pos);
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
  await dirBtn(page, route(s.maze, s.pos, s.maze.goal)[0]).click();
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

test('키보드 화살표로 움직이기', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await startMaze(page, { level: 'tiny' });
  const s = (await mazeState(page)).session!;
  for (const d of route(s.maze, s.pos, s.maze.goal)) await page.keyboard.press({ up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' }[d]);
  await expect(page.getByRole('dialog')).toContainText('탈출 성공');
});
