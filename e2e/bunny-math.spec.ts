import { expect, test } from '@playwright/test';
import { answerOf, bunnyState, currentTask, finishLesson, GAME, option, seedBunny, skipStory, solveCurrent, startLesson, tori } from './bunny-helpers';

test.describe.configure({ timeout: 60_000 });
const chapter = (page: import('@playwright/test').Page, n: number, name: string) => page.getByRole('button', { name: new RegExp(`^${n}\\. ${name}`) });

test('첫 방문: 홈 → 처음 이야기 → 지도(첫 곳만 열림) → 놀러 가자 → 친구 이야기 → 1단계', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.getByRole('link', { name: /토리의 숫자 숲/ }).click();
  const story = page.getByRole('dialog', { name: '처음 이야기' });
  await expect(story).toContainText('토끼 토리');
  await story.getByRole('button', { name: '다음 ▶' }).click();
  await expect(story).toContainText('이서야');
  await skipStory(page);
  await expect(chapter(page, 1, '토리의 당근밭')).toBeEnabled();
  await expect(chapter(page, 2, '다람쥐 도토리 나무')).toBeDisabled();
  await expect(chapter(page, 9, '부엉이 별빛 언덕')).toBeDisabled();
  await expect(page.getByLabel('잔치에 올 친구 0/9')).toBeVisible();

  await page.getByRole('button', { name: /이서야, 놀러 가자!/ }).click();
  await expect(page.getByRole('dialog', { name: '토리의 당근밭' })).toContainText('당근밭');
  await skipStory(page);
  await expect(page.getByText('여기부터!')).toBeVisible();
  await expect(page.getByRole('button', { name: /^2단계/ })).toBeDisabled();
  await page.getByRole('button', { name: /^1단계/ }).click();
  await expect(page.getByText('당근을 하나씩 눌러서 세어 봐!')).toBeVisible();
  // 다시 지도에 와도 처음 이야기는 또 나오지 않는다
  await page.goto(GAME);
  await expect(page.getByRole('dialog', { name: '처음 이야기' })).toBeHidden();
});

test('세기: 하나씩 눌러야 보기가 켜지고, 같은 당근은 한 번만 센다 → 5문제 → 별 3개 → 다음 단계', async ({ page }) => {
  await seedBunny(page);
  await startLesson(page, 'field', 0);
  const { t } = await currentTask(page);
  await expect(option(page, t.n!)).toBeDisabled();
  const first = page.getByRole('button', { name: '당근, 아직 안 셈' }).first();
  await first.click();
  await expect(page.getByRole('button', { name: '당근 1' })).toBeVisible();
  // 이미 센 당근을 또 눌러도 2가 되지 않는다
  await page.getByRole('button', { name: '당근 1' }).click();
  await expect(page.getByRole('button', { name: '당근 2' })).toHaveCount(0);
  await expect(page.getByText('모두 몇 개야?')).toHaveCount(t.n === 1 ? 1 : 0);
  await finishLesson(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('이서야, 다 했어!');
  await expect(dialog.getByLabel('별 3개')).toBeVisible();
  await expect(dialog).toContainText('당근 5개를 모았어요');
  await dialog.getByRole('button', { name: '다음 ▶' }).click();
  await expect(page.getByText('흩어진 당근').first()).toBeVisible();
  expect((await bunnyState(page)).stars['field:0']).toBe(3);
});

test('틀리면 다정한 힌트, 두 번 틀리면 정답이 초록색이고 정답만 눌린다', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  await startLesson(page, 'shop', 3);
  const { t } = await currentTask(page);
  const wrongs = t.options!.filter((o) => o !== answerOf(t));
  await option(page, wrongs[0]).click();
  await expect(page.getByText('토리를 깡충깡충 뛰게 해서 세어 봐!')).toBeVisible();
  await option(page, wrongs[1]).click();
  await expect(page.getByText(`정답은 ${answerOf(t)}!`)).toBeVisible();
  await expect(option(page, answerOf(t))).toHaveAttribute('data-correct', 'true');
  await option(page, wrongs[0]).click();
  expect((await bunnyState(page)).session!.index).toBe(0);
  await option(page, answerOf(t)).click();
  await expect.poll(async () => (await bunnyState(page)).session!.index).toBe(1);
});

