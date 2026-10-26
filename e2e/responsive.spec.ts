import { expect, test } from '@playwright/test';
import { expectFitsViewport, openNewGame, placeOneCorrect, solveAll } from './helpers';
import { answerCurrent, openMath } from './math-helpers';
import { GAME, seed, skipStory, solveCurrent } from './hero-helpers';
import { drop, openRain, popOne, seedRain } from './rain-helpers';
import { battle, dialog, finishDialog, seedMonster, skipBeats, stepDir, tapTile } from './monster-helpers';
import { cards, matchAll, matchPair, missPair, openMemory, startMemory } from './memory-helpers';
import { joystick, mazeState, openMaze, press, route, walkToGoal } from './maze-helpers';
import { GAME as BUNNY, currentTask as bunnyTask, finishLesson as bunnyFinish, seedBunny, startLesson as bunnyStart } from './bunny-helpers';

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

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`한글 몬스터 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.goto('./#/games/hangul-monster');
    await expect(page.getByRole('button', { name: '▶ 모험 시작' })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-title.png`) });

    // 마을 + 대화
    await page.getByRole('button', { name: '▶ 모험 시작' }).click();
    await expect(dialog(page)).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-dialog.png`) });
    await finishDialog(page);
    await stepDir(page, '위로');
    await finishDialog(page);
    await page.waitForTimeout(500); // 창이 뜨는 애니메이션
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-starter.png`) });

    // 자음 숲 + 배틀
    await seedMonster(page, { map: 'forest', x: 9, y: 10, party: [['giyeok', 12], ['aya', 9], ['ssak', 7]], defeated: ['grunt0'] });
    await expectFitsViewport(page);
    const dkey = (await page.getByRole('button', { name: '위로', exact: true }).boundingBox())!;
    expect(Math.min(dkey.width, dkey.height), '방향 버튼 크기').toBeGreaterThanOrEqual(40);
    await page.screenshot({ path: info.outputPath(`${name}-mon-world.png`) });
    await page.goto('./#/games/hangul-monster');
    await seedMonster(page, { map: 'forest', x: 4, y: 9, party: [['giyeok', 12], ['aya', 9]], defeated: ['grunt0'] });
    await stepDir(page, '위로');
    await finishDialog(page);
    await expect(battle(page)).toBeVisible();
    await skipBeats(page);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-battle.png`) });
    await page.getByRole('button', { name: '⚔️ 싸우기' }).click();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-moves.png`) });
    await page.locator('[class*="moveBtn"]').nth(1).click();
    await expect(page.getByRole('group', { name: '보기' })).toBeVisible();
    await expectFitsViewport(page);
    const opt = (await page.getByRole('group', { name: '보기' }).getByRole('button').first().boundingBox())!;
    expect(Math.min(opt.width, opt.height), '보기 크기').toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: info.outputPath(`${name}-mon-question.png`) });
    await page.getByRole('group', { name: '보기' }).locator('[data-correct]').click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: info.outputPath(`${name}-mon-hit.png`) });

    // 메뉴 · 도감
    await page.goto('./#/games/hangul-monster');
    await seedMonster(page, { party: [['giga', 14], ['aya', 9], ['gom', 12]], seen: ['giyeok', 'giga', 'aya', 'gom', 'nieun'], caught: ['giyeok', 'giga', 'aya', 'gom'], badges: 2 });
    await page.getByRole('button', { name: /메뉴/ }).click();
    await page.waitForTimeout(500);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-party.png`) });
    await page.getByRole('tab', { name: '📖 도감' }).click();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-dex.png`) });

    // 전체 지도 · 새 지역 · 미니 게임
    await page.goto('./#/games/hangul-monster');
    await seedMonster(page, { map: 'mountain', x: 9, y: 9, party: [['beongae', 24], ['gugu', 25]], defeated: ['grunt0'], badges: 4 });
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-mountain.png`) });
    await page.getByRole('button', { name: '전체 지도', exact: true }).click();
    await page.waitForTimeout(500);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-worldmap.png`) });
    await page.goto('./#/games/hangul-monster');
    await seedMonster(page, { map: 'tower', x: 3, y: 13, party: [['gugu', 25]], defeated: ['grunt0'], badges: 5 });
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-tower.png`) });
    await page.goto('./#/games/hangul-monster');
    await seedMonster(page, { map: 'forest', x: 3, y: 6, defeated: ['grunt0'] });
    await stepDir(page, '위로');
    await finishDialog(page);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-sudoku.png`) });
    await page.getByRole('button', { name: '그만하기' }).click();
    await tapTile(page, 11, 15);
    await expect.poll(() => page.locator('[data-player]').getAttribute('data-player')).toBe('11,15');
    await stepDir(page, '위로');
    await finishDialog(page);
    await page.getByRole('button', { name: '▶ 시작' }).click();
    await page.waitForTimeout(2500);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-mon-rain.png`) });
  });
}

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`짝꿍 카드 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.goto('./#/games/memory-cards');
    await expect(page.getByRole('radiogroup', { name: '카드 그림' })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-memory-menu.png`) });

    for (const [level, rule] of [['hard', '그림과 글자'], ['easy', '같은 그림']] as const) {
      await openMemory(page, { level, rule, theme: level === 'hard' ? '탈것' : '바다' });
      await expectFitsViewport(page);
      await page.getByRole('button', { name: '▶ 시작하기' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: info.outputPath(`${name}-memory-peek-${level}.png`) });
      await expect(page.getByText('잘 기억해 둬!')).toBeHidden({ timeout: 6000 });
      await matchPair(page);
      await page.waitForTimeout(700);
      await expectFitsViewport(page);
      const box = await cards(page).first().boundingBox();
      // 카드는 손가락으로 누를 만큼 (24장일 때도)
      expect(Math.min(box!.width, box!.height), '카드 크기').toBeGreaterThanOrEqual(level === 'hard' ? 44 : 60);
      if (width > height && width >= 560) {
        const status = await page.getByLabel('걸린 시간').boundingBox();
        const last = await cards(page).last().boundingBox();
        expect(status!.x, '상태는 카드판 오른쪽').toBeGreaterThan(last!.x + last!.width);
      }
      await page.screenshot({ path: info.outputPath(`${name}-memory-${level}.png`) });
      if (level === 'easy') {
        await matchAll(page);
        await page.waitForTimeout(800);
        await expectFitsViewport(page);
        await page.screenshot({ path: info.outputPath(`${name}-memory-result.png`) });
      } else {
        await page.getByRole('button', { name: '잠깐 멈추기' }).click();
        await page.evaluate(() => localStorage.removeItem('ideun.memory-cards'));
      }
    }
    // 계산식 어려움 (24장, 식 글자가 카드 안에)
    await startMemory(page, { level: 'hard', rule: '계산식' });
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-memory-math.png`) });
    await page.getByRole('button', { name: '잠깐 멈추기' }).click();
    await page.evaluate(() => localStorage.removeItem('ideun.memory-cards'));
    // 대결: 위(상대, 거꾸로) · 카드판 · 아래(나)
    await startMemory(page, { level: 'medium', rival: '아빠' });
    await missPair(page);
    await expectFitsViewport(page);
    const top = (await page.getByLabel(/^아빠 \d+개/).boundingBox())!;
    const bottom = (await page.getByLabel(/^이든 \d+개/).boundingBox())!;
    const first = (await cards(page).first().boundingBox())!;
    const last = (await cards(page).last().boundingBox())!;
    expect(top.y + top.height, '상대 칸은 카드판 위').toBeLessThanOrEqual(first.y + 1);
    expect(bottom.y, '내 칸은 카드판 아래').toBeGreaterThanOrEqual(last.y + last.height - 1);
    expect(Math.min(first.width, first.height), '카드 크기').toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: info.outputPath(`${name}-memory-battle.png`) });
    await page.getByRole('button', { name: '잠깐 멈추기' }).first().click();
    await page.evaluate(() => localStorage.removeItem('ideun.memory-cards'));

    await page.goto('./#/games/memory-cards/records');
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-memory-records.png`) });
  });
}

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`미로 탈출 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.goto('./#/games/maze-escape');
    await expect(page.getByRole('radiogroup', { name: '친구 고르기' })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-maze-menu.png`) });

    for (const level of ['hard', 'easy'] as const) {
      await openMaze(page, { level, hero: level === 'hard' ? '꿀벌' : '강아지' });
      await expectFitsViewport(page);
      await page.screenshot({ path: info.outputPath(`${name}-maze-ready-${level}.png`) });
      await page.getByRole('button', { name: '▶ 시작하기' }).click();
      const s = (await mazeState(page)).session!;
      for (const d of route(s.maze, s.pos, s.maze.goal).slice(0, 4)) await press(page, d);
      await page.getByRole('button', { name: /^힌트/ }).click();
      await page.waitForTimeout(300);
      await expectFitsViewport(page);
      const board = await page.locator('[data-pos]').boundingBox();
      const btn = await joystick(page).boundingBox();
      // 미로 칸은 눈으로 길을 볼 만큼, 조이스틱은 엄지로 밀 만큼
      expect(board!.width / s.maze.w, '미로 칸 크기').toBeGreaterThanOrEqual(level === 'hard' ? 18 : 30);
      expect(Math.min(btn!.width, btn!.height), '조이스틱 크기').toBeGreaterThanOrEqual(100);
      if (width > height && width >= 560) expect(btn!.x, '조이스틱은 미로 오른쪽').toBeGreaterThan(board!.x + board!.width);
      else expect(btn!.y, '조이스틱은 미로 아래').toBeGreaterThan(board!.y + board!.height - 1);
      await page.screenshot({ path: info.outputPath(`${name}-maze-${level}.png`) });
      if (level === 'easy') {
        await walkToGoal(page);
        await page.waitForTimeout(800);
        await expectFitsViewport(page);
        await page.screenshot({ path: info.outputPath(`${name}-maze-result.png`) });
      } else {
        await page.getByRole('button', { name: '잠깐 멈추기' }).click();
        await page.evaluate(() => localStorage.removeItem('ideun.maze-escape'));
      }
    }
    await page.goto('./#/games/maze-escape/records');
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-maze-records.png`) });
  });
}

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`색칠 놀이 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.goto('./#/games/coloring');
    await expect(page.getByText('어떤 그림을 칠해 볼까?')).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-color-gallery.png`) });

    await page.goto('./#/games/coloring/house');
    await expect(page.getByRole('img', { name: '우리 집 그림' })).toBeVisible();
    const toolbar = page.getByRole('toolbar', { name: '도구' });
    await toolbar.getByRole('button', { name: '마법 붓', exact: true }).click();
    for (const part of ['지붕', '문', '해', '잔디']) await page.locator(`[aria-label^="${part}"][data-part]`).dispatchEvent('click');
    await toolbar.getByRole('button', { name: '칠하기', exact: true }).click();
    await page.getByRole('radio', { name: '줄무늬' }).click();
    await page.getByRole('radiogroup', { name: '색' }).getByRole('radio', { name: '보라', exact: true }).click();
    await page.locator('[aria-label^="벽"][data-part]').dispatchEvent('click');
    await expectFitsViewport(page);
    const canvas = await page.getByRole('img', { name: '우리 집 그림' }).boundingBox();
    const sw = await page.getByRole('radio', { name: '빨강', exact: true }).boundingBox();
    const tl = await toolbar.getByRole('button', { name: '붓', exact: true }).boundingBox();
    // 그림판은 크게, 색·도구는 손가락으로 누를 만큼
    expect(canvas!.width, '그림판 크기').toBeGreaterThanOrEqual(Math.min(width, height) * 0.5);
    expect(sw!.width, '색 크기').toBeGreaterThanOrEqual(26);
    expect(Math.min(tl!.width, tl!.height), '도구 크기').toBeGreaterThanOrEqual(38);
    if (width > height && width >= 560) expect(tl!.x, '도구는 그림판 오른쪽').toBeGreaterThan(canvas!.x + canvas!.width);
    await page.screenshot({ path: info.outputPath(`${name}-color-paint.png`) });

    await toolbar.getByRole('button', { name: '붓', exact: true }).click();
    await page.getByRole('radio', { name: '굵은 붓' }).click();
    // 지붕 선을 가로지르는 붓 그림 → 반쯤 지우개로 문지르기 (선은 그대로 보여야 함)
    const cv = page.getByRole('img', { name: '우리 집 그림' });
    const drag = async (x0: number, y0: number, x1: number, y1: number) => {
      const b = (await cv.boundingBox())!;
      await page.mouse.move(b.x + (x0 / 200) * b.width, b.y + (y0 / 200) * b.height);
      await page.mouse.down();
      for (let k = 1; k <= 8; k++) await page.mouse.move(b.x + ((x0 + ((x1 - x0) * k) / 8) / 200) * b.width, b.y + ((y0 + ((y1 - y0) * k) / 8) / 200) * b.height);
      await page.mouse.up();
    };
    await drag(30, 80, 170, 80);
    await toolbar.getByRole('button', { name: '지우개', exact: true }).click();
    await drag(100, 60, 100, 100);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-color-brush.png`) });

    await page.goto('./#/games/coloring/icecream');
    await toolbar.getByRole('button', { name: '마법 붓', exact: true }).click();
    const parts = page.locator('[data-part]');
    for (let i = 0, n = await parts.count(); i < n; i++) await parts.nth(i).dispatchEvent('click');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(700);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-color-done.png`) });
  });
}

