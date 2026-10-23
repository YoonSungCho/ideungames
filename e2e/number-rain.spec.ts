import { expect, test } from '@playwright/test';
import { drop, drops, openRain, popOne, RAIN, rainKey, rainSaved, score, seedRain, startRain, typeAnswer } from './rain-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

const resumeBtn = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /하던 게임 이어하기/ });
/** 시드한 물방울만 보이게: 새 물방울은 한참 뒤에 */
const QUIET = { spawnIn: 999_999, nextId: 5000 };

test('메뉴: 모드 9가지, 빠르기 3가지 → 시작 전에는 비가 내리지 않는다', async ({ page }) => {
  await page.goto(RAIN);
  const modes = page.getByRole('radiogroup', { name: '모드 고르기' }).getByRole('radio');
  await expect(modes).toHaveCount(9);
  await expect(page.getByRole('radio', { name: '숫자 보기' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: '구구단' }).click();
  await expect(page.getByRole('radio', { name: '구구단' })).toHaveAttribute('aria-checked', 'true');
  for (const sp of ['느리게', '보통', '빠르게']) await expect(page.getByRole('button', { name: `${sp} 시작` })).toBeVisible();

  await openRain(page);
  await page.waitForTimeout(1500);
  await expect(drops(page)).toHaveCount(0);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(drops(page).first()).toBeAttached({ timeout: 3000 });
});

test('물방울의 답을 누르면 펑! 터지고 점수가 오른다', async ({ page }) => {
  await startRain(page);
  await popOne(page);
  expect(await score(page)).toBe(1);
  await popOne(page);
  expect(await score(page)).toBe(2);
});

test('없는 숫자를 누르면 아무것도 안 터지고 입력이 비워진다', async ({ page }) => {
  await startRain(page);
  await seedRain(page, { drops: [drop(3)], ...QUIET });
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await rainKey(page, '7').click();
  await expect(drops(page)).toHaveCount(1);
  await expect(page.locator('[data-input]')).toHaveText('?');
  expect(await score(page)).toBe(0);
  await rainKey(page, '3').click();
  await expect(drops(page)).toHaveCount(0);
});

test('💣 폭탄을 맞히면 화면의 물방울이 모두 터지고 그만큼 점수', async ({ page }) => {
  await startRain(page);
  await seedRain(page, { drops: [drop(1), drop(2, { x: 0.375 }), drop(5, { x: 0.625, y: 0.2 }), drop(8, { kind: 'bomb', x: 0.875 })], ...QUIET });
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await expect(page.getByRole('img', { name: '폭탄 물방울 8' })).toBeVisible();
  await rainKey(page, '8').click();
  await expect(drops(page)).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('펑! 3개 한꺼번에');
  expect(await score(page)).toBe(4);
});

test('💖 하트는 목숨 하나 더, ❄️ 얼음은 천천히', async ({ page }) => {
  await startRain(page);
  await seedRain(page, { drops: [drop(4, { kind: 'heart' }), drop(6, { kind: 'ice', x: 0.625 })], lives: 3, ...QUIET });
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await expect(page.getByLabel('목숨 3개')).toBeVisible();
  await rainKey(page, '4').click();
  await expect(page.getByLabel('목숨 4개')).toBeVisible();
  await rainKey(page, '6').click();
  await expect(page.getByRole('status')).toContainText('꽁꽁');
});

test('두 자리 답: 다 누르면 터지고, 3과 34가 같이 있으면 3은 ✔로', async ({ page }) => {
  await startRain(page, '두 자리 계산');
  await seedRain(page, { drops: [drop(3), drop(34, { x: 0.625 }), drop(57, { x: 0.875 })], ...QUIET });
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await rainKey(page, '5').click();
  await expect(page.locator('[data-input]')).toHaveText('5');
  await rainKey(page, '7').click();
  await expect(drops(page)).toHaveCount(2);
  await rainKey(page, '3').click();
  await expect(drops(page)).toHaveCount(2); // 34일 수도 있으니 기다린다
  await rainKey(page, '확인').click();
  await expect(drops(page)).toHaveCount(1);
  await expect(drops(page).first()).toHaveAttribute('data-answer', '34');
  await typeAnswer(page, 34);
  await expect(drops(page)).toHaveCount(0);
});

test('모드마다 물방울 모습: 개수 세기는 그림, 자릿수는 10이 몇 개', async ({ page }) => {
  await startRain(page, '개수 세기');
  await expect(page.getByRole('img', { name: /물방울 .+ \d개$/ }).first()).toBeAttached({ timeout: 4000 });
  await popOne(page);
  await seedRain(page, { mode: 'place', drops: [drop(34, { q: { face: { t: 'lines', lines: ['10이 3개', '1이 4개'] }, answer: 34 } })], ...QUIET });
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await expect(page.getByRole('img', { name: '물방울 10이 3개, 1이 4개' })).toBeVisible();
  await typeAnswer(page, 34);
  await expect(drops(page)).toHaveCount(0);
});

test('땅에 닿으면 목숨이 줄고, 다 잃으면 결과 창 → 기록 → 한 판 더', async ({ page }) => {
  await page.clock.install();
  await startRain(page, '숫자 보기', '빠르게');
  await popOne(page);
  await page.clock.runFor(8_000);
  await expect(page.getByLabel(/목숨 [0-4]개/)).toBeVisible();
  await page.clock.runFor(60_000);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('1점이야');
  await expect(dialog).toContainText('첫 기록');
  const s = await rainSaved(page);
  expect(s.records['digit:fast']).toMatchObject({ plays: 1, best: 1 });
  await dialog.getByRole('button', { name: '한 판 더!' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
  await expect(page.getByLabel('목숨 5개')).toBeVisible();

  await page.goto(`${RAIN}/records`);
  await expect(page.getByText('내 최고 기록')).toBeVisible();
  await expect(page.getByText('1점').first()).toBeVisible();
});

test('그만하기 → 다시 들어오면 메뉴, 이어하기는 바로 진행', async ({ page }) => {
  await startRain(page);
  await popOne(page);
  await page.getByRole('link', { name: '홈으로' }).click();
  await page.getByRole('button', { name: '그만하기' }).click();
  await page.getByRole('link', { name: /숫자 비/ }).click();
  await expect(page.getByRole('radiogroup', { name: '모드 고르기' })).toBeVisible();
  await resumeBtn(page).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  expect(await score(page)).toBe(1);
  await popOne(page);
});

test('메뉴에서 다른 빠르기를 고르면 하던 판을 버릴지 묻는다', async ({ page }) => {
  await startRain(page);
  await popOne(page);
  await page.getByRole('button', { name: /숫자 보기, 느리게, 바꾸기/ }).click();
  await page.getByRole('button', { name: '보통 시작' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('새 게임을 시작할까?');
  await dialog.getByRole('button', { name: '하던 게임 이어하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  expect(await score(page)).toBe(1);
});

test('새로고침 → 멈춘 상태, 물방울이 그대로 → 계속하기', async ({ page }) => {
  await startRain(page);
  await popOne(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  expect(await score(page)).toBe(1);
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await popOne(page);
});

test('멈추면 비도 멈추고 패드가 잠긴다', async ({ page }) => {
  await startRain(page);
  await seedRain(page, { drops: [drop(3, { y: 0.3 })], ...QUIET });
  await page.waitForTimeout(800);
  const y = (await rainSaved(page)).saved!.drops[0].y;
  expect(y).toBeCloseTo(0.3, 3);
  await expect(rainKey(page, '3')).toBeVisible();
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: '잠깐 멈추기' }).click();
  expect((await rainSaved(page)).saved!.drops[0].y).toBeGreaterThan(0.3);
});

test('배경 음악 버튼: 끄고 켜기가 기억된다', async ({ page }) => {
  await startRain(page);
  const btn = page.getByRole('button', { name: '배경 음악' });
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: '배경 음악' })).toHaveAttribute('aria-pressed', 'false');
});

test('키보드로 답 입력', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await startRain(page);
  await expect(drops(page).first()).toBeAttached({ timeout: 4000 });
  const a = await drops(page).first().getAttribute('data-answer');
  await page.keyboard.type(a!);
  await expect.poll(() => score(page)).toBe(1);
});
