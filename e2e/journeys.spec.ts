import { expect, test, type Page } from '@playwright/test';
import { openNewGame, placeOneCorrect, saved, startGame, timerText } from './helpers';

/**
 * 화면을 나갔다 들어오는 모든 경로에서 "아이가 기대하는 화면"이 나오는지.
 * 규칙:
 *  - 그만하기 / 메뉴·시작 전 화면에서 나감  → 다시 오면 메뉴 (진행 중이면 "이어하기" 버튼)
 *  - 게임 중에 앱을 내림·새로고침·설정 다녀옴 → 다시 오면 "잠깐 쉬는 중 · 계속하기"
 *  - 이어하기를 누르면 바로 시간이 흐름 (계속하기를 또 누르지 않음)
 */

const menu = (page: Page) => page.getByRole('radiogroup', { name: '보드 크기' });
const resumeBtn = (page: Page) => page.getByRole('button', { name: /하던 게임 이어하기/ });
const pausedOverlay = (page: Page) => page.getByRole('button', { name: '▶ 계속하기' });
const readyOverlay = (page: Page) => page.getByRole('button', { name: '▶ 시작하기' });
const enterSudoku = (page: Page) => page.getByRole('link', { name: /스도쿠/ }).click();

async function expectTimerRunning(page: Page) {
  const t0 = await timerText(page);
  await expect.poll(() => timerText(page), { timeout: 4000 }).not.toBe(t0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('게임 중 뒤로 → 그만하기 → 다시 들어오면 메뉴, 이어하기 누르면 바로 진행', async ({ page }) => {
  await startGame(page, 4);
  const placed = await placeOneCorrect(page);
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page.getByRole('dialog')).toContainText('게임을 그만할까?');
  await page.getByRole('button', { name: '그만하기' }).click();

  await enterSudoku(page);
  await expect(menu(page)).toBeVisible();
  await expect(pausedOverlay(page)).toBeHidden();
  await resumeBtn(page).click();
  await expect(pausedOverlay(page)).toBeHidden();
  await expect(readyOverlay(page)).toBeHidden();
  await expectTimerRunning(page);
  expect((await saved(page)).game!.values[placed]).not.toBe(0); // 하던 판 그대로
});

test('게임 중 뒤로 → 계속하기 → 그대로 진행 (멈춤 화면 없음)', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.getByRole('link', { name: '홈으로' }).click();
  await page.getByRole('button', { name: '계속하기' }).click();
  await expect(pausedOverlay(page)).toBeHidden();
  await expectTimerRunning(page);
});

test('안드로이드 뒤로(브라우저 뒤로)도 같은 확인을 거친다', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.goBack();
  await expect(page.getByRole('dialog')).toContainText('게임을 그만할까?');
  await page.getByRole('button', { name: '그만하기' }).click();
  await expect(page.getByRole('link', { name: /스도쿠/ })).toBeVisible();
  await enterSudoku(page);
  await expect(resumeBtn(page)).toBeVisible();
});

test('시작 전 화면에서 나갔다 오면 메뉴', async ({ page }) => {
  await openNewGame(page, 9);
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await enterSudoku(page);
  await expect(menu(page)).toBeVisible();
  await expect(resumeBtn(page)).toBeHidden(); // 시작도 안 한 판은 이어할 게 없음
});

test('메뉴에서 나갔다 오면 메뉴 (진행 중 판은 이어하기로)', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.getByRole('button', { name: /난이도 쉬움/ }).click();
  await expect(menu(page)).toBeVisible();
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await enterSudoku(page);
  await expect(menu(page)).toBeVisible();
  await resumeBtn(page).click();
  await expectTimerRunning(page);
});

test('메뉴 → 기록 보기 → 뒤로 → 메뉴로 돌아온다', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.getByRole('button', { name: /난이도 쉬움/ }).click();
  await page.getByRole('link', { name: /기록 · 메달/ }).click();
  await expect(page.getByText('내 메달')).toBeVisible();
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(menu(page)).toBeVisible();
  await expect(pausedOverlay(page)).toBeHidden();

  // 브라우저 뒤로도 같은 결과
  await page.getByRole('link', { name: /기록 · 메달/ }).click();
  await page.goBack();
  await expect(menu(page)).toBeVisible();
});

test('기록 화면의 도전 → 메뉴를 거치지 않고 바로 시작 화면', async ({ page }) => {
  await page.goto('./#/games/sudoku');
  await page.getByRole('link', { name: /기록 · 메달/ }).click();
  await page.getByRole('button', { name: '첫 기록 만들기 ▶' }).first().click();
  await expect(readyOverlay(page)).toBeVisible();
});

test('게임 중 설정 다녀오기 → 뒤로는 게임으로, 멈춘 상태에서 계속하기', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.getByRole('link', { name: '설정' }).click();
  await expect(page.getByRole('dialog')).toBeHidden(); // 설정은 묻지 않음
  await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();
  await page.getByRole('button', { name: '뒤로' }).click();
  await expect(page).toHaveURL(/games\/sudoku$/);
  await expect(pausedOverlay(page)).toBeVisible();
  await pausedOverlay(page).click();
  await expectTimerRunning(page);
});

test('홈에서 설정 → 뒤로는 홈', async ({ page }) => {
  await page.getByRole('link', { name: '설정' }).click();
  await page.getByRole('button', { name: '뒤로' }).click();
  await expect(page.getByRole('link', { name: /스도쿠/ })).toBeVisible();
});

test('설정 주소로 바로 열면 뒤로는 홈', async ({ page }) => {
  await page.goto('./#/settings');
  await page.reload();
  await page.getByRole('link', { name: '홈으로' }).click();
  await expect(page.getByRole('link', { name: /스도쿠/ })).toBeVisible();
});

test('게임 중 새로고침 → 멈춘 상태, 계속하기로 이어서', async ({ page }) => {
  await startGame(page, 4);
  await placeOneCorrect(page);
  await page.reload();
  await expect(pausedOverlay(page)).toBeVisible();
  await pausedOverlay(page).click();
  await expectTimerRunning(page);
});

test('클리어 후 홈 → 다시 들어오면 메뉴 (이어하기 없음)', async ({ page }) => {
  await startGame(page, 4);
  const { solveAll } = await import('./helpers');
  await solveAll(page);
  await page.getByRole('dialog').getByRole('button', { name: '홈으로' }).click();
  await enterSudoku(page);
  await expect(menu(page)).toBeVisible();
  await expect(resumeBtn(page)).toBeHidden();
});

test('클리어 → 한 판 더 → 같은 모드·난이도로 시작 화면', async ({ page }) => {
  await startGame(page, 4, '중간');
  const { solveAll } = await import('./helpers');
  await solveAll(page);
  await page.getByRole('dialog').getByRole('button', { name: '한 판 더!' }).click();
  await expect(page.getByText('2×2 블록 · 중간')).toBeVisible();
  await expect(readyOverlay(page)).toBeVisible();
});
