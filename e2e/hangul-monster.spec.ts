import { expect, test } from '@playwright/test';
import { battle, dialog, findWild, finishDialog, MONSTER, monState, playerAt, seedMonster, skipBeats, stepDir, tapTile, useMove, winBattle } from './monster-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('처음 시작: 이야기 → 연구소에서 첫 친구 고르기 → 박사님 안내', async ({ page }) => {
  await page.goto(MONSTER);
  await expect(page.getByText('풀숲을 걸으며 한글 몬스터를 만나고')).toBeVisible();
  await page.getByRole('button', { name: '▶ 모험 시작' }).click();
  await expect(dialog(page)).toContainText('한글 나라');
  await finishDialog(page);
  // 연구소는 바로 위 칸
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('한글 박사');
  await finishDialog(page);
  const pick = page.getByRole('dialog', { name: '첫 친구를 골라 줘!' });
  await expect(pick.getByRole('button', { name: /고르기$/ })).toHaveCount(3);
  await pick.getByRole('button', { name: '기역몬 고르기' }).click();
  await expect(dialog(page)).toContainText('기역몬과 함께라면');
  await finishDialog(page);
  await expect(page.getByLabel('맨 앞 친구 기역몬')).toBeVisible();
  const s = await monState(page);
  expect(s.party).toHaveLength(1);
  expect(s.party[0]).toMatchObject({ sp: 'giyeok', lv: 5 });
  expect(s.caught).toEqual(['giyeok']);
});

test('친구가 없으면 졸개가 박사님께 먼저 가 보라고 한다', async ({ page }) => {
  await seedMonster(page, { party: [], x: 9, y: 2 });
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('박사님 연구소에 먼저');
  await finishDialog(page);
  await expect(battle(page)).toBeHidden();
});

test('누른 칸까지 걸어가고, 방향 버튼으로도 움직인다', async ({ page }) => {
  await seedMonster(page);
  await tapTile(page, 8, 4);
  await expect.poll(() => playerAt(page)).toBe('8,4');
  await stepDir(page, '아래로');
  await expect.poll(() => playerAt(page)).toBe('8,5');
  // 나무는 못 지나간다
  await tapTile(page, 2, 5);
  await expect.poll(() => playerAt(page)).toBe('2,5');
  await stepDir(page, '왼쪽으로');
  await expect.poll(() => playerAt(page)).toBe('2,5');
  await page.reload();
  await expect.poll(() => playerAt(page)).toBe('2,5');
});

test('뒤죽박죽단 졸개와 배틀: 문제를 맞혀 공격 → 이기면 코인, 졸개는 사라진다', async ({ page }) => {
  await seedMonster(page, { x: 9, y: 2 });
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('뒤죽박죽단');
  await finishDialog(page);
  await expect(battle(page)).toBeVisible();
  await expect(battle(page)).toContainText('승부를 걸어왔다');
  await skipBeats(page);
  // 기술 고르기 → 문제
  await page.getByRole('button', { name: '⚔️ 싸우기' }).click();
  await expect(page.getByRole('button', { name: '자음 펀치' })).toBeVisible();
  await page.getByRole('button', { name: '자음 펀치' }).click();
  await expect(page.getByText('자음 펀치를 쓰려면')).toBeVisible();
  await page.getByRole('group', { name: '보기' }).locator('[data-correct]').click();
  await winBattle(page);
  await expect(dialog(page)).toContainText('졌다');
  await finishDialog(page);
  const s = await monState(page);
  expect(s.defeated).toContain('grunt0');
  expect(s.coins).toBeGreaterThan(100);
  expect(s.party[0].xp + (s.party[0].lv - 5) * 100).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: '뒤죽박죽단 졸개' })).toBeHidden();
  // 길이 열려서 자음 숲으로
  await stepDir(page, '위로');
  await stepDir(page, '위로');
  await expect(page.getByRole('status')).toContainText('자음 숲');
  expect((await monState(page)).map).toBe('forest');
});

test('틀리면 빗나가고 정답을 알려 준다', async ({ page }) => {
  await seedMonster(page, { x: 9, y: 2 });
  await stepDir(page, '위로');
  await finishDialog(page);
  await skipBeats(page);
  await useMove(page, false);
  await expect(page.getByRole('status').filter({ hasText: '정답은' })).toBeVisible();
  await expect(battle(page)).toContainText('빗나갔다', { timeout: 4000 });
});

