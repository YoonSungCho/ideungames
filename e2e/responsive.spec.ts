import { expect, test } from '@playwright/test';
import { expectFitsViewport, openNewGame, placeOneCorrect, solveAll } from './helpers';
import { answerCurrent, openMath } from './math-helpers';
import { GAME, seed, skipStory, solveCurrent } from './hero-helpers';
import { drop, openRain, popOne, seedRain } from './rain-helpers';

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

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`한글 용사 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await seed(page, { cleared: 2, staged: true, prologueSeen: false });
    await page.goto(GAME);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-hero-story.png`) });
    await skipStory(page);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-hero-map.png`) });

    // 문제 유형별 화면 (보기·글자 짓기·문장 순서)
    for (const [regionId, stage] of [['consonant', 0], ['castle', 1], ['sky', 1], ['forest', 0], ['opposite', 0], ['opposite', 1], ['forest', 2]] as const) {
      await seed(page, { cleared: 6 });
      await page.goto(`${GAME}/${regionId}`);
      await page.evaluate(([r]) => {
        const k = 'ideun.hangul-hero';
        const d = JSON.parse(localStorage.getItem(k)!);
        d.state.progress[r] = { stars: [3, 3, 3], bossCleared: false, introSeen: true };
        localStorage.setItem(k, JSON.stringify(d));
      }, [regionId]);
      await page.reload();
      await expectFitsViewport(page);
      await page.getByRole('button', { name: new RegExp(`^${stage + 1}단계`) }).click();
      await page.getByRole('button', { name: '▶ 시작하기' }).click();
      await solveCurrent(page);
      await expectFitsViewport(page);
      await page.screenshot({ path: info.outputPath(`${name}-hero-${regionId}${stage}.png`) });
    }

    // 보스전
    await seed(page, { staged: true });
    await page.goto(`${GAME}/consonant`);
    await page.getByRole('button', { name: /^보스전/ }).click();
    await skipStory(page);
    await page.getByRole('button', { name: '▶ 시작하기' }).click();
    await solveCurrent(page);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-hero-boss.png`) });

    await page.goto(`${GAME}/book`);
    await expectFitsViewport(page);
  });
}

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`숫자 비 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.goto('./#/games/number-rain');
    await expect(page.getByRole('radiogroup', { name: '모드 고르기' })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-rain-menu.png`) });

    await openRain(page, '두 자리 계산');
    await page.getByRole('button', { name: '▶ 시작하기' }).click();
    await popOne(page);
    // 여러 모습의 물방울을 한 화면에 (보통·폭탄·얼음·하트·그림·두 줄)
    await seedRain(page, {
      spawnIn: 999_999, nextId: 5000, lives: 2, score: 12, combo: 4,
      drops: [
        drop(57, { q: { face: { t: 'text', text: '45 + 12' }, answer: 57 }, x: 0.125, y: 0.85 }),
        drop(8, { q: { face: { t: 'count', emoji: '🍎', n: 8 }, answer: 8 }, x: 0.375, y: 0.55 }),
        drop(34, { q: { face: { t: 'lines', lines: ['10이 3개', '1이 4개'] }, answer: 34 }, x: 0.625, y: 0.7 }),
        drop(96, { q: { face: { t: 'text', text: '구십육' }, answer: 96 }, kind: 'bomb', x: 0.875, y: 0.45 }),
        drop(21, { q: { face: { t: 'text', text: '3 × 7' }, answer: 21 }, kind: 'ice', x: 0.375, y: 0.18 }),
        drop(60, { q: { face: { t: 'text', text: '72 − 12' }, answer: 60 }, kind: 'heart', x: 0.875, y: 0.15 }),
      ],
    });
    await page.getByRole('button', { name: '▶ 계속하기' }).click();
    await page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: '5', exact: true }).click();
    await page.waitForTimeout(300); // 가림막 흐림이 걷히는 동안
    await expectFitsViewport(page);

    const field = (await page.locator('[data-field]').boundingBox())!;
    for (const d of await page.locator('[data-answer]').all()) {
      const b = (await d.boundingBox())!;
      // 물방울은 하늘 안에서 잘리지 않고, 옆 줄과 겹치지 않을 만큼 좁다
      expect(b.x, '물방울 왼쪽').toBeGreaterThanOrEqual(field.x - 1);
      expect(b.x + b.width, '물방울 오른쪽').toBeLessThanOrEqual(field.x + field.width + 1);
      expect(b.width, '물방울 폭').toBeLessThanOrEqual(field.width / 4 + 1);
      expect(b.height, '물방울 높이').toBeGreaterThanOrEqual(30);
    }
    const k = (await page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: '5', exact: true }).boundingBox())!;
    expect(Math.min(k.width, k.height), '패드 키 크기').toBeGreaterThanOrEqual(36);
    if (width > height && width >= 560) {
      expect(k.x, '패드는 하늘 오른쪽').toBeGreaterThan(field.x + field.width);
      expect(field.height, '가로 화면 하늘 높이').toBeGreaterThanOrEqual(height * 0.7);
    } else {
      // 세로: 하늘이 화면 대부분 (패드는 2줄로 낮게)
      expect(field.height, '세로 화면 하늘 높이').toBeGreaterThanOrEqual(height * 0.5);
    }
    await page.screenshot({ path: info.outputPath(`${name}-rain-play.png`) });

    await page.goto('./#/games/number-rain/records');
    await expect(page.getByRole('radiogroup', { name: '모드' })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-rain-records.png`) });
  });
}
