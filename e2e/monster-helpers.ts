import { expect, type Page } from '@playwright/test';

export const MONSTER = './#/games/hangul-monster';
const KEY = 'ideun.hangul-monster';

export interface MonSave {
  started: boolean;
  map: string;
  x: number;
  y: number;
  party: { uid: string; sp: string; lv: number; xp: number; hp: number }[];
  box: { sp: string }[];
  seen: string[];
  caught: string[];
  items: { ball: number; potion: number; bigPotion: number };
  coins: number;
  badges: number;
  defeated: string[];
  picked: string[];
  champion: boolean;
  music: boolean;
}

export async function monState(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').state as MonSave, KEY);
}

const mon = (sp: string, lv: number, hp = 999) => ({ uid: `${sp}${lv}${Math.random()}`, sp, lv, xp: 0, hp });

/** 진행 상태를 심고 게임을 연다. 체력 999는 게임이 최대 체력으로 맞춘다 */
export async function seedMonster(page: Page, patch: Partial<Omit<MonSave, 'party'>> & { party?: [string, number, number?][] } = {}) {
  const { party = [['giyeok', 5]], ...rest } = patch;
  await page.goto('./');
  await page.evaluate(
    ([k, p, r]) => {
      localStorage.setItem(
        k as string,
        JSON.stringify({
          version: 1,
          state: {
            started: true, map: 'town', x: 4, y: 4, dir: 'up', box: [], seen: [], caught: [],
            items: { ball: 5, potion: 2, bigPotion: 0 }, coins: 100, badges: 0, defeated: [], picked: [],
            lastHeal: { map: 'town', x: 13, y: 4 }, champion: false, grassSteps: 0, music: false,
            ...(r as object),
            party: p,
          },
        }),
      );
    },
    [KEY, party.map(([sp, lv, hp]) => mon(sp, lv, hp ?? 999)), rest] as const,
  );
  await page.goto(MONSTER);
  await expect(page.locator('[data-world]')).toBeVisible();
}

export const dialog = (page: Page) => page.getByRole('dialog', { name: '대화' });

/** 대화를 끝까지 넘긴다 */
export async function finishDialog(page: Page) {
  for (let i = 0; i < 20 && (await dialog(page).isVisible()); i++) {
    await dialog(page).getByRole('button', { name: /다음|닫기/ }).click();
  }
  await expect(dialog(page)).toBeHidden();
}

export const playerAt = (page: Page) => page.locator('[data-player]').getAttribute('data-player');

/** 방향 버튼 한 번 */
export async function stepDir(page: Page, d: '위로' | '아래로' | '왼쪽으로' | '오른쪽으로', opts: { mayStartBattle?: boolean } = {}) {
  const btn = page.getByRole('button', { name: d, exact: true });
  // 수풀에서는 걷다가 배틀이 시작되면 방향 버튼이 사라진다
  const timeout = opts.mayStartBattle ? 1500 : undefined;
  try {
    await btn.dispatchEvent('pointerdown', undefined, { timeout });
    await btn.dispatchEvent('pointerup', undefined, { timeout });
  } catch (e) {
    if (!opts.mayStartBattle) throw e;
  }
}

/** 지도의 칸을 눌러서 걸어가기 */
export async function tapTile(page: Page, x: number, y: number) {
  await page.locator(`[data-xy="${x},${y}"]`).dispatchEvent('click');
}

export const battle = (page: Page) => page.locator('[data-battle]');
const message = (page: Page) => page.locator('[data-message]');

/** 장면 메시지를 눌러 넘기며 고르기 화면(또는 배틀 끝)까지 */
export async function skipBeats(page: Page) {
  for (let i = 0; i < 40; i++) {
    if (!(await battle(page).isVisible())) return;
    if (await page.getByRole('button', { name: '⚔️ 싸우기' }).isVisible()) return;
    if (await page.getByRole('button', { name: /내보내기$/ }).first().isVisible()) return;
    const m = message(page);
    if ((await m.isVisible()) && (await m.isEnabled())) await m.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(80);
  }
}

/** 첫 기술로 공격하고 문제를 맞히거나(정답) 틀린다 */
export async function useMove(page: Page, correct = true, moveIdx = 0) {
  await page.getByRole('button', { name: '⚔️ 싸우기' }).click();
  await page.locator('[class*="moveBtn"]').nth(moveIdx).click();
  const opts = page.getByRole('group', { name: '보기' });
  await expect(opts).toBeVisible();
  if (correct) await opts.locator('[data-correct]').click();
  else await opts.locator('button:not([data-correct])').first().click();
}

/** 이길 때까지 정답으로 공격 */
export async function winBattle(page: Page, moveIdx = 0) {
  for (let i = 0; i < 30 && (await battle(page).isVisible()); i++) {
    await skipBeats(page);
    if (!(await battle(page).isVisible())) break;
    if (await page.getByRole('button', { name: /내보내기$/ }).first().isVisible()) {
      await page.getByRole('button', { name: /내보내기$/ }).and(page.locator(':enabled')).first().click();
      continue;
    }
    await useMove(page, true, moveIdx);
  }
  await expect(battle(page)).toBeHidden();
}