test('수풀에서 야생 몬스터 → 한글볼로 잡으면 친구·도감에', async ({ page }) => {
  await seedMonster(page, { map: 'forest', x: 3, y: 12, party: [['giga', 30]], items: { ball: 30, potion: 0, bigPotion: 0 } });
  for (let i = 0; i < 120 && !(await battle(page).isVisible()); i++) await stepDir(page, i % 2 ? '오른쪽으로' : '왼쪽으로', { mayStartBattle: true });
  await expect(battle(page)).toBeVisible();
  await skipBeats(page);
  for (let i = 0; i < 25; i++) {
    if (!(await battle(page).isVisible())) break;
    await skipBeats(page);
    if (!(await battle(page).isVisible())) break;
    await page.getByRole('button', { name: '🎒 가방' }).click();
    await page.getByRole('button', { name: '한글볼 던지기' }).click();
  }
  await expect(dialog(page)).toContainText('친구가 됐어요');
  await finishDialog(page);
  const s = await monState(page);
  expect(s.party).toHaveLength(2);
  expect(s.caught).toHaveLength(1);
  expect(s.seen).toContain(s.party[1].sp);

  await page.getByRole('button', { name: /메뉴/ }).click();
  await expect(page.getByRole('tab', { name: '🐾 친구들' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '📖 도감' }).click();
  await expect(page.getByText(/잡은 몬스터 1/)).toBeVisible();
});

test('친구들이 모두 쓰러지면 몬스터 센터에서 깨어난다', async ({ page }) => {
  await seedMonster(page, { x: 9, y: 2, party: [['giyeok', 2, 1]], lastHeal: { map: 'town', x: 13, y: 4 } } as never);
  await stepDir(page, '위로');
  await finishDialog(page);
  for (let i = 0; i < 10 && (await battle(page).isVisible()); i++) {
    await skipBeats(page);
    if (await page.getByRole('button', { name: '⚔️ 싸우기' }).isVisible()) await useMove(page, false);
  }
  await expect(dialog(page)).toContainText('몬스터 센터');
  await finishDialog(page);
  const s = await monState(page);
  expect([s.map, s.x, s.y]).toEqual(['town', 13, 4]);
  expect(s.party[0].hp).toBeGreaterThan(1);
  expect(s.defeated).not.toContain('grunt0');
});

test('체육관 관장을 이기면 배지, 숲 지기가 길을 비켜 준다', async ({ page }) => {
  await seedMonster(page, { map: 'forest', x: 5, y: 4, party: [['giga', 30]], defeated: ['grunt0'] });
  await expect(page.getByRole('button', { name: '숲 지기' })).toBeVisible();
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('자음 관장');
  await finishDialog(page);
  await winBattle(page, 2);
  await expect(dialog(page)).toContainText('자음 배지');
  await finishDialog(page);
  expect((await monState(page)).badges).toBe(1);
  await expect(page.getByRole('button', { name: '숲 지기' })).toBeHidden();
  await page.getByRole('button', { name: /메뉴/ }).click();
  await page.getByRole('tab', { name: '🏅 배지' }).click();
  await expect(page.getByLabel('자음 배지')).toBeVisible();
});

test('상점에서 한글볼 사기 (코인이 모자라면 못 삼)', async ({ page }) => {
  await seedMonster(page, { x: 8, y: 8, coins: 40 });
  await stepDir(page, '위로');
  const shop = page.getByRole('dialog', { name: '🏬 상점' });
  await expect(shop).toBeVisible();
  await shop.getByRole('button', { name: '한글볼 사기' }).click();
  await expect(shop.getByLabel('코인 10개')).toBeVisible();
  await expect(shop.getByRole('button', { name: '한글볼 사기' })).toBeDisabled();
  await shop.getByRole('button', { name: '다 샀어요' }).click();
  const s = await monState(page);
  expect(s.items.ball).toBe(6);
  expect(s.coins).toBe(10);
});

test('몬스터 센터에서 쉬면 체력이 다 찬다', async ({ page }) => {
  await seedMonster(page, { x: 12, y: 8, party: [['giyeok', 5, 3]] });
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('기운을 차렸어요');
  await finishDialog(page);
  expect((await monState(page)).party[0].hp).toBe(34);
});

test('배틀 중에 나가면 묻고, 그만하면 배틀은 없던 일로', async ({ page }) => {
  await seedMonster(page, { x: 9, y: 2 });
  await stepDir(page, '위로');
  await finishDialog(page);
  await expect(battle(page)).toBeVisible();
  await page.getByRole('link', { name: '홈으로' }).click();
  await page.getByRole('button', { name: '그만하기' }).click();
  await page.getByRole('link', { name: /한글 몬스터/ }).click();
  await expect(page.locator('[data-world]')).toBeVisible();
  await expect(battle(page)).toBeHidden();
  expect((await monState(page)).defeated).toEqual([]);
});

test('메뉴: 친구 순서 바꾸기, 처음부터 다시 하기는 한 번 더 묻는다', async ({ page }) => {
  await seedMonster(page, { party: [['giyeok', 5], ['aya', 6]] });
  await page.getByRole('button', { name: /메뉴/ }).click();
  await page.getByRole('button', { name: '맨 앞으로' }).click();
  expect((await monState(page)).party[0].sp).toBe('aya');
  await page.getByRole('tab', { name: '🏅 배지' }).click();
  await page.getByRole('button', { name: '처음부터 다시 하기' }).click();
  await page.getByRole('button', { name: '계속 모험하기' }).click();
  expect((await monState(page)).party).toHaveLength(2);
  await page.getByRole('button', { name: '처음부터 다시 하기' }).click();
  await page.getByRole('button', { name: '처음부터 하기' }).click();
  expect((await monState(page)).party).toHaveLength(0);
  await expect(dialog(page)).toContainText('한글 나라');
});

test('배경 음악 버튼: 끄고 켜기가 기억된다', async ({ page }) => {
  await seedMonster(page, { music: true });
  const btn = page.getByRole('button', { name: '배경 음악' });
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: '배경 음악' })).toHaveAttribute('aria-pressed', 'false');
});

