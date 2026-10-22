import { expect, test, type Page } from '@playwright/test';
import { answerCurrent, answerWrong, key, mathState, openMath, startMath, typeNumber } from './math-helpers';
import { timerText } from './helpers';

const menu = (page: Page) => page.getByRole('group', { name: '연산 고르기' });
const resumeBtn = (page: Page) => page.getByRole('button', { name: /하던 게임 이어하기/ });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('메뉴: 연산은 여러 개 고를 수 있고, 마지막 하나는 끌 수 없다. 구구단 단은 곱셈·나눗셈일 때만', async ({ page }) => {
  await page.goto('./#/games/quick-math');
  const add = page.getByRole('button', { name: '덧셈', exact: true });
  await expect(add).toHaveAttribute('aria-pressed', 'true');
  await expect(add).toBeDisabled(); // 하나뿐이면 못 끔
  await expect(page.getByRole('group', { name: '구구단 단 고르기' })).toBeHidden();
  await page.getByRole('button', { name: '곱셈', exact: true }).click();
  await expect(page.getByRole('group', { name: '구구단 단 고르기' })).toBeVisible();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(add).toHaveAttribute('aria-pressed', 'false');
});

test('시작 전에는 문제가 가려지고 시간이 안 간다 → 시작하기', async ({ page }) => {
  await openMath(page);
  await page.waitForTimeout(1200);
  expect(await timerText(page)).toBe('0:00');
  await expect(key(page, '5')).toBeVisible();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect.poll(() => timerText(page), { timeout: 4000 }).not.toBe('0:00');
});

test('정답을 누르면 자동 채점되고 다음 문제로', async ({ page }) => {
  await startMath(page, { ops: ['add', 'sub'], difficulty: '중간' });
  await answerCurrent(page);
  await answerCurrent(page);
  const s = (await mathState(page)).session!;
  expect(s).toMatchObject({ index: 2, correct: 2, mistakes: 0 });
  await expect(page.getByLabel('2번째 문제').or(page.getByLabel('3번째 문제'))).toBeVisible();
});

test('두 번 틀리면 정답을 알려 주고, 그걸 입력해야 넘어간다', async ({ page }) => {
  await startMath(page, { ops: ['mul'] });
  await answerWrong(page);
  await expect(page.getByText('아까워! 다시 해 보자')).toBeVisible();
  await answerWrong(page);
  const s = (await mathState(page)).session!;
  const a = s.problems[s.index].answer;
  await expect(page.getByText(`정답은 ${a}!`)).toBeVisible();
  await typeNumber(page, a);
  await expect.poll(async () => (await mathState(page)).session!.index).toBe(1);
  expect((await mathState(page)).session!.correct).toBe(0);
});

test('지우기·확인 키', async ({ page }) => {
  await startMath(page, { ops: ['add'], difficulty: '어려움' });
  const s = (await mathState(page)).session!;
  const a = s.problems[0].answer;
  test.skip(String(a).length < 2, '두 자리 답에서만');
  await key(page, String((Number(String(a)[0]) + 1) % 10)).click();
  await key(page, '지우기').click();
  await typeNumber(page, a);
  await expect.poll(async () => (await mathState(page)).session!.index).toBe(1);
});

test('20문제 완주 → 결과·첫 기록 → 기록 화면 → 뒤로 메뉴', async ({ page }) => {
  await startMath(page, { ops: ['div'] });
  for (let i = 0; i < 20; i++) await answerCurrent(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('다 풀었어');
  await expect(dialog).toContainText('첫 기록');
  await expect(dialog).toContainText('20/20');
  const { records } = await mathState(page);
  expect(Object.values(records)[0]).toMatchObject({ plays: 1 });

  await dialog.getByRole('link', { name: /기록 보기/ }).click();
  await expect(page.getByText('내 최고 기록')).toBeVisible();
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(menu(page)).toBeVisible();
  await expect(resumeBtn(page)).toBeHidden();
});

test('60초 모드: 시간이 다 되면 끝나고 맞힌 개수가 기록된다', async ({ page }) => {
  await page.clock.install();
  await startMath(page, { mode: '60초', ops: ['add'] });
  await answerCurrent(page);
  await answerCurrent(page);
  await answerCurrent(page);
  await page.clock.runFor(61_000);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('시간 끝');
  await expect(dialog).toContainText('3개');
  expect((await mathState(page)).session).toMatchObject({ status: 'done', correct: 3 });
});

test('상단 방식 전환: 진행 중이면 묻고, 계속하기면 그대로', async ({ page }) => {
  await startMath(page);
  await answerCurrent(page);
  await page.getByRole('radio', { name: '60초' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('60초로 바꿀까?');
  await dialog.getByRole('button', { name: '하던 게임 계속하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  expect((await mathState(page)).session!.mode).toBe('sprint');
  await page.getByRole('radio', { name: '60초' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /취소하고 60초/ }).click();
  expect((await mathState(page)).session).toMatchObject({ mode: 'blitz', status: 'ready' });
});

test('그만하기 → 다시 들어오면 메뉴, 이어하기는 바로 진행', async ({ page }) => {
  await startMath(page);
  await answerCurrent(page);
  await page.getByRole('link', { name: '홈으로' }).click();
  await page.getByRole('button', { name: '그만하기' }).click();
  await page.getByRole('link', { name: /빠른 계산/ }).click();
  await expect(menu(page)).toBeVisible();
  await resumeBtn(page).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  const t0 = await timerText(page);
  await expect.poll(() => timerText(page), { timeout: 4000 }).not.toBe(t0);
  expect((await mathState(page)).session!.index).toBe(1);
});

test('새로고침 → 멈춘 상태, 계속하기', async ({ page }) => {
  await startMath(page);
  await answerCurrent(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await answerCurrent(page);
});

test('멈추면 문제와 패드가 잠긴다', async ({ page }) => {
  await startMath(page);
  await page.getByRole('button', { name: '잠깐 멈추기' }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  const t = await timerText(page);
  await page.waitForTimeout(1200);
  expect(await timerText(page)).toBe(t);
});

test('키보드로 답 입력', async ({ page, isMobile }) => {
  test.skip(!!isMobile, '데스크톱 전용');
  await startMath(page, { ops: ['add'] });
  const s = (await mathState(page)).session!;
  await page.keyboard.type(String(s.problems[0].answer));
  await expect.poll(async () => (await mathState(page)).session!.index).toBe(1);
});
