import { beforeEach, describe, expect, it } from 'vitest';
import { BLITZ_MS, currentProblem, recordKey, REVEAL_AFTER, SPRINT_COUNT, useQuickMath } from './store';

const s = () => useQuickMath.getState();
const answer = () => currentProblem(s().session!).answer;
const type = (n: number) => String(n).split('').forEach((d) => s().typeDigit(Number(d)));
/** 정답과 자릿수가 같은 오답 (9 → 10처럼 자릿수가 늘면 한 자리씩 따로 채점돼 두 번 틀린 셈이 된다) */
const wrongOf = (n: number) => (String(n + 1).length === String(n).length ? n + 1 : n - 1);

describe('빠른 계산 스토어', () => {
  beforeEach(() => {
    localStorage.clear();
    useQuickMath.setState({ records: {} });
    s().newGame({ mode: 'sprint', ops: ['add', 'sub'], difficulty: 'medium', dans: [] });
  });

  it('시작 전에는 입력도 시간도 없다', () => {
    s().typeDigit(1);
    s().tick(1000);
    expect(s().session!.input).toBe('');
    expect(s().session!.elapsedMs).toBe(0);
  });

  it('답의 자릿수만큼 치면 바로 채점, 맞으면 다음 문제', () => {
    s().start();
    type(answer());
    expect(s().session).toMatchObject({ index: 1, correct: 1, combo: 1, input: '' });
  });

  it('틀리면 입력이 지워지고 같은 문제, 두 번 틀리면 정답 공개 후 직접 입력해야 넘어감 (점수 없음)', () => {
    s().start();
    const a = answer();
    type(wrongOf(a));
    if (String(wrongOf(a)).length < String(a).length) s().submit();
    expect(s().session).toMatchObject({ index: 0, mistakes: 1, combo: 0, input: '' });
    type(wrongOf(a));
    if (String(wrongOf(a)).length < String(a).length) s().submit();
    expect(s().session!.tries).toBe(REVEAL_AFTER);
    expect(s().event!.kind).toBe('reveal');
    type(a);
    expect(s().session).toMatchObject({ index: 1, correct: 0 });
  });

  it('20문제를 다 풀면 끝나고 시간 기록이 남는다', () => {
    s().start();
    s().tick(30_000);
    for (let i = 0; i < SPRINT_COUNT; i++) type(answer());
    const session = s().session!;
    expect(session.status).toBe('done');
    expect(session.rank).toBe(1);
    const rec = s().records[recordKey(session)];
    expect(rec).toMatchObject({ plays: 1, best: 30_000 });
  });

  it('60초 모드: 시간이 다 되면 끝나고 정답 수가 기록된다', () => {
    s().newGame({ mode: 'blitz' });
    s().start();
    for (let i = 0; i < 5; i++) type(answer());
    s().tick(BLITZ_MS + 500);
    const session = s().session!;
    expect(session).toMatchObject({ status: 'done', correct: 5, elapsedMs: BLITZ_MS });
    expect(s().records[recordKey(session)]).toMatchObject({ best: 5 });
  });

  it('멈추면 입력·시간이 멈춘다', () => {
    s().start();
    s().pause();
    s().tick(1000);
    s().typeDigit(3);
    expect(s().session).toMatchObject({ elapsedMs: 0, input: '' });
  });

  it('기록 키는 연산 순서와 무관', () => {
    expect(recordKey({ mode: 'sprint', ops: ['sub', 'add'], dans: [], difficulty: 'easy' })).toBe(
      recordKey({ mode: 'sprint', ops: ['add', 'sub'], dans: [], difficulty: 'easy' }),
    );
  });
});
