import { expect, type Page } from '@playwright/test';

const KEY = 'ideun.hangul-hero';
export const GAME = './#/games/hangul-hero';
export const REGION_IDS = ['consonant', 'vowel', 'castle', 'cave', 'forest', 'sky'] as const;

type Q = { kind: 'choice'; answer: string; options: string[] } | { kind: 'build'; answer: { cho: string; jung: string } } | { kind: 'order'; answer: string[]; tiles: string[] };

export async function heroState(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').state, KEY) as Promise<{
    session: { index: number; status: string; solved: boolean; stage: number | 'boss'; tries: number; hp: number; questions: Q[]; order: number[] } | null;
    progress: Record<string, { stars: number[]; bossCleared: boolean; introSeen: boolean }>;
    pieces: string[];
    endingSeen: boolean;
  }>;
}

/**
 * 진행 상태를 심고 시작한다. cleared: 보스까지 깬 지역 수, staged: 그 다음 지역은 3단계까지 깸.
 * (앱이 돌지 않는 페이지에서 저장소를 바꿔야 진행 중 타이머가 덮어쓰지 않는다)
 */
export async function seed(page: Page, opts: { cleared?: number; staged?: boolean; prologueSeen?: boolean; introSeen?: boolean } = {}) {
  const { cleared = 0, staged = false, prologueSeen = true, introSeen = true } = opts;
  await page.goto('./manifest.webmanifest');
  await page.evaluate(
    ({ k, ids, cleared, staged, prologueSeen, introSeen }) => {
      localStorage.clear();
      const progress: Record<string, unknown> = {};
      ids.forEach((id, i) => {
        if (i < cleared) progress[id] = { stars: [3, 3, 3], bossCleared: true, introSeen: true };
        else if (i === cleared && staged) progress[id] = { stars: [3, 3, 3], bossCleared: false, introSeen };
        else if (i === cleared) progress[id] = { stars: [0, 0, 0], bossCleared: false, introSeen };
      });
      localStorage.setItem(k, JSON.stringify({ version: 1, state: { progress, pieces: [], prologueSeen, endingSeen: false, bossBooks: {}, session: null } }));
    },
    { k: KEY, ids: [...REGION_IDS], cleared, staged, prologueSeen, introSeen },
  );
}

/** 지금 문제를 화면에서 맞힌다 (보기 / 글자 짓기 / 문장 순서) */
export async function solveCurrent(page: Page) {
  const s = (await heroState(page)).session!;
  const q = s.questions[s.index];
  const before = s.index;
  if (q.kind === 'choice') {
    await page.getByRole('group', { name: '보기' }).getByRole('button', { name: q.answer, exact: true }).click();
  } else if (q.kind === 'build') {
    await page.getByRole('button', { name: `자음 ${q.answer.cho}`, exact: true }).click();
    await page.getByRole('button', { name: `모음 ${q.answer.jung}`, exact: true }).click();
  } else {
    const used = new Set<number>();
    for (const w of q.answer) {
      const i = q.tiles.findIndex((t, k) => t === w && !used.has(k));
      used.add(i);
      await page.getByRole('group', { name: '낱말 조각' }).getByRole('button', { name: w, exact: true }).and(page.locator(':not([disabled])')).first().click();
    }
  }
  // 정답 애니메이션 뒤 다음 문제로 넘어갈 때까지
  // (보스전은 체력이 먼저 줄고 0.9초 뒤 다음 문제 — 문제가 바뀌거나 끝날 때까지 기다린다)
  await expect
    .poll(async () => {
      const n = (await heroState(page)).session;
      return !n || n.status === 'done' || n.index !== before;
    }, { timeout: 5000 })
    .toBe(true);
}

/** 보기 문제에서 오답 하나 누르기 */
export async function chooseWrong(page: Page) {
  const s = (await heroState(page)).session!;
  const q = s.questions[s.index];
  if (q.kind !== 'choice') throw new Error('choice 문제가 아님');
  await page.getByRole('group', { name: '보기' }).getByRole('button', { name: q.options.find((o) => o !== q.answer)!, exact: true }).click();
}

export async function finishSession(page: Page) {
  for (let i = 0; i < 30; i++) {
    const s = (await heroState(page)).session;
    if (!s || s.status === 'done') return;
    await solveCurrent(page);
  }
}

/** 이야기 장면이 나타나면 건너뛴다 (나타날 때까지 잠깐 기다림) */
export const skipStory = async (page: Page) => {
  const skip = page.getByRole('button', { name: /건너뛰기/ });
  await skip.waitFor({ timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(skip).toBeHidden();
};
