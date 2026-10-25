import { beforeEach, describe, expect, it } from 'vitest';
import { peekMs, useMemoryCards } from './store';

const S = () => useMemoryCards.getState();
const partner = (i: number) => S().session!.cards.findIndex((c, k) => k !== i && c.pair === S().session!.cards[i].pair);

beforeEach(() => {
  useMemoryCards.setState({ records: {}, session: null });
  S().newGame({ theme: 'animal', level: 'tiny', rule: 'same' });
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
