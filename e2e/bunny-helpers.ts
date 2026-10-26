import { expect, type Page } from '@playwright/test';

const KEY = 'ideun.bunny-math';
export const GAME = './#/games/bunny-math';
export const CHAPTER_IDS = ['field', 'acorn', 'stream', 'flower', 'shop', 'cheese', 'nest', 'train', 'hill'] as const;
const ITEM_NAMES: Record<string, string> = {
  carrot: '당근', acorn: '도토리', apple: '사과', strawberry: '딸기', cheese: '치즈', egg: '알', candy: '사탕', cookie: '쿠키',
  mushroom: '버섯', star: '별', blueberry: '블루베리', pear: '배', honey: '꿀단지', peach: '복숭아', ball: '공', gift: '선물',
};

export type BTask = {
  id: string;
  kind: 'count' | 'make' | 'compare' | 'hop' | 'land' | 'story' | 'calc' | 'ten';
  item?: string;
  n?: number;
  tap?: boolean;
  a: number;
  b: number;
  k: number;
  from: number;
  dir: 1 | -1;
  op?: '+' | '-';
  ask?: 'more' | 'fewer';
  missing?: boolean;
  options?: number[];
};

export async function bunnyState(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').state, KEY) as Promise<{
    player: string;
    stars: Record<string, number>;
    carrots: number;
    seen: string[];
    unlockAll: boolean;
    session: { key: string; tasks: BTask[]; index: number; tries: number; phase: 'act' | 'answer'; solved: boolean; done: boolean; marks: number[]; path: number[]; stars?: number } | null;
  }>;
}

/**
 * 진행 상태를 심는다 (앱이 돌지 않는 페이지에서).
 * cleared: 앞에서부터 다 깬 단원 수, seenAll: 이야기를 모두 봤음
 */
export async function seedBunny(page: Page, opts: { cleared?: number; stars?: Record<string, number>; seenAll?: boolean; unlockAll?: boolean; extraSeen?: string[] } = {}) {
  const { cleared = 0, seenAll = true, unlockAll = false, extraSeen = [] } = opts;
  await page.goto('./manifest.webmanifest');
  await page.evaluate(
    ({ k, ids, cleared, seenAll, unlockAll, extraSeen, extraStars }) => {
      localStorage.clear();
      const stars: Record<string, number> = { ...extraStars };
      ids.slice(0, cleared).forEach((id) => [0, 1, 2, 3].forEach((l) => (stars[`${id}:${l}`] = 3)));
      const seen = seenAll ? ['prologue', ...ids.map((id) => `intro:${id}`), ...ids.slice(0, cleared).map((id) => `done:${id}`)] : extraSeen;
      localStorage.setItem(k, JSON.stringify({ version: 1, state: { player: '이서', stars, levels: {}, carrots: 0, seen: [...seen, ...extraSeen], unlockAll, session: null } }));
    },
    { k: KEY, ids: [...CHAPTER_IDS], cleared, seenAll, unlockAll, extraSeen, extraStars: opts.stars ?? {} },
  );
}

export const answerOf = (t: BTask) => {
  switch (t.kind) {
    case 'count':
    case 'make':
      return t.n!;
    case 'compare': {
      const bigger = t.a > t.b ? 0 : 1;
      return t.ask === 'more' ? bigger : 1 - bigger;
    }
    case 'hop':
    case 'land':
      return t.from + t.dir * t.k;
    case 'story':
      return t.op === '+' ? t.a + t.b : t.a - t.b;
    case 'calc':
      return t.missing ? t.b : t.op === '+' ? t.a + t.b : t.a - t.b;
    case 'ten':
      return 10 - t.a;
  }
};

export const option = (page: Page, n: number) => page.getByRole('group', { name: '보기' }).getByRole('button', { name: String(n), exact: true });
export const tori = (page: Page) => page.locator('[data-pos]');

export async function currentTask(page: Page) {
  const s = (await bunnyState(page)).session!;
  return { s, t: s.tasks[s.index] };
}

/** 지금 문제를 아이처럼 화면에서 푼다 (물건 누르기 → 보기 고르기) */
export async function solveCurrent(page: Page) {
  const { s, t } = await currentTask(page);
  const name = t.item ? ITEM_NAMES[t.item] : '';
  switch (t.kind) {
    case 'count':
      if (t.tap) for (let i = s.marks.length; i < t.n!; i++) await page.getByRole('button', { name: `${name}, 아직 안 셈` }).first().click();
      await option(page, t.n!).click();
      break;
    case 'make':
      for (let i = s.marks.length; i < t.n!; i++) await page.getByRole('button', { name: `밭에 있는 ${name}` }).first().click();
      await page.getByRole('button', { name: /다 담았어/ }).click();
      break;
    case 'compare':
      await page.locator(`[data-side="${answerOf(t)}"]`).click();
      break;
    case 'hop':
      for (let i = s.path.length - 1; i < t.k; i++) await page.getByRole('button', { name: t.dir === 1 ? '앞으로 깡충' : '뒤로 깡충' }).click();
      break;
    case 'land':
      await page.getByRole('button', { name: `돌 ${answerOf(t)}`, exact: true }).click();
      break;
    case 'story':
      for (let i = s.marks.length; i < t.b; i++) await page.getByRole('button', { name: t.op === '+' ? `선물 ${name}` : `토리의 ${name}` }).first().click();
      await option(page, answerOf(t)).click();
      break;
    case 'calc':
      await option(page, answerOf(t)).click();
      break;
    case 'ten':
      for (let i = t.a + s.marks.length; i < 10; i++) await page.getByRole('button', { name: '빈칸' }).first().click();
      await option(page, answerOf(t)).click();
      break;
  }
  // 맞힌 뒤 설명을 듣고 다음 문제로 넘어갈 때까지
  await expect.poll(async () => {
    const n = (await bunnyState(page)).session;
    return !n || n.done || n.index > s.index;
  }, { timeout: 10_000 }).toBe(true);
}

/** 단계를 끝까지 푼다 → 결과 창 */
export async function finishLesson(page: Page) {
  for (;;) {
    const s = (await bunnyState(page)).session;
    if (!s || s.done) break;
    await solveCurrent(page);
  }
  await expect(page.getByRole('dialog')).toBeVisible();
}

/** 이야기 장면 건너뛰기 */
export async function skipStory(page: Page) {
  await page.getByRole('button', { name: /건너뛰기/ }).click();
}

/** 단원 → 단계 시작 */
export async function startLesson(page: Page, chapter: (typeof CHAPTER_IDS)[number], lesson: number) {
  await page.goto(`${GAME}/${chapter}`);
  await page.getByRole('button', { name: new RegExp(`^${lesson + 1}단계`) }).click();
  // 하던 다른 놀이가 있으면 묻는다 → 새로 시작
  const ask = page.getByRole('dialog').getByRole('button', { name: '새로 시작' });
  await expect(page.locator('[data-task]').or(ask)).toBeVisible();
  if (await ask.isVisible()) await ask.click();
  await expect(page.locator('[data-task]')).toBeVisible();
}
