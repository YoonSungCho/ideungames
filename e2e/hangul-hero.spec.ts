import { expect, test } from '@playwright/test';
import { chooseWrong, finishSession, GAME, heroState, seed, skipStory, solveCurrent } from './hero-helpers';

const region = (page: import('@playwright/test').Page, n: number, name: string) => page.getByRole('button', { name: new RegExp(`^${n}\\. ${name}`) });

test('첫 방문: 프롤로그 → 지도, 첫 지역만 열려 있다', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.getByRole('link', { name: /한글 용사/ }).click();
  const story = page.getByRole('dialog', { name: '프롤로그' });
  await expect(story).toBeVisible();
  await expect(story).toContainText('한글 나라');
  await story.getByRole('button', { name: '다음 ▶' }).click();
  await expect(story).toContainText('재미없어');
  await story.getByRole('button', { name: /건너뛰기/ }).click();
  await expect(story).toBeHidden();
  await expect(region(page, 1, '자음 마을')).toBeEnabled();
  await expect(region(page, 2, '모음 바다')).toBeDisabled();
  await expect(region(page, 6, '반대말 다리')).toBeDisabled();
  await expect(region(page, 7, '문장 하늘')).toBeDisabled();
  // 다시 들어와도 프롤로그는 또 나오지 않는다
  await page.reload();
  await expect(page.getByRole('dialog', { name: '프롤로그' })).toBeHidden();
});

test('지역 이야기는 처음 한 번만, 할 단계에 "여기부터!" 표시', async ({ page }) => {
  await seed(page, { introSeen: false });
  await page.goto(GAME);
  await region(page, 1, '자음 마을').click();
  await expect(page.getByRole('dialog', { name: '자음 마을' })).toBeVisible();
  await skipStory(page);
  await expect(page.getByText('여기부터!')).toBeVisible();
  await expect(page.getByRole('button', { name: /^1단계/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /^2단계/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^보스전/ })).toBeDisabled();
  await page.getByRole('link', { name: '뒤로' }).click();
  await region(page, 1, '자음 마을').click();
  await expect(page.getByRole('dialog', { name: '자음 마을' })).toBeHidden();
});

test('단계: 시작하기 → 다 맞히면 별 3개·새 조각 → 다음 단계 → 지역으로 가면 2단계가 열려 있다', async ({ page }) => {
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await finishSession(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('1단계 성공');
  await expect(dialog.getByLabel('별 3개')).toBeVisible();
  await expect(dialog).toContainText('새로 찾은 한글 조각');
  await dialog.getByRole('button', { name: '다음 단계 ▶' }).click();
  await expect(page.getByText('자음 마을 · 2단계').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '▶ 시작하기' })).toBeVisible();
  await page.getByRole('link', { name: '뒤로' }).click(); // 시작 전이라 묻지 않음
  await expect(page).toHaveURL(/hangul-hero\/consonant$/);
  await expect(page.getByRole('button', { name: /^2단계/ })).toBeEnabled();
  expect((await heroState(page)).pieces.length).toBeGreaterThan(0);
});

test('두 번 틀리면 "정답은 …" 안내, 다른 오답은 안 눌리고 정답만 눌러 넘어간다', async ({ page }) => {
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await chooseWrong(page);
  await chooseWrong(page);
  const s = (await heroState(page)).session!;
  const q = s.questions[0] as { answer: string };
  await expect(page.getByRole('status').filter({ hasText: '정답은' })).toContainText(q.answer);
  await chooseWrong(page);
  expect((await heroState(page)).session!.tries).toBe(2);
  await solveCurrent(page);
  expect((await heroState(page)).session!.index).toBe(1);
});

test('한국어 음성이 없는 기기에서는 듣기 문제가 글자로 보인다', async ({ page }) => {
  await page.addInitScript(() => {
    // 한국어 음성이 없는 기기 흉내
    const synth = window.speechSynthesis;
    if (synth) synth.getVoices = () => [];
  });
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByLabel(/^문제 /)).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 듣기' })).toBeHidden();
});

test('단계 중 뒤로 → 그만하기 → 지역 화면에 이어하기 → 누르면 바로 이어서', async ({ page }) => {
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await solveCurrent(page);
  await page.getByRole('link', { name: '뒤로' }).click();
  await expect(page.getByRole('dialog')).toContainText('게임을 그만할까?');
  await page.getByRole('button', { name: '그만하기' }).click();
  await expect(page).toHaveURL(/hangul-hero\/consonant$/);
  await page.getByRole('button', { name: /하던 단계 이어하기/ }).click();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeHidden();
  expect((await heroState(page)).session).toMatchObject({ index: 1, status: 'playing' });
});

