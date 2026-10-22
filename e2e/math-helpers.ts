import { expect, type Page } from '@playwright/test';

export interface MathSession {
  mode: 'sprint' | 'blitz';
  status: 'ready' | 'playing' | 'done';
  problems: { answer: number; op: string }[];
  index: number;
  correct: number;
  mistakes: number;
  tries: number;
  elapsedMs: number;
}

export async function mathState(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ideun.quick-math') ?? '{}').state as {
    session: MathSession | null;
    records: Record<string, { plays: number; best?: number; runs: { value: number }[] }>;
  });
}

export const OP_NAMES = { add: '덧셈', sub: '뺄셈', mul: '곱셈', div: '나눗셈' } as const;
type OpKey = keyof typeof OP_NAMES;

/** 홈 → 빠른 계산 → 방식·연산·난이도 고르기 → 시작 전 화면 */
export async function openMath(page: Page, opts: { mode?: '20문제' | '60초'; ops?: OpKey[]; difficulty?: '쉬움' | '중간' | '어려움' } = {}) {
  const { mode = '20문제', ops = ['add'], difficulty = '쉬움' } = opts;
  await page.goto('./');
  await page.getByRole('link', { name: /빠른 계산/ }).click();
  await page.getByRole('radio', { name: new RegExp(mode) }).click();
  // 원하는 연산만 켜기 (덧셈이 기본으로 켜져 있음)
  for (const op of ops) {
    const chip = page.getByRole('button', { name: OP_NAMES[op], exact: true });
    if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click();
  }
  for (const op of Object.keys(OP_NAMES) as OpKey[]) {
    if (ops.includes(op)) continue;
    const chip = page.getByRole('button', { name: OP_NAMES[op], exact: true });
    if ((await chip.getAttribute('aria-pressed')) === 'true') await chip.click();
  }
  await page.getByRole('button', { name: new RegExp(`^.*${difficulty}`) }).first().click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
}

export async function startMath(page: Page, opts: Parameters<typeof openMath>[1] = {}) {
  await openMath(page, opts);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeHidden();
}

export const key = (page: Page, k: string) => page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: k, exact: true });

/** 숫자 패드로 수 입력 (자릿수가 차면 자동 채점) */
export async function typeNumber(page: Page, n: number) {
  for (const d of String(n)) await key(page, d).click();
}

/** 지금 문제를 맞힌다 */
export async function answerCurrent(page: Page) {
  const s = (await mathState(page)).session!;
  const before = s.index;
  await typeNumber(page, s.problems[s.index].answer);
  await expect.poll(async () => (await mathState(page)).session!.index !== before || (await mathState(page)).session!.status === 'done').toBe(true);
}

/** 지금 문제를 한 번 틀린다 (자릿수가 짧으면 ✔로 제출) */
export async function answerWrong(page: Page) {
  const s = (await mathState(page)).session!;
  const a = s.problems[s.index].answer;
  const wrong = a === 9 ? 8 : a + 1;
  await typeNumber(page, wrong);
  if (String(wrong).length < String(a).length) await key(page, '확인').click();
}
