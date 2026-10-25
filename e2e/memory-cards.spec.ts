import { expect, test } from '@playwright/test';
import { timerText } from './helpers';
import { cards, matchAll, matchPair, memState, missPair, openMemory, startMemory } from './memory-helpers';

const resumeBtn = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /하던 게임 이어하기/ });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('시작 전엔 카드가 가려지고 시간이 안 간다 → 시작하면 잠깐 다 보여 주고 뒤집는다', async ({ page }) => {
  await openMemory(page, { level: 'easy' });
  await expect(cards(page)).toHaveCount(12);
  await page.waitForTimeout(1000);
  expect(await timerText(page)).toBe('0:00');
  await expect(cards(page).first()).toBeDisabled();

  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  // 미리 보기: 모든 카드 앞면 (이름이 보임)
  await expect(page.getByText('잘 기억해 둬!')).toBeVisible();
  await expect(cards(page).first()).toHaveAttribute('aria-label', /^카드 1: /);
  // 미리 보기가 끝나면 다시 뒷면, 그때부터 시간이 흐른다
  await expect(cards(page).first()).toHaveAttribute('aria-label', '카드 1', { timeout: 6000 });
  expect(await timerText(page)).toBe('0:00');
  await expect.poll(() => timerText(page), { timeout: 4000 }).not.toBe('0:00');
});

test('짝을 찾으면 열린 채로 이름이 보이고, 틀리면 잠깐 보였다가 닫힌다', async ({ page }) => {
  await startMemory(page, { level: 'easy' });
  const { i, name } = await matchPair(page);
  await expect(cards(page).nth(i)).toHaveAttribute('aria-label', `${name} 짝 찾음`);
  await expect(cards(page).nth(i)).toContainText(name);
  await expect(page.getByLabel('찾은 짝 1개, 모두 6개')).toBeVisible();

  const miss = await missPair(page);
  await expect(cards(page).nth(miss.j)).toHaveAttribute('aria-label', /^카드 \d+: /);
  await expect(cards(page).nth(miss.i)).toHaveAttribute('aria-label', `카드 ${miss.i + 1}`, { timeout: 3000 });
  await expect(cards(page).nth(miss.j)).toHaveAttribute('aria-label', `카드 ${miss.j + 1}`);
  expect((await memState(page)).session).toMatchObject({ found: 1, misses: 1, moves: 2 });
});

test('그림과 글자: 짝의 한 장은 이름 글자 카드', async ({ page }) => {
  await startMemory(page, { theme: '과일', rule: '그림과 글자', level: 'tiny' });
  const s = (await memState(page)).session!;
  const w = s.cards.findIndex((c) => c.face === 'word');
  await cards(page).nth(w).click();
  await expect(cards(page).nth(w)).toHaveAttribute('aria-label', `카드 ${w + 1}: 글자 ${s.cards[w].name}`);
  await expect(cards(page).nth(w)).toContainText(s.cards[w].name);
});

test('모두 찾기 → 결과·첫 기록 → 기록 화면 → 뒤로 메뉴 (이어하기 없음)', async ({ page }) => {
  await startMemory(page, { level: 'tiny' });
  await matchAll(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('짝꿍을 다 찾았어');
  await expect(dialog).toContainText('첫 기록');
  await expect(dialog).toContainText('3/3');
  expect((await memState(page)).records['tiny:same']).toMatchObject({ plays: 1 });

  await dialog.getByRole('link', { name: /기록 보기/ }).click();
  await expect(page.getByText('내 최고 기록')).toBeVisible();
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page.getByRole('radiogroup', { name: '카드 그림' })).toBeVisible();
  await expect(resumeBtn(page)).toBeHidden();
});

test('한 판 더: 같은 설정으로 새 카드, 시작 전 화면', async ({ page }) => {
  await startMemory(page, { level: 'tiny' });
  await matchAll(page);
  await page.getByRole('button', { name: '한 판 더!' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
  expect((await memState(page)).session).toMatchObject({ status: 'ready', found: 0 });
});

test('그만하기 → 다시 들어오면 메뉴, 이어하기는 바로 진행', async ({ page }) => {
  await startMemory(page, { level: 'easy' });
  await matchPair(page);
  await page.getByRole('link', { name: '홈으로' }).click();
  await page.getByRole('button', { name: '그만하기' }).click();
  await page.getByRole('link', { name: /짝꿍 카드/ }).click();
  await expect(page.getByRole('radiogroup', { name: '카드 그림' })).toBeVisible();
  await resumeBtn(page).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  await expect(page.getByLabel('찾은 짝 1개, 모두 6개')).toBeVisible();
  await matchPair(page);
});

test('새로고침 → 멈춘 상태(카드 가림), 계속하기', async ({ page }) => {
  await startMemory(page, { level: 'easy' });
  await matchPair(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  await expect(cards(page).first()).toBeDisabled();
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await matchPair(page);
});

test('멈추면 시간이 멈추고 카드를 못 뒤집는다', async ({ page }) => {
  await startMemory(page, { level: 'easy' });
  await page.getByRole('button', { name: '잠깐 멈추기' }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  const t = await timerText(page);
  await page.waitForTimeout(1200);
  expect(await timerText(page)).toBe(t);
});

test('진행 중에 다른 단계를 고르면 묻는다', async ({ page }) => {
  await startMemory(page, { level: 'easy' });
  await matchPair(page);
  await page.getByRole('button', { name: /바꾸기$/ }).click();
  await page.getByRole('button', { name: /^중간 8쌍/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('새 게임을 시작할까?');
  await dialog.getByRole('button', { name: '하던 게임 이어하기' }).click();
  await expect(page.getByLabel('찾은 짝 1개, 모두 6개')).toBeVisible();
  await page.getByRole('button', { name: /바꾸기$/ }).click();
  await page.getByRole('button', { name: /^중간 8쌍/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '취소하고 새로 시작' }).click();
  await expect(cards(page)).toHaveCount(16);
});
