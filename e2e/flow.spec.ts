import { expect, test } from '@playwright/test';
import { card, cells, expectFitsViewport, openNewGame, placeOneCorrect, saved, solveAll, startGame, timerText } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('홈 → 스도쿠: 크기·난이도 고르면 시작 전 화면, 시작하기를 눌러야 시간이 간다', async ({ page }) => {
  await openNewGame(page, 6, '중간');
  await expect(page.getByText('6×6 중간')).toBeVisible();
  await page.waitForTimeout(1300);
  expect(await timerText(page)).toBe('0:00');
  // 시작 전에는 칸을 눌러도 선택되지 않는다
  await cells(page).first().click({ force: true });
  expect(await cells(page).first().getAttribute('aria-selected')).toBe('false');

  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect.poll(() => timerText(page), { timeout: 4000 }).not.toBe('0:00');
  await expect(page.getByText(/메달까지/)).toBeVisible();
  expect((await saved(page)).game!.spec.size).toBe(6);
});

test('멈추기 → 보드 가림, 시간 멈춤 → 계속하기', async ({ page }) => {
  await startGame(page, 4);
  await page.getByRole('button', { name: '잠깐 멈추기' }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  const t = await timerText(page);
  await page.waitForTimeout(1300);
  expect(await timerText(page)).toBe(t);
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
});

test('상단 크기 전환: 시작 전이면 바로, 진행 중이면 물어본다', async ({ page }) => {
  await openNewGame(page, 4);
  await page.getByRole('radio', { name: '6×6' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('6×6 쉬움')).toBeVisible();
  expect((await saved(page)).game!.spec.size).toBe(6);

  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await placeOneCorrect(page);
  await page.getByRole('radio', { name: '8×8' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('8×8로 바꿀까?');
  await expect(dialog).toContainText('진행 중인 게임은 취소돼요');

  // 계속하기 → 그대로 이어서 (멈춤 화면 없이)
  await dialog.getByRole('button', { name: '하던 게임 계속하기' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  expect((await saved(page)).game!.spec.size).toBe(6);

  await page.getByRole('radio', { name: '8×8' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /취소하고 8×8/ }).click();
  await expect(page.getByText('8×8 쉬움')).toBeVisible();
  expect((await saved(page)).game).toMatchObject({ spec: { size: 8 }, status: 'ready' });
});

test('뒤로 가기: 진행 중이면 확인, 그만해도 이어서 할 수 있다 (멈춘 상태로)', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page.getByRole('dialog')).toContainText('게임을 그만할까?');
  await page.getByRole('button', { name: '계속하기' }).click();
  await expect(page).toHaveURL(/games\/sudoku/);

  await page.goBack();
  await expect(page.getByRole('dialog')).toContainText('게임을 그만할까?');
  await page.getByRole('button', { name: '그만하기' }).click();
  await expect(page.getByRole('link', { name: /스도쿠/ })).toBeVisible();

  await page.getByRole('link', { name: /스도쿠/ }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  const t = await timerText(page);
  await page.waitForTimeout(1200);
  expect(await timerText(page)).toBe(t);
});

test('시작 전에는 뒤로 가기를 묻지 않는다', async ({ page }) => {
  await openNewGame(page, 4);
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('link', { name: /스도쿠/ })).toBeVisible();
});

test('새로고침하면 진행 중인 게임은 멈춘 상태로 돌아온다', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
});

test('난이도 칩 → 다른 난이도 고르면 진행 중인 게임 취소를 묻는다', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.getByRole('button', { name: /난이도 쉬움/ }).click();
  await expect(page.getByRole('button', { name: /하던 게임 이어하기/ })).toBeVisible();
  await page.getByRole('button', { name: /어려움/ }).click();
  await expect(page.getByRole('dialog')).toContainText('새 게임을 시작할까?');
  await page.getByRole('dialog').getByRole('button', { name: '하던 게임 이어하기' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
  expect((await saved(page)).game!.status).toBe('playing');
});

test('끝까지 풀면 메달·기록 → 기록 화면 → 뒤로는 게임으로', async ({ page }) => {
  await startGame(page, 4);
  await solveAll(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('해냈어');
  await expect(dialog).toContainText('첫 기록');
  await expect(dialog).toContainText('메달');
  const rec = (await saved(page)).records['4-easy'];
  expect(rec.wins).toBe(1);
  expect(rec.runs).toHaveLength(1);

  await dialog.getByRole('link', { name: /기록 보기/ }).click();
  await expect(page).toHaveURL(/sudoku\/records/);
  await expect(page.getByText('내 메달')).toBeVisible();
  await expect(page.getByText('내 최고 기록')).toBeVisible();
  await expectFitsViewport(page);

  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page).toHaveURL(/games\/sudoku$/);
  await expect(page.getByRole('radio', { name: /4×4/ })).toBeVisible();

  // 한 판 더 흐름: 기록 화면에서 바로 도전
  await page.getByRole('link', { name: /기록 · 메달/ }).click();
  await page.getByRole('button', { name: '쉬움 다시 도전' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
});

test('도전 모드: 실수 횟수가 보인다', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: /도전/ }).first().click();
  await startGame(page, 4);
  await expect(page.getByLabel(/실수 0번/)).toBeVisible();
  const g = (await saved(page)).game!;
  const i = g.values.findIndex((v) => v === 0);
  const left = (n: number) => 4 - g.values.filter((v) => v === n).length;
  const wrong = [1, 2, 3, 4].find((n) => n !== g.solution[i] && left(n) > 0)!;
  await cells(page).nth(i).click();
  await card(page, wrong).click();
  await expect(page.getByLabel(/실수 1번/)).toBeVisible();
});

test('키보드: 방향키·숫자 입력', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await startGame(page, 4);
  const g = (await saved(page)).game!;
  const i = g.values.findIndex((v) => v === 0);
  await cells(page).nth(i).click();
  await page.keyboard.press(String(g.solution[i]));
  await expect.poll(async () => (await saved(page)).game!.values[i]).toBe(g.solution[i]);
});
