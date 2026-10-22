import { expect, type Page } from '@playwright/test';

export interface SavedGame {
  spec: { size: number };
  status: 'ready' | 'playing' | 'won';
  givens: number[];
  solution: number[];
  values: number[];
  elapsedMs: number;
}

export async function saved(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ideun.sudoku') ?? '{}').state as {
    game: SavedGame | null;
    size: number;
    records: Record<string, { wins: number; bestMs?: number; runs?: { ms: number }[] }>;
  });
}

/** 홈 → 스도쿠 → 크기·난이도 선택 → (시작 전 화면) */
export type Size = 4 | 9;
/** 모드 이름은 블록 크기: 4×4판 → "2×2", 9×9판 → "3×3" */
export const mode = (size: Size) => (size === 4 ? '2×2' : '3×3');

export async function openNewGame(page: Page, size: Size, difficulty: '쉬움' | '중간' | '어려움' = '쉬움') {
  await page.goto('./');
  await page.getByRole('link', { name: /스도쿠/ }).click();
  await page.getByRole('radio', { name: new RegExp(`^${mode(size)} 블록`) }).click();
  await page.getByRole('button', { name: new RegExp(`^.*${difficulty}`) }).first().click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
}

export async function startGame(page: Page, size: Size, difficulty: '쉬움' | '중간' | '어려움' = '쉬움') {
  await openNewGame(page, size, difficulty);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeHidden();
}

export const cells = (page: Page) => page.getByRole('gridcell');
export const card = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^숫자 ${n},`) });

/** 빈칸 하나에 정답 입력 (칸 → 카드) */
export async function placeOneCorrect(page: Page) {
  const g = (await saved(page)).game!;
  const i = g.values.findIndex((v) => v === 0);
  await cells(page).nth(i).click();
  await card(page, g.solution[i]).click();
  return i;
}

/** 남은 칸을 모두 정답으로 채운다 */
export async function solveAll(page: Page) {
  const g = (await saved(page)).game!;
  for (let i = 0; i < g.values.length; i++) {
    if (g.values[i] !== 0) continue;
    await cells(page).nth(i).click();
    await card(page, g.solution[i]).click();
  }
}

export async function timerText(page: Page) {
  return (await page.getByLabel('걸린 시간').locator('b').textContent())?.trim();
}

/** 가로 스크롤이 없고, 보이는 버튼이 모두 화면 안에 있는지 */
export async function expectFitsViewport(page: Page) {
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 문서 자체가 세로 스크롤되면(홈처럼) 세로로 넘치는 건 스크롤로 닿을 수 있다
    const pageScrolls = document.documentElement.scrollHeight > vh + 1;
    if (document.documentElement.scrollWidth > vw + 1) out.push(`가로 스크롤 ${document.documentElement.scrollWidth}>${vw}`);
    for (const el of document.querySelectorAll<HTMLElement>('button, a')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      // 세로 스크롤 영역 안의 요소는 스크롤로 닿을 수 있으면 OK (메뉴·기록 화면 등)
      let scrollable = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const oy = getComputedStyle(p).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) {
          scrollable = true;
          break;
        }
      }
      if (scrollable && r.right <= vw + 1 && r.left >= -1) continue;
      const outY = !pageScrolls && (r.bottom > vh + 1 || r.top < -1);
      if (r.right > vw + 1 || r.left < -1 || outY) {
        out.push(`화면 밖: "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 20)}" ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  });
  expect(problems, problems.join('\n')).toEqual([]);
}
