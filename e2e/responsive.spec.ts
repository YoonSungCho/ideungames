import { expect, test } from '@playwright/test';
import { expectFitsViewport, openNewGame, placeOneCorrect, solveAll } from './helpers';
import { answerCurrent, openMath } from './math-helpers';

/** 실제 기기 크기 (브라우저 주소창이 차지한 높이 포함) */
const VIEWPORTS: Record<string, [number, number]> = {
  'fold-cover': [344, 882],
  'fold-wide-cover': [480, 760],
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

    for (const size of [4, 9] as const) {
      await openNewGame(page, size, size === 9 ? '어려움' : '쉬움');
      await expectFitsViewport(page);
      await page.getByRole('button', { name: '▶ 시작하기' }).click();
      await placeOneCorrect(page);
      await expectFitsViewport(page);
      const board = await page.getByRole('grid').boundingBox();
      const card = await page.getByRole('button', { name: /^숫자 1,/ }).boundingBox();
      // 보드 칸은 손가락으로 누를 만큼 (최소 30px), 카드는 최소 40px
      expect(board!.width / size, `보드 칸 ${board!.width / size}`).toBeGreaterThanOrEqual(30);
      expect(Math.min(card!.width, card!.height), '카드 크기').toBeGreaterThanOrEqual(40);
      if (width < height && height >= 760) {
        // 세로로 넉넉한 화면: 보드가 화면 폭을 꽉 채운다 (위쪽 줄이 보드를 줄이지 않음)
        expect(board!.width, '세로 화면 보드 폭').toBeGreaterThanOrEqual(Math.min(width - 40, 560));
      }
      if (width > height && width >= 560) {
        // 가로 화면: 숫자 카드는 보드 오른쪽 칸에
        expect(card!.x, '카드는 보드 오른쪽').toBeGreaterThan(board!.x + board!.width);
      }
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

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`빠른 계산 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.goto('./#/games/quick-math');
    await page.getByRole('button', { name: '곱셈', exact: true }).click();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-math-menu.png`) });

    await openMath(page, { ops: ['add', 'sub', 'mul'], difficulty: '어려움' });
    await expectFitsViewport(page);
    await page.getByRole('button', { name: '▶ 시작하기' }).click();
    for (let i = 0; i < 3; i++) {
      await answerCurrent(page);
      await expectFitsViewport(page);
      const stage = await page.locator('[data-stage]').boundingBox();
      const problem = await page.getByRole('status').boundingBox();
      // 식이 판 밖으로 넘치지 않고, 아이가 읽기 좋게 충분히 크다
      expect(problem!.width, '식 폭').toBeLessThanOrEqual(stage!.width + 1);
      expect(problem!.height, '식 높이').toBeGreaterThanOrEqual(48);
    }
    const k = await page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: '5', exact: true }).boundingBox();
    expect(Math.min(k!.width, k!.height), '패드 키 크기').toBeGreaterThanOrEqual(36);
    if (width > height && width >= 560) {
      const stage = await page.locator('[data-stage]').boundingBox();
      expect(k!.x, '패드는 문제 오른쪽').toBeGreaterThan(stage!.x + stage!.width);
    }
    await page.screenshot({ path: info.outputPath(`${name}-math-play.png`) });
  });
}