test('바구니 담기: 너무 많이 담으면 알려 주고, 바구니에서 빼면 된다', async ({ page }) => {
  await seedBunny(page, { stars: { 'field:0': 3, 'field:1': 3 } });
  await startLesson(page, 'field', 2);
  const { t } = await currentTask(page);
  for (let i = 0; i <= t.n!; i++) await page.getByRole('button', { name: '밭에 있는 당근' }).first().click();
  await expect(page.getByRole('group', { name: `바구니, ${t.n! + 1}개` })).toBeVisible();
  await page.getByRole('button', { name: /다 담았어/ }).click();
  await expect(page.getByText(`지금 바구니에 ${t.n! + 1}개 있어. ${t.n}개만 담아 볼까?`)).toBeVisible();
  await page.getByRole('button', { name: `바구니의 당근 ${t.n! + 1}` }).click();
  await expect(page.getByRole('group', { name: `바구니, ${t.n}개` })).toBeVisible();
  await page.getByRole('button', { name: /다 담았어/ }).click();
  await expect.poll(async () => (await bunnyState(page)).session!.index).toBe(1);
});

test('징검다리: 한 칸씩 깡충, 뛸 때마다 번호, 멀리 있는 돌을 바로 누르면 "한 칸씩"', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  await startLesson(page, 'stream', 1);
  const { t } = await currentTask(page);
  await expect(tori(page)).toHaveAttribute('data-pos', String(t.from));
  await page.getByRole('button', { name: `돌 ${t.from + 2}`, exact: true }).click();
  await expect(page.getByText('앞으로는 오른쪽이야. 한 칸씩 깡충!')).toBeVisible();
  await expect(tori(page)).toHaveAttribute('data-pos', String(t.from));
  await page.getByRole('button', { name: '앞으로 깡충' }).click();
  await expect(tori(page)).toHaveAttribute('data-pos', String(t.from + 1));
  await expect(page.getByLabel(new RegExp(`앞으로 ${t.k}칸, 1번 뛰었어요`))).toBeVisible();
  // 옆 돌을 눌러도 한 칸
  for (let i = 2; i <= t.k; i++) await page.getByRole('button', { name: `돌 ${t.from + i}`, exact: true }).click();
  await expect(tori(page)).toHaveAttribute('data-pos', String(t.from + t.k));
  await expect(page.getByText(`${t.from}에서 ${t.k}칸 앞으로 가면 ${t.from + t.k}!`)).toBeVisible();
  await expect.poll(async () => (await bunnyState(page)).session!.index).toBe(1);
});

test('어디에 도착할까: 틀리면 점선 다리로 세어 보게, 맞히면 토리가 한 칸씩 뛰어 간다', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  await startLesson(page, 'stream', 3);
  const { t } = await currentTask(page);
  expect(t.kind).toBe('land');
  const target = answerOf(t);
  const wrong = target + (target < 10 ? 1 : -1);
  await page.getByRole('button', { name: `돌 ${wrong}`, exact: true }).click();
  await expect(page.getByText('토리랑 같이 한 칸씩 세어 볼까?')).toBeVisible();
  await page.getByRole('button', { name: `돌 ${target}`, exact: true }).click();
  await expect(tori(page)).toHaveAttribute('data-pos', String(target), { timeout: 4000 });
});