test('키보드 화살표로 걷기', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await seedMonster(page);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => playerAt(page)).toBe('4,5');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => playerAt(page)).toBe('5,5');
});

test('🗺️ 전체 지도: 지금 있는 곳, 다음 목표, 잠긴 지역', async ({ page }) => {
  await seedMonster(page, { map: 'forest', x: 9, y: 10, defeated: ['grunt0'] });
  await expect(page.getByRole('button', { name: /다음 목표: 자음 숲 체육관/ })).toBeVisible();
  await page.getByRole('button', { name: '전체 지도', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '🗺️ 한글 나라 지도' });
  await expect(sheet.getByRole('status')).toContainText('자음 관장 불꽃');
  await expect(sheet.getByLabel('자음 숲, 지금 여기, 다음 목표')).toBeVisible();
  await expect(sheet.getByLabel('뒤죽박죽 성, 아직 못 감')).toBeVisible();
  await expect(sheet.getByLabel('내 위치')).toBeVisible();
  await expect(sheet.getByLabel('목표', { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: '닫기' }).click();
  await expect(sheet).toBeHidden();
});

test('🧩 스도쿠 상자: 퍼즐을 다 풀면 상자가 열리고 선물', async ({ page }) => {
  await seedMonster(page, { map: 'forest', x: 3, y: 6, defeated: ['grunt0'] });
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('스도쿠 상자');
  await finishDialog(page);
  const grid = page.getByRole('grid', { name: '스도쿠 판' });
  await expect(grid).toBeVisible();
  // 틀린 숫자는 들어가지 않는다
  const empty = grid.getByRole('gridcell', { name: /빈칸$/ });
  const first = empty.first();
  const ans = Number(await first.getAttribute('data-answer'));
  await first.click();
  await page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: String((ans % 4) + 1), exact: true }).click();
  await expect(first).toHaveAccessibleName(/빈칸$/);
  while ((await empty.count()) > 0) {
    const c = empty.first();
    const a = await c.getAttribute('data-answer');
    await c.click();
    await page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: a!, exact: true }).click();
  }
  await page.getByRole('button', { name: '🎁 선물 받기' }).click();
  await expect(dialog(page)).toContainText('상자가 열렸다');
  await finishDialog(page);
  const s = await monState(page);
  expect(s.picked).toContain('forest-box');
  expect(s.items.ball).toBe(8);
  await expect(page.getByRole('button', { name: '스도쿠 상자' })).toBeHidden();
});

