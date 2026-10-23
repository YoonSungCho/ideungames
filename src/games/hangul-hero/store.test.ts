import { beforeEach, describe, expect, it } from 'vitest';
import { BOSS_HP, STAGE_QUESTIONS } from './data/regions';
import { answerOf } from './engine/questions';
import { currentQuestion, isRegionOpen, isStageOpen, regionProgress, useHangulHero } from './store';

const s = () => useHangulHero.getState();

/** 지금 문제를 맞힌다 (보기/짓기/순서 모두) */
function solve() {
  const q = currentQuestion(s().session!);
  if (q.kind === 'choice') s().choose(q.answer);
  else if (q.kind === 'build') {
    s().pickBuild('cho', q.answer.cho);
    s().pickBuild('jung', q.answer.jung);
  } else q.answer.forEach((w) => s().tapTile(q.tiles.findIndex((t, i) => t === w && !s().session!.order.includes(i))));
  s().next();
}

function wrongOnce() {
  const q = currentQuestion(s().session!);
  if (q.kind === 'choice') s().choose(q.options.find((o) => o !== q.answer)!);
}

describe('한글 용사 진행', () => {
  beforeEach(() => {
    localStorage.clear();
    useHangulHero.setState({ progress: {}, pieces: [], bossBooks: {}, session: null });
  });

  it('처음엔 첫 지역·첫 단계만 열려 있다', () => {
    expect(isRegionOpen(s().progress, 0)).toBe(true);
    expect(isRegionOpen(s().progress, 1)).toBe(false);
    const p = regionProgress(s().progress, 'consonant');
    expect(isStageOpen(p, 0)).toBe(true);
    expect(isStageOpen(p, 1)).toBe(false);
    expect(isStageOpen(p, 'boss')).toBe(false);
  });

  it('시작 전에는 답을 받지 않는다', () => {
    s().startStage('consonant', 0);
    const q = currentQuestion(s().session!);
    s().choose(answerOf(q));
    expect(s().session!.solved).toBe(false);
  });

  it('단계를 다 맞히면 별 3개, 다음 단계가 열리고 도감 조각이 모인다', () => {
    s().startStage('consonant', 0);
    s().start();
    for (let i = 0; i < STAGE_QUESTIONS; i++) solve();
    expect(s().session).toMatchObject({ status: 'done', stars: 3 });
    const p = regionProgress(s().progress, 'consonant');
    expect(p.stars[0]).toBe(3);
    expect(isStageOpen(p, 1)).toBe(true);
    expect(s().pieces.some((x) => x.startsWith('c:'))).toBe(true);
    expect(s().session!.newPieces.length).toBeGreaterThan(0);
  });

  it('두 번 틀리면 정답 공개 → 다른 오답은 무시, 정답만 받는다', () => {
    s().startStage('consonant', 0);
    s().start();
    wrongOnce();
    expect(s().event!.kind).toBe('wrong');
    wrongOnce();
    expect(s().event!.kind).toBe('reveal');
    wrongOnce();
    expect(s().session!.mistakes).toBe(2);
    solve();
    expect(s().session!.index).toBe(1);
  });

  it('실수가 많으면 별이 줄지만 다시 하면 최고 별이 남는다', () => {
    s().startStage('consonant', 0);
    s().start();
    for (let i = 0; i < STAGE_QUESTIONS; i++) {
      wrongOnce();
      solve();
    }
    expect(s().session!.stars).toBe(1);
    s().startStage('consonant', 0);
    s().start();
    for (let i = 0; i < STAGE_QUESTIONS; i++) solve();
    expect(regionProgress(s().progress, 'consonant').stars[0]).toBe(3);
  });

  it('보스: 맞힐 때마다 체력이 줄고, 0이 되면 지역 해방 + 다음 지역 열림 + 기록', () => {
    useHangulHero.setState({ progress: { consonant: { stars: [3, 3, 3], bossCleared: false, introSeen: true } } });
    s().startStage('consonant', 'boss');
    s().start();
    let guard = 0;
    while (s().session!.status !== 'done' && guard++ < 30) {
      s().tick(5000);
      solve();
    }
    expect(s().session!.hp).toBe(0);
    expect(regionProgress(s().progress, 'consonant').bossCleared).toBe(true);
    expect(isRegionOpen(s().progress, 1)).toBe(true);
    expect(s().bossBooks.consonant.plays).toBe(1);
    expect(guard).toBeLessThanOrEqual(Math.ceil(BOSS_HP / 14));
  });

  it('글자 짓기·문장 순서: 틀리면 고른 것이 비워진다', () => {
    s().startStage('castle', 1); // build
    s().start();
    const q = currentQuestion(s().session!);
    if (q.kind !== 'build') throw new Error('build expected');
    s().pickBuild('cho', q.cho.find((c) => c !== q.answer.cho)!);
    s().pickBuild('jung', q.answer.jung);
    expect(s().session!.build).toEqual({});
    expect(s().session!.mistakes).toBe(1);

    s().startStage('sky', 1); // order
    s().start();
    const o = currentQuestion(s().session!);
    if (o.kind !== 'order') throw new Error('order expected');
    const wrongFirst = o.tiles.findIndex((t) => t !== o.answer[0]);
    s().tapTile(wrongFirst);
    s().undoTile();
    expect(s().session!.order).toEqual([]);
  });
});
