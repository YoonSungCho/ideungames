import { beforeEach, describe, expect, it } from 'vitest';
import { makeMathQuestion } from './engine/mathQuestions';
import { makeMon } from './engine/monster';
import { createRng } from './engine/rng';
import { nextGoal, useHangulMonster } from './store';

const S = () => useHangulMonster.getState();

beforeEach(() => {
  S().newGame();
  useHangulMonster.setState({ dialog: null });
});

describe('다음 목표', () => {
  it('첫 친구 → 졸개 → 체육관 6곳 → 성 → 도감', () => {
    expect(nextGoal(S()).text).toContain('연구소');
    useHangulMonster.setState({ party: [makeMon('giyeok', 5)] });
    expect(nextGoal(S()).text).toContain('졸개');
    useHangulMonster.setState({ defeated: ['grunt0'] });
    expect(nextGoal(S())).toMatchObject({ map: 'forest' });
    expect(nextGoal(S()).text).toContain('자음 관장');
    useHangulMonster.setState({ badges: 4 });
    expect(nextGoal(S())).toMatchObject({ map: 'mountain' });
    useHangulMonster.setState({ badges: 6 });
    expect(nextGoal(S())).toMatchObject({ map: 'castle' });
    useHangulMonster.setState({ champion: true });
    expect(nextGoal(S()).text).toContain('도감');
  });
});

describe('미니 게임 보상', () => {
  it('스도쿠 상자: 풀면 열리고 선물, 다시는 안 보인다', () => {
    useHangulMonster.setState({ mini: 'forest-box' });
    const balls = S().items.ball;
    S().finishMini({ won: true });
    expect(S().items.ball).toBe(balls + 3);
    expect(S().picked).toContain('forest-box');
    expect(S().dialog?.lines[0].text).toContain('상자가 열렸다');
  });

  it('그만하면 상자는 그대로', () => {
    useHangulMonster.setState({ mini: 'forest-box' });
    S().closeMini();
    expect(S().picked).not.toContain('forest-box');
    expect(S().mini).toBeNull();
  });

  it('숫자 비: 점수 × 3 코인, 목표를 처음 넘으면 선물 (두 번째엔 코인만)', () => {
    const c0 = S().coins;
    useHangulMonster.setState({ mini: 'forest-rain' });
    S().finishMini({ won: true, score: 12 });
    expect(S().coins).toBe(c0 + 36);
    expect(S().picked).toContain('forest-rain:clear');
    const balls = S().items.ball;
    useHangulMonster.setState({ mini: 'forest-rain' });
    S().finishMini({ won: true, score: 11 });
    expect(S().items.ball).toBe(balls);
  });

  it('빠른 계산: 빨리 풀수록 코인이 많다', () => {
    useHangulMonster.setState({ mini: 'beach-quiz' });
    const c0 = S().coins;
    S().finishMini({ won: true, ms: 30_000 });
    expect(S().coins - c0).toBe(140);
  });
});

describe('숫자·계산 문제', () => {
  it('개수 세기 보기는 1~9, 계산 답이 맞다', () => {
    const rng = createRng(4);
    for (let i = 0; i < 200; i++) {
      const q = makeMathQuestion('count', rng, 4);
      expect(q.options.every((o) => Number(o) >= 1 && Number(o) <= 9)).toBe(true);
      expect([...q.prompt.emoji!].length).toBe(Number(q.answer) * [...[...q.prompt.emoji!][0]].length);
      const d = makeMathQuestion('div', rng, 4);
      const [a, b] = d.prompt.big!.replace(' = ?', '').split(' ÷ ').map(Number);
      expect(a / b).toBe(Number(d.answer));
    }
  });
});