test('이야기 더하기: 선물을 하나 넣을 때마다 토리가 앞으로 한 칸 → 토리가 선 돌이 모두의 수', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  await startLesson(page, 'shop', 0);
  const { t } = await currentTask(page);
  expect(t.kind).toBe('story');
  await expect(page.getByRole('group', { name: `토리 바구니, ${t.a}개` })).toBeVisible();
  for (let i = 1; i <= t.b; i++) {
    await page.getByRole('button', { name: /^선물 / }).first().click();
    await expect(tori(page)).toHaveAttribute('data-pos', String(t.a + i));
    await expect(page.getByRole('group', { name: `토리 바구니, ${t.a + i}개` })).toBeVisible();
  }
  await expect(page.getByText(/모두 몇 개야/)).toBeVisible();
  await option(page, t.a + t.b).click();
  await expect(page.getByText(`${t.a} + ${t.b} = ${t.a + t.b}`)).toBeVisible();
});

test('이야기 빼기: 하나 나눠 줄 때마다 토리가 뒤로 한 칸', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  await startLesson(page, 'cheese', 0);
  const { t } = await currentTask(page);
  for (let i = 1; i <= t.b; i++) {
    await page.getByRole('button', { name: /^토리의 / }).last().click();
    await expect(tori(page)).toHaveAttribute('data-pos', String(t.a - i));
  }
  await expect(page.getByText(/남은 .+ 몇 개야/)).toBeVisible();
  await option(page, t.a - t.b).click();
  await expect.poll(async () => (await bunnyState(page)).session!.index).toBe(1);
});

test('누가 더 많을까 · 어느 수가 클까 · 10 만들기 · 몇 칸 더(🚩)', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  for (const [c, l] of [['acorn', 3], ['flower', 2], ['nest', 1], ['nest', 2]] as const) {
    await startLesson(page, c, l);
    const { t } = await currentTask(page);
    if (t.kind === 'calc') {
      // 깃발까지 토리를 뛰게 해서 세어 볼 수 있다
      for (let i = 0; i < t.b; i++) await page.getByRole('button', { name: '앞으로 깡충' }).click();
      await expect(tori(page)).toHaveAttribute('data-pos', String(t.a + t.b));
    }
    if (t.kind === 'ten') {
      await expect(option(page, answerOf(t))).toBeDisabled();
    }
    await solveCurrent(page);
  }
});

test('단원을 다 깨면 친구가 잔치에 오고, 다음 곳이 열린다', async ({ page }) => {
  await seedBunny(page, { stars: { 'field:0': 3, 'field:1': 3, 'field:2': 3 } });
  await startLesson(page, 'field', 3);
  await finishLesson(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('이제 숲속 친구들을 만나러 가자!');
  await dialog.getByRole('button', { name: /친구들 만나러 가기/ }).click();
  await expect(page.getByRole('dialog', { name: /초대/ })).toContainText('당근을 다 셌어!');
  await skipStory(page);
  await expect(page.getByRole('button', { name: /다음 곳: 다람쥐 도토리 나무/ })).toBeVisible();
  await page.goto(GAME);
  await expect(page.getByLabel('잔치에 올 친구 1/9')).toBeVisible();
  await expect(chapter(page, 2, '다람쥐 도토리 나무')).toBeEnabled();
});

test('하다가 나갔다 오면 지도에 "하던 놀이 이어하기", 다른 단계를 고르면 묻는다', async ({ page }) => {
  await seedBunny(page);
  await startLesson(page, 'field', 0);
  await solveCurrent(page);
  await page.getByRole('button', { name: '당근, 아직 안 셈' }).first().click();
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page).toHaveURL(/bunny-math\/field$/);
  await page.getByRole('link', { name: '뒤로' }).click();
  await page.getByRole('button', { name: /하던 놀이 이어하기/ }).click();
  // 센 것도 그대로
  await expect(page.getByRole('button', { name: '당근 1' })).toBeVisible();
  expect((await bunnyState(page)).session!.index).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', { name: '당근 1' })).toBeVisible();

  await page.goto(`${GAME}/field`);
  await page.getByRole('button', { name: /^1단계/ }).click(); // 하던 단계는 그대로 이어진다
  await expect(page.getByRole('button', { name: '당근 1' })).toBeVisible();
  await seedStars(page);
  await page.reload();
  await page.goto(`${GAME}/field`);
  await page.getByRole('button', { name: /^2단계/ }).click();
  const confirm = page.getByRole('dialog');
  await expect(confirm).toContainText('다른 놀이를 시작할까?');
  await confirm.getByRole('button', { name: '하던 거 할래' }).click();
  await expect(confirm).toBeHidden();
  await page.getByRole('button', { name: /^2단계/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '새로 시작' }).click();
  await expect(page.getByText('흩어진 당근').first()).toBeVisible();
});

