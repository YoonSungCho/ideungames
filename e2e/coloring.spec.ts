import { expect, test, type Page } from '@playwright/test';

async function art(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ideun.coloring') ?? '{}').state?.art ?? {}) as Promise<
    Record<string, { fills: Record<string, string>; strokes: unknown[]; done: boolean }>
  >;
}
const part = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^${name}(, 칠함)?$`) });
const tool = (page: Page, name: string) => page.getByRole('toolbar', { name: '도구' }).getByRole('button', { name, exact: true });
const color = (page: Page, name: string) => page.getByRole('radiogroup', { name: '색' }).getByRole('radio', { name, exact: true });

async function openPicture(page: Page, name: string) {
  await page.goto('./');
  await page.getByRole('link', { name: /색칠 놀이/ }).click();
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole('img', { name: `${name} 그림` })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('홈의 그리기 칸에 색칠 놀이, 도안 8개', async ({ page }) => {
  await page.getByRole('button', { name: '그리기' }).click();
  await page.getByRole('link', { name: /색칠 놀이/ }).click();
  await expect(page.getByText('어떤 그림을 칠해 볼까?')).toBeVisible();
  await expect(page.locator('a[href*="coloring/"]')).toHaveCount(8);
});

test('색을 고르고 누르면 칠해지고, 무늬도 된다. 되돌리기·지우개', async ({ page }) => {
  await openPicture(page, '고양이');
  await color(page, '파랑').click();
  await part(page, '머리').click();
  await expect(part(page, '머리')).toHaveAttribute('data-fill', '#4f6bff');
  await expect(page.getByLabel('고양이, 16곳 중 1곳 칠함')).toBeVisible();

  await page.getByRole('radio', { name: '물방울' }).click();
  await color(page, '분홍').click();
  await part(page, '코').click();
  await expect(part(page, '코')).toHaveAttribute('data-fill', 'dots:#ff5fa2');

  await tool(page, '되돌리기').click();
  await expect(part(page, '코')).toHaveAttribute('data-fill', '');
  await tool(page, '지우개').click();
  await expect(page.getByText('지울 곳을 눌러 봐!')).toBeVisible();
  await part(page, '머리').click();
  await expect(part(page, '머리')).toHaveAttribute('data-fill', '');
});

test('마법 붓으로 다 칠하면 완성 축하 → 도안 목록에 ✅', async ({ page }) => {
  await openPicture(page, '아이스크림');
  await tool(page, '마법 붓').click();
  const parts = page.locator('[data-part]');
  const n = await parts.count();
  for (let i = 0; i < n; i++) await parts.nth(i).dispatchEvent('click');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('멋진 아이스크림 완성');
  await dialog.getByRole('button', { name: '계속 꾸미기' }).click();
  await expect(dialog).toBeHidden();
  // 지웠다 다시 칠해도 축하는 한 번만
  await tool(page, '지우개').click();
  await part(page, '체리').click();
  await tool(page, '마법 붓').click();
  await part(page, '체리').click();
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page.getByRole('link', { name: '아이스크림, 완성' })).toBeVisible();
  await expect(page.getByText('다 칠한 그림 1/8')).toBeVisible();
});

test('붓으로 그리면 선이 남고, 처음부터는 묻고 지운다(되돌리기로 살림)', async ({ page }) => {
  await openPicture(page, '나비');
  await tool(page, '붓').click();
  await page.getByRole('radio', { name: '굵은 붓' }).click();
  const box = (await page.getByRole('img', { name: '나비 그림' }).boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.down();
  for (let k = 1; k <= 10; k++) await page.mouse.move(box.x + box.width * (0.2 + k * 0.05), box.y + box.height * (0.2 + k * 0.03));
  await page.mouse.up();
  await expect.poll(async () => (await art(page)).butterfly?.strokes.length).toBe(1);

  await tool(page, '처음부터').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('처음부터 다시 칠할까?');
  await dialog.getByRole('button', { name: '다 지우기' }).click();
  await expect.poll(async () => (await art(page)).butterfly?.strokes.length).toBe(0);
  await tool(page, '되돌리기').click();
  await expect.poll(async () => (await art(page)).butterfly?.strokes.length).toBe(1);
});

test('칠한 그림은 나갔다 와도, 새로고침해도 그대로', async ({ page }) => {
  await openPicture(page, '우리 집');
  await color(page, '노랑').click();
  await part(page, '지붕').click();
  await page.reload();
  await expect(part(page, '지붕')).toHaveAttribute('data-fill', '#ffd166');
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page.getByRole('link', { name: '우리 집, 15곳 중 1곳 칠함' })).toBeVisible();
});

test('📷 저장: 그림 파일이 내려받아진다', async ({ page }) => {
  await openPicture(page, '로켓');
  await tool(page, '마법 붓').click();
  await part(page, '창문').click();
  const download = page.waitForEvent('download');
  await tool(page, '그림 저장').click();
  expect((await download).suggestedFilename()).toBe('로켓 색칠.png');
});

test('무지개 붓은 누를 때마다 다른 색', async ({ page }) => {
  await openPicture(page, '물고기');
  await color(page, '무지개').click();
  await part(page, '꼬리').click();
  await part(page, '큰 물방울').click();
  const a = (await art(page)).fish.fills;
  expect(new Set(Object.values(a)).size).toBe(2);
});