for (const [name, [width, height]] of Object.entries(VIEWPORTS)) {
  test(`토리의 숫자 숲 화면 ${name} ${width}x${height}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', '뷰포트별 검사는 한 번만');
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await seedBunny(page, { seenAll: false });
    await page.goto(BUNNY);
    await expect(page.getByRole('dialog', { name: '처음 이야기' })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-bunny-story.png`) });

    await seedBunny(page, { cleared: 2, unlockAll: true });
    await page.goto(BUNNY);
    await expect(page.getByLabel(/잔치에 올 친구/)).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-bunny-map.png`) });
    await page.goto(`${BUNNY}/field`);
    await expect(page.getByRole('button', { name: /^1단계/ })).toBeVisible();
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-bunny-chapter.png`) });

    // 문제 종류별 화면: 세기·담기·접시 비교·깡충·도착·이야기(+/−)·수 비교·10 만들기·10과 몇·이야기 문제
    const kinds = [['field', 1], ['field', 2], ['acorn', 3], ['stream', 1], ['stream', 3], ['shop', 2], ['cheese', 2], ['flower', 2], ['nest', 1], ['train', 0], ['train', 2], ['hill', 3]] as const;
    for (const [c, l] of kinds) {
      await bunnyStart(page, c, l);
      const { t } = await bunnyTask(page);
      // 물건 하나 눌러 보기 (번호가 붙은 모습까지)
      if (t.kind === 'count' && t.tap) await page.getByRole('button', { name: /아직 안 셈/ }).first().click();
      if (t.kind === 'story') await page.getByRole('button', { name: /^(선물|토리의) / }).first().click();
      if (t.kind === 'hop') await page.getByRole('button', { name: '앞으로 깡충' }).click();
      await expectFitsViewport(page);
      const stage = (await page.locator('[data-task]').boundingBox())!;
      const line = page.getByRole('group', { name: '수 길' });
      if (await line.count()) {
        const stone = (await line.getByRole('button').or(line.locator('span').filter({ hasText: /^\d+$/ })).first().boundingBox())!;
        expect(stone.width, `돌 크기 ${c}${l}`).toBeGreaterThanOrEqual(width < 380 ? 26 : 28);
      }
      const opts = page.getByRole('group', { name: '보기' }).getByRole('button');
      if (await opts.count()) {
        const o = (await opts.first().boundingBox())!;
        expect(Math.min(o.width, o.height), `보기 크기 ${c}${l}`).toBeGreaterThanOrEqual(44);
        // 가로 화면: 보기는 장면 오른쪽
        if (width > height && width >= 560) expect(o.x, `보기는 장면 오른쪽 ${c}${l}`).toBeGreaterThan(stage.x + stage.width);
      }
      for (const b of await page.locator('[data-task] button').all()) {
        const r = await b.boundingBox();
        if (r) expect(Math.min(r.width, r.height), `누르는 물건 ${c}${l}`).toBeGreaterThanOrEqual(26);
      }
      await page.screenshot({ path: info.outputPath(`${name}-bunny-${c}${l}.png`) });
    }

    // 결과 창
    await bunnyStart(page, 'stream', 0);
    await bunnyFinish(page);
    await page.waitForTimeout(600);
    await expectFitsViewport(page);
    await page.screenshot({ path: info.outputPath(`${name}-bunny-result.png`) });
  });
}
