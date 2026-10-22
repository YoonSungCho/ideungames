import { expect, test } from '@playwright/test';
import { expectFitsViewport, openNewGame, placeOneCorrect, solveAll } from './helpers';

/** 실제 기기 크기 (브라우저 주소창이 차지한 높이 포함) */
const VIEWPORTS: Record<string, [number, number]> = {
  'fold-cover': [344, 882],
  'phone': [412, 915],
  'phone-browser': [412, 760],
  'small-phone': [360, 640],
  'fold-wide': [884, 720],
  'phone-land': [915, 412],
  'phone-land-browser': [844, 340],
  'small-land': [740, 360],
  'tablet': [820, 1180],
  'tablet-land': [1180, 820],
  'desktop': [1440, 900],
};

test.describe.configure({ mode: 'parallel' });
test.use({ hasTouch: true });

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-home.png`) });

    for (const size of [4, 6, 8] as const) {
      await openNewGame(page, size, size === 8 ? '어려움' : '쉬움');
      await expectFitsViewport(page);
      await page.getByRole('button', { name: '▶ 시작하기' }).click();
      await placeOneCorrect(page);
      await expectFitsViewport(page);
      const board = await page.getByRole('grid').boundingBox();
      const card = await page.getByRole('button', { name: /^숫자 1,/ }).boundingBox();
      // 보드 칸은 손가락으로 누를 만큼 (최소 30px), 카드는 최소 40px
      expect(board!.width / size, `보드 칸 ${board!.width / size}`).toBeGreaterThanOrEqual(30);
      expect(Math.min(card!.width, card!.height), '카드 크기').toBeGreaterThanOrEqual(40);
      await page.screenshot({ path: info.outputPath(`${name}-${size}.png`) });
      // 다음 크기는 새로 고르도록 진행 중인 게임을 비운다
      // (멈춰야 타이머가 저장소를 다시 쓰지 않는다)
      await page.getByRole('button', { name: '잠깐 멈추기' }).click();
      await page.evaluate(() => localStorage.removeItem('ideun.sudoku'));
      await page.reload();
    }

    await page.goto('./#/games/sudoku/records');
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-records.png`) });
  });
}

for (const [name, [width, height]] of Object.entries(VIEWPORTS).filter(([n]) => ['phone', 'small-phone', 'phone-land-browser', 'fold-wide', 'desktop'].includes(n))) {
  test(`클리어 창·기록 화면 ${name}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    for (let round = 0; round < 2; round++) {
      await openNewGame(page, 4);
      await page.getByRole('button', { name: '▶ 시작하기' }).click();
      await solveAll(page);
      await expect(page.getByRole('dialog')).toContainText('해냈어');
      await page.waitForTimeout(800); // 등장 애니메이션
      await expectFitsViewport(page);
      await page.screenshot({ path: info.outputPath(`${name}-win${round}.png`) });
    }
    await page.getByRole('dialog').getByRole('link', { name: /기록 보기/ }).click();
    await expect(page.getByText('내 최고 기록')).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-records-data.png`), fullPage: true });
  });
}