test('보스전: 이야기 → 시작 → 공격으로 체력 0 → 승리 이야기 → 결과 → 지도에 다음 지역이 열림', async ({ page }) => {
  await seed(page, { staged: true });
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^보스전/ }).click();
  await expect(page.getByRole('dialog', { name: '보스 등장' })).toBeVisible();
  await skipStory(page);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await solveCurrent(page);
  expect((await heroState(page)).session!.hp).toBeLessThan(100);
  await finishSession(page);
  await expect(page.getByRole('dialog', { name: '승리' })).toBeVisible();
  await skipStory(page);
  const result = page.getByRole('dialog').filter({ hasText: '되찾았어' });
  await expect(result).toContainText('새 지역이 열렸어요');
  await result.getByRole('button', { name: /지도로/ }).click();
  await expect(page).toHaveURL(/games\/hangul-hero$/);
  await expect(region(page, 2, '모음 바다')).toBeEnabled();
  await expect(region(page, 1, '자음 마을')).toHaveAccessibleName(/되찾음/);
});

test('글자 짓기·문장 순서를 화면에서 풀 수 있다', async ({ page }) => {
  await seed(page, { cleared: 2 });
  await page.goto(`${GAME}/castle`);
  await page.evaluate(() => {
    const k = 'ideun.hangul-hero';
    const d = JSON.parse(localStorage.getItem(k)!);
    d.state.progress.castle.stars = [3, 0, 0];
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await page.getByRole('button', { name: /^2단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await solveCurrent(page);
  await solveCurrent(page);

  await seed(page, { cleared: 6 });
  await page.goto(`${GAME}/sky`);
  await page.evaluate(() => {
    const k = 'ideun.hangul-hero';
    const d = JSON.parse(localStorage.getItem(k)!);
    d.state.progress.sky.stars = [3, 0, 0];
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await page.getByRole('button', { name: /^2단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await page.getByRole('button', { name: '하나 빼기' }).isDisabled();
  await solveCurrent(page);
  expect((await heroState(page)).session!.index).toBe(1);
});

test('마지막 보스 → 엔딩 → 도감에 한글 용사 인증서', async ({ page }) => {
  await seed(page, { cleared: 6, staged: true });
  await page.goto(`${GAME}/sky`);
  await page.getByRole('button', { name: /^보스전/ }).click();
  await skipStory(page);
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await finishSession(page);
  const ending = page.getByRole('dialog', { name: '엔딩' });
  await expect(ending).toBeVisible();
  await expect(ending).toContainText('구름성');
  await skipStory(page);
  await page.getByRole('dialog').getByRole('button', { name: /지도로/ }).click();
  await expect(page.getByText('한글 나라를 모두 되찾았어요')).toBeVisible();
  await page.getByRole('link', { name: /한글 도감/ }).click();
  await expect(page.getByLabel('한글 용사 인증서')).toBeVisible();
  expect((await heroState(page)).endingSeen).toBe(true);
});

test('한국어 음성이 있으면 듣기 문제는 🔊 버튼으로 보인다 (글자를 미리 보여주지 않음)', async ({ page }) => {
  await page.addInitScript(() => {
    const synth = window.speechSynthesis;
    if (synth) synth.getVoices = () => [{ lang: 'ko-KR', name: 'test', default: true, localService: true, voiceURI: 'test' } as SpeechSynthesisVoice];
  });
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByRole('button', { name: '다시 듣기' })).toBeVisible();
  await expect(page.getByLabel(/^문제 /)).toBeHidden();
});

test('새로고침하면 진행 중 단계는 멈춤 → 계속하기', async ({ page }) => {
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await solveCurrent(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '▶ 계속하기' })).toBeVisible();
  await page.getByRole('button', { name: '▶ 계속하기' }).click();
  await solveCurrent(page);
});

/** 읽어 준 말을 모아 둔다 (음성이 있든 없든) */
const recordSpeech = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __said: string[]; SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance };
    w.__said = [];
    const Orig = w.SpeechSynthesisUtterance;
    w.SpeechSynthesisUtterance = class extends Orig {
      constructor(text?: string) {
        super(text);
        w.__said.push(text ?? '');
      }
    };
  });
const said = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __said: string[] }).__said.splice(0));