test('☔ 숫자 비 꼬마: 떨어지는 숫자를 터뜨리고, 끝나면 코인', async ({ page }) => {
  await page.clock.install();
  await seedMonster(page, { map: 'forest', x: 11, y: 15, defeated: ['grunt0'] });
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('숫자 비');
  await finishDialog(page);
  await page.getByRole('button', { name: '▶ 시작' }).click();
  await page.clock.runFor(2000);
  const drop = page.locator('[data-rain] [data-answer]').first();
  await expect(drop).toBeAttached();
  const a = await drop.getAttribute('data-answer');
  await page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: a!, exact: true }).click();
  await expect(page.getByLabel('점수 1점')).toBeVisible();
  await page.clock.runFor(50_000);
  await page.getByRole('button', { name: '🎁 코인 받기' }).click();
  await expect(dialog(page)).toContainText('터뜨렸구나');
  await finishDialog(page);
  expect((await monState(page)).coins).toBeGreaterThanOrEqual(103);
});

test('⚡ 빠른 계산 대결: 10문제를 풀면 시간에 따라 코인', async ({ page }) => {
  await seedMonster(page, { map: 'beach', x: 7, y: 5, defeated: ['grunt0'], badges: 1 });
  await stepDir(page, '위로');
  await expect(dialog(page)).toContainText('10문제');
  await finishDialog(page);
  await page.getByRole('button', { name: '▶ 시작' }).click();
  const pad = page.getByRole('group', { name: '숫자 패드' });
  for (let i = 0; i < 10; i++) {
    const p = page.locator('[data-answer]').first();
    const a = (await p.getAttribute('data-answer'))!;
    for (const d of a) await pad.getByRole('button', { name: d, exact: true }).click();
    if (i < 9) await expect(page.getByText(`📝 ${i + 2} / 10`)).toBeVisible();
  }
  await page.getByRole('button', { name: '🎁 코인 받기' }).click();
  await expect(dialog(page)).toContainText('10문제를');
  await finishDialog(page);
  const s = await monState(page);
  expect(s.coins).toBeGreaterThan(100);
  expect(s.items.ball).toBe(10);
});

test('숫자 몬스터의 기술은 숫자 문제, 모음 몬스터는 글자 짓기 기술도 쓴다', async ({ page }) => {
  await seedMonster(page, { map: 'mountain', x: 3, y: 9, party: [['hana', 22], ['aya', 18]], defeated: ['grunt0'], badges: 4 });
  await findWild(page);
  await page.getByRole('button', { name: '⚔️ 싸우기' }).click();
  await expect(page.getByRole('button', { name: '하나둘 번개' })).toBeVisible();
  await page.getByRole('button', { name: '자릿수 썬더' }).click();
  await expect(page.getByText('자릿수 썬더를 쓰려면')).toBeVisible();
  await expect(page.getByText(/얼마일까|숫자로 쓰면/)).toBeVisible();
  // 이어서 모음 몬스터로 바꿔 글자 짓기
  await page.getByRole('group', { name: '보기' }).locator('[data-correct]').click();
  for (let i = 0; i < 5 && (await battle(page).isVisible()); i++) {
    await skipBeats(page);
    if (!(await battle(page).isVisible())) break;
    if (await page.getByRole('button', { name: '아야몽 내보내기' }).isVisible()) break;
    await page.getByRole('button', { name: '🔄 친구' }).click();
    await page.getByRole('button', { name: '아야몽 내보내기' }).click();
    await skipBeats(page);
    break;
  }
  if (await battle(page).isVisible()) {
    await useMove(page, true, '글자 짓기 물보라');
    await expect(page.getByText('글자 짓기 물보라를 쓰려면')).toBeHidden({ timeout: 4000 });
  }
});
