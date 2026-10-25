import { expect, type Page } from '@playwright/test';

export interface MemorySession {
  status: 'ready' | 'playing' | 'done';
  cards: { pair: number; sym: string; name: string; face: 'pic' | 'word' }[];
  matched: boolean[];
  open: number[];
  found: number;
  moves: number;
  misses: number;
  peekLeftMs: number;
  elapsedMs: number;
}

export async function memState(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ideun.memory-cards') ?? '{}').state as {
    session: MemorySession | null;
    records: Record<string, { plays: number; best?: number }>;
  });
}

export const LEVEL_NAMES = { tiny: '꼬마', easy: '쉬움', medium: '중간', hard: '어려움' } as const;

/** 홈 → 짝꿍 카드 → 그림·규칙·단계 고르기 → 시작 전 화면 */
export async function openMemory(page: Page, opts: { theme?: string; rule?: '같은 그림' | '그림과 글자'; level?: keyof typeof LEVEL_NAMES } = {}) {
  const { theme = '동물', rule = '같은 그림', level = 'tiny' } = opts;
  await page.goto('./');
  await page.getByRole('link', { name: /짝꿍 카드/ }).click();
  await page.getByRole('radio', { name: theme, exact: true }).click();
  await page.getByRole('radiogroup', { name: '짝 규칙' }).getByRole('radio', { name: new RegExp(rule) }).click();
  await page.getByRole('button', { name: new RegExp(`^${LEVEL_NAMES[level]} \\d+쌍`) }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
}

/** 시작하기 → 미리 보기가 끝날 때까지 */
export async function startMemory(page: Page, opts: Parameters<typeof openMemory>[1] = {}) {
  await openMemory(page, opts);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByText('잘 기억해 둬!')).toBeVisible();
  await expect(page.getByText('잘 기억해 둬!')).toBeHidden({ timeout: 6000 });
}

export const cards = (page: Page) => page.getByRole('group', { name: '카드' }).getByRole('button');

/** 아직 못 찾은 짝 하나를 맞힌다 */
export async function matchPair(page: Page) {
  const s = (await memState(page)).session!;
  const i = s.cards.findIndex((_, k) => !s.matched[k]);
  const j = s.cards.findIndex((c, k) => k !== i && c.pair === s.cards[i].pair);
  await cards(page).nth(i).click();
  await cards(page).nth(j).click();
  await expect.poll(async () => (await memState(page)).session!.found).toBe(s.found + 1);
  return { i, j, name: s.cards[i].name };
}

/** 짝이 아닌 두 장을 뒤집는다 */
export async function missPair(page: Page) {
  const s = (await memState(page)).session!;
  const i = s.cards.findIndex((_, k) => !s.matched[k]);
  const j = s.cards.findIndex((c, k) => k !== i && !s.matched[k] && c.pair !== s.cards[i].pair);
  await cards(page).nth(i).click();
  await cards(page).nth(j).click();
  return { i, j };
}

export async function matchAll(page: Page) {
  for (;;) {
    const s = (await memState(page)).session!;
    if (s.status === 'done') return;
    await matchPair(page);
  }
}