test('보기를 눌러도 보기 이름을 읽지 않고, 맞혀도 정답을 다시 읽지 않는다 (다음 문제만 읽어 줌)', async ({ page }) => {
  await recordSpeech(page);
  await seed(page);
  await page.goto(`${GAME}/consonant`);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said.length)).toBeGreaterThan(0);
  await said(page); // 첫 문제 읽기
  await chooseWrong(page);
  await page.waitForTimeout(300);
  expect(await said(page)).toEqual([]);
  await solveCurrent(page);
  const s = (await heroState(page)).session! as unknown as { questions: { prompt: { say?: string } }[] };
  await expect.poll(async () => (await page.evaluate(() => (window as unknown as { __said: string[] }).__said)).length).toBeGreaterThan(0);
  expect(await said(page)).toEqual([s.questions[1].prompt.say]);
});

test('반대말 다리: 숲 다음에 열리고, 반대말 고르기·문장 채우기를 풀면 도감에 짝꿍이 모인다', async ({ page }) => {
  await seed(page, { cleared: 5, introSeen: false });
  await page.goto(GAME);
  await expect(region(page, 7, '문장 하늘')).toBeDisabled();
  await region(page, 6, '반대말 다리').click();
  await expect(page.getByRole('dialog', { name: '반대말 다리' })).toContainText('짝꿍');
  await skipStory(page);
  await page.getByRole('button', { name: /^1단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByText('반대말을 찾아 줘!')).toBeVisible();
  await expect(page.getByRole('group', { name: '보기' }).getByRole('button')).toHaveCount(3);
  await finishSession(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('1단계 성공');
  await expect(dialog).toContainText('↔');
  await dialog.getByRole('button', { name: '다음 단계 ▶' }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByText('반대말로 빈칸을 채워 줘!')).toBeVisible();
  await expect(page.getByText(/___/)).toBeVisible();
  await expect(page.getByRole('group', { name: '보기' }).getByRole('button')).toHaveCount(2);
  await solveCurrent(page);
  await page.goto(`${GAME}/book`);
  await expect(page.getByRole('heading', { name: /반대말 짝꿍/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /↔/ }).first()).toBeEnabled();
});

test('새 지역이 중간에 생겨도 이미 놀던 문장 하늘은 잠기지 않는다', async ({ page }) => {
  await seed(page, { cleared: 5 });
  await page.goto('./manifest.webmanifest');
  await page.evaluate(() => {
    const k = 'ideun.hangul-hero';
    const d = JSON.parse(localStorage.getItem(k)!);
    d.state.progress.sky = { stars: [2, 0, 0], bossCleared: false, introSeen: true };
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.goto(GAME);
  await expect(region(page, 6, '반대말 다리')).toBeEnabled();
  await expect(region(page, 7, '문장 하늘')).toBeEnabled();
});

test('이야기 장면: 마왕 대사는 아주 낮고 느린 목소리로 읽는다', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __utter: { text: string; pitch: number; rate: number }[] };
    w.__utter = [];
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => void w.__utter.push({ text: u.text, pitch: u.pitch, rate: u.rate });
  });
  await seed(page, { prologueSeen: false });
  await page.goto(GAME);
  const story = page.getByRole('dialog', { name: '프롤로그' });
  await story.getByRole('button', { name: '다음 ▶' }).click(); // 뒤죽: "흥! 글자들이…"
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __utter: { text: string }[] }).__utter.some((u) => u.text.includes('재미없어'))))
    .toBe(true);
  const lines = await page.evaluate(() => (window as unknown as { __utter: { text: string; pitch: number; rate: number }[] }).__utter);
  const villain = lines.find((u) => u.text.includes('재미없어'))!;
  const narrator = lines.find((u) => u.text.includes('한글 나라'))!;
  expect(villain.pitch).toBeLessThan(0.6);
  expect(villain.pitch).toBeLessThan(narrator.pitch);
  expect(villain.rate).toBeLessThan(narrator.rate);
});

test('낱말 숲 3단계: 무리 고르기·하나만 다른 것 찾기를 끝까지 풀고, 도감은 무리별로 나뉜다', async ({ page }) => {
  await seed(page, { cleared: 4 });
  await page.evaluate(() => {
    const k = 'ideun.hangul-hero';
    const d = JSON.parse(localStorage.getItem(k)!);
    d.state.progress.forest = { stars: [3, 3, 0], bossCleared: false, introSeen: true };
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.goto(`${GAME}/forest`);
  await page.getByRole('button', { name: /^3단계/ }).click();
  await page.getByRole('button', { name: '▶ 시작하기' }).click();
  await expect(page.getByText(/찾아 줘!|다른 하나는\?/).first()).toBeVisible();
  await expect(page.getByRole('group', { name: '보기' }).getByRole('button')).toHaveCount(4);
  await finishSession(page);
  await expect(page.getByRole('dialog')).toContainText('3단계 성공');
  await page.goto(`${GAME}/book`);
  await expect(page.getByRole('heading', { name: /과일/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /탈것/ })).toBeVisible();
});