/** 진행 중인 판은 두고 1단계 별만 준다 */
async function seedStars(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('ideun.bunny-math')!);
    d.state.stars['field:0'] = 3;
    localStorage.setItem('ideun.bunny-math', JSON.stringify(d));
  });
}

test('섞어 놀기는 3단계를 깨면 열리고, 다 깬 것들이 섞여 나온다', async ({ page }) => {
  await seedBunny(page, { stars: { 'field:0': 3, 'field:1': 3 } });
  await page.goto(GAME);
  await expect(page.getByRole('button', { name: /섞어 놀기/ })).toHaveCount(0);
  await seedBunny(page, { stars: { 'field:0': 3, 'field:1': 3, 'field:2': 3 } });
  await page.goto(GAME);
  await page.getByRole('button', { name: /섞어 놀기/ }).click();
  await expect(page.getByText('🎲 섞어 놀기')).toBeVisible();
  await finishLesson(page);
  await page.getByRole('dialog').getByRole('button', { name: '지도로' }).click();
  await expect(page).toHaveURL(/bunny-math$/);
  expect((await bunnyState(page)).stars).toEqual({ 'field:0': 3, 'field:1': 3, 'field:2': 3 });
});

test('이름 바꾸기, 어른용 모두 열기(확인 후)', async ({ page }) => {
  await seedBunny(page);
  await page.goto(GAME);
  await page.getByRole('button', { name: /이름 바꾸기/ }).click();
  await page.getByRole('textbox', { name: '이름' }).fill('하린');
  await page.getByRole('button', { name: '좋아!' }).click();
  await expect(page.getByRole('button', { name: /하린아, 놀러 가자!/ })).toBeVisible();

  await page.getByRole('button', { name: /모두 열기/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '순서대로 할래' }).click();
  await expect(chapter(page, 9, '부엉이 별빛 언덕')).toBeDisabled();
  await page.getByRole('button', { name: /모두 열기/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '모두 열기' }).click();
  await expect(chapter(page, 9, '부엉이 별빛 언덕')).toBeEnabled();
  await page.getByRole('button', { name: /순서대로 열기/ }).click();
  await expect(chapter(page, 9, '부엉이 별빛 언덕')).toBeDisabled();
});

test('9곳을 모두 도우면 보름달 잔치 이야기가 한 번 나온다', async ({ page }) => {
  await seedBunny(page, { cleared: 9 });
  await page.goto(GAME);
  await expect(page.getByRole('dialog', { name: '보름달 잔치' })).toContainText('보름달');
  await skipStory(page);
  await expect(page.getByLabel('잔치에 올 친구 9/9')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: '보름달 잔치' })).toBeHidden();
});

test('키보드: 화살표로 깡충, 숫자로 보기 고르기', async ({ page }) => {
  await seedBunny(page, { unlockAll: true });
  await startLesson(page, 'stream', 0);
  const { t } = await currentTask(page);
  for (let i = 0; i < t.k; i++) await page.keyboard.press('ArrowRight');
  await expect(tori(page)).toHaveAttribute('data-pos', String(t.k));
  await startLesson(page, 'shop', 3);
  const c = await currentTask(page);
  test.skip(answerOf(c.t) >= 10, '두 자리 답은 키 하나로 못 고른다');
  await page.keyboard.press(String(answerOf(c.t)));
  await expect.poll(async () => (await bunnyState(page)).session!.solved || (await bunnyState(page)).session!.index > 0).toBe(true);
});
