import { beforeEach, describe, expect, it } from 'vitest';
import { peekMs, useMemoryCards } from './store';

const S = () => useMemoryCards.getState();
const partner = (i: number) => S().session!.cards.findIndex((c, k) => k !== i && c.pair === S().session!.cards[i].pair);

beforeEach(() => {
  useMemoryCards.setState({ records: {}, session: null });
  S().newGame({ theme: 'animal', level: 'tiny', rule: 'same', players: 1 });
});

describe('한 판', () => {
  it('시작 전에는 못 뒤집고, 시작하면 잠깐 다 보여 준 다음부터 시간이 흐른다', () => {
    S().flipCard(0);
    expect(S().session!.open).toEqual([]);
    S().start();
    S().flipCard(0); // 미리 보기 중
    expect(S().session!.open).toEqual([]);
    S().tick(peekMs('tiny') - 100);
    expect(S().session!.elapsedMs).toBe(0);
    S().tick(100);
    S().tick(500);
    expect(S().session!.elapsedMs).toBe(500);
    S().flipCard(0);
    expect(S().session!.open).toEqual([0]);
  });

  it('멈추면 시간도 카드도 멈춘다', () => {
    S().start();
    S().tick(peekMs('tiny'));
    S().pause();
    S().tick(1000);
    S().flipCard(0);
    expect(S().session).toMatchObject({ elapsedMs: 0, open: [] });
  });

  it('다 찾으면 기록이 남는다', () => {
    S().start();
    S().tick(peekMs('tiny'));
    S().tick(4000);
    for (let i = 0; i < 6; i++) {
      if (S().session!.matched[i]) continue;
      S().flipCard(i);
      S().flipCard(partner(i));
    }
    expect(S().session).toMatchObject({ status: 'done', rank: 1 });
    expect(S().records['tiny:same']).toMatchObject({ plays: 1, best: 4000 });
    expect(S().event).toMatchObject({ kind: 'won' });
  });

  it('틀린 두 장은 hideMiss로 닫힌다', () => {
    S().start();
    S().tick(peekMs('tiny'));
    const other = S().session!.cards.findIndex((c, k) => k > 0 && c.pair !== S().session!.cards[0].pair);
    S().flipCard(0);
    S().flipCard(other);
    expect(S().session!.open).toHaveLength(2);
    S().hideMiss();
    expect(S().session!.open).toEqual([]);
  });
});

describe('둘이서 대결', () => {
  const play = () => {
    S().newGame({ level: 'easy', rule: 'same', players: 2, rival: 'mom' });
    S().start();
    S().tick(peekMs('easy'));
  };
  const stranger = (i: number) => S().session!.cards.findIndex((c, k) => k !== i && !S().session!.matched[k] && c.pair !== S().session!.cards[i].pair);

  it('짝을 찾으면 내 점수가 오르고 한 번 더, 틀리면 상대 차례', () => {
    play();
    S().flipCard(0);
    S().flipCard(partner(0));
    expect(S().session).toMatchObject({ turn: 0, scores: [1, 0] });
    const i = S().session!.matched.findIndex((m) => !m);
    S().flipCard(i);
    S().flipCard(stranger(i));
    expect(S().session).toMatchObject({ turn: 1, scores: [1, 0] });
    expect(S().event).toMatchObject({ kind: 'miss', turn: 1 });
    S().hideMiss();
    S().flipCard(i);
    S().flipCard(partner(i));
    expect(S().session).toMatchObject({ turn: 1, scores: [1, 1] });
  });

  it('다 찾으면 끝나지만 시간 기록은 남기지 않는다', () => {
    play();
    for (let i = 0; i < S().session!.cards.length; i++) {
      if (S().session!.matched[i]) continue;
      S().flipCard(i);
      S().flipCard(partner(i));
    }
    expect(S().session).toMatchObject({ status: 'done', scores: [6, 0] });
    expect(S().records).toEqual({});
    // 한 판 더: 진 사람(엄마)이 먼저
    S().newGame(S().session!);
    expect(S().session).toMatchObject({ status: 'ready', turn: 1, scores: [0, 0] });
  });
});

describe('계산식', () => {
  it('짝을 찾으면 식과 답을 읽어 준다', () => {
    S().newGame({ level: 'tiny', rule: 'math', players: 1 });
    S().start();
    S().tick(peekMs('tiny'));
    S().flipCard(0);
    S().flipCard(partner(0));
    const c = S().session!.cards[0];
    expect(S().event!.name).toMatch(/^\d+\+\d+=\d+$/);
    expect(S().event!.say).toContain('더하기');
    const [a, b] = c.sym.split('+').map(Number);
    expect(a + b).toBe(Number(c.name));
  });
});
