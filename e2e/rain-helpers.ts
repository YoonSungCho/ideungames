import { expect, type Page } from '@playwright/test';

export const RAIN = './#/games/number-rain';
const KEY = 'ideun.number-rain';

export interface RainDrop {
  id: number;
  q: { face: { t: 'text'; text: string } | { t: 'count'; emoji: string; n: number } | { t: 'lines'; lines: [string, string] }; answer: number };
  kind: 'normal' | 'bomb' | 'ice' | 'heart';
  x: number;
  y: number;
  v: number;
}

/** 저장된 판 (멈출 때·끝날 때 저장된다) */
export async function rainSaved(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').state as {
    saved: { status: string; score: number; lives: number; drops: RainDrop[]; level: number; mode: string; speed: string } | null;
    records: Record<string, { plays: number; best?: number }>;
    music: boolean;
  }, KEY);
}

/** 홈 → 숫자 비 → 모드 → 빠르기 → 시작 전 화면 */
export async function openRain(page: Page, mode = '숫자 보기', speed: '느리게' | '보통' | '빠르게' = '느리게') {
  await page.goto('./');
  await page.getByRole('link', { name: /숫자 비/ }).click();
  await page.getByRole('radio', { name: mode, exact: true }).click();
  await page.getByRole('button', { name: `${speed} 시작` }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
}

export async function startRain(page: Page, mode?: string, speed?: '느리게' | '보통' | '빠르게') {
  await openRain(page, mode, speed);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeHidden();
}

export const rainKey = (page: Page, k: string) => page.getByRole('group', { name: '숫자 패드' }).getByRole('button', { name: k, exact: true });
export const drops = (page: Page) => page.locator('[data-answer]');
export const score = async (page: Page) => Number((await page.getByLabel(/^점수 \d+점$/).getAttribute('aria-label'))!.match(/\d+/)![0]);

/** 숫자 패드로 수 입력. 더 긴 답이 같이 있어 기다리면 ✔ */
export async function typeAnswer(page: Page, n: number) {
  for (const d of String(n)) await rainKey(page, d).click();
  if ((await page.locator('[data-input]').textContent()) === String(n)) await rainKey(page, '확인').click();
}

/** 떨어지는 물방울 하나를 맞힌다 */
export async function popOne(page: Page) {
  await expect(drops(page).first()).toBeAttached({ timeout: 5000 });
  const before = await score(page);
  const answer = Number(await drops(page).first().getAttribute('data-answer'));
  await typeAnswer(page, answer);
  await expect.poll(() => score(page)).toBeGreaterThan(before);
}

/** 진행 중인 판을 멈추고 물방울·목숨 등을 바꿔 넣은 뒤 새로고침 (멈춘 상태로 열린다) */
export async function seedRain(page: Page, patch: Record<string, unknown>) {
  await page.getByRole('button', { name: '잠깐 멈추기' }).click();
  await page.evaluate(([k, p]) => {
    const d = JSON.parse(localStorage.getItem(k as string)!);
    d.state.saved = { ...d.state.saved, ...(p as object) };
    localStorage.setItem(k as string, JSON.stringify(d));
  }, [KEY, patch] as const);
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
}

export const drop = (answer: number, patch: Partial<RainDrop> = {}): RainDrop => ({
  id: 900 + answer, q: { face: { t: 'text', text: String(answer) }, answer }, kind: 'normal', x: 0.125, y: 0.4, v: 1, ...patch,
});
