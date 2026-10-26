import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAPTERS, TASKS_PER_LESSON } from './data/chapters';
import { answerOf } from './engine/tasks';
import type { Task } from './engine/types';
import { currentTask, isChapterOpen, isLessonOpen, nextLesson, useBunnyMath } from './store';

vi.mock('@/shared/sound/sfx', () => ({ playSound: () => {} }));

const st = () => useBunnyMath.getState();
const task = () => currentTask(st().session!);
/** 지금 문제의 세션을 원하는 문제로 바꾼다 */
function setTask(t: Task) {
  const s = st().session!;
  const path = t.kind === 'hop' || t.kind === 'land' ? [t.from] : t.kind === 'story' || t.kind === 'calc' ? [t.a] : [];
  const phase = t.kind === 'count' ? (t.tap ? 'act' : 'answer') : t.kind === 'make' || t.kind === 'hop' || t.kind === 'story' || t.kind === 'ten' ? 'act' : 'answer';
  useBunnyMath.setState({ session: { ...s, tasks: [...s.tasks.slice(0, s.index), t], marks: [], path, phase, tries: 0, solved: false } });
}

/** 지금 문제를 맞힌다 (아이가 하는 순서대로) */
function solve() {
  const t = task();
  switch (t.kind) {
    case 'count':
      if (t.tap) for (let i = 0; i < t.n; i++) st().tapItem(i);
      st().choose(t.n);
      break;
    case 'make':
      for (let i = 0; i < t.n; i++) st().tapItem(i);
      st().submit();
      break;
    case 'compare':
      st().choose(answerOf(t));
      break;
    case 'hop':
      for (let i = 0; i < t.k; i++) st().hop(t.dir);
      break;
    case 'land':
      st().tapStone(answerOf(t));
      break;
    case 'story':
      for (let i = 0; i < t.b; i++) st().tapItem(i);
      st().choose(answerOf(t));
      break;
    case 'calc':
      st().choose(answerOf(t));
      break;
    case 'ten':
      for (let i = t.a; i < 10; i++) st().tapItem(i);
      st().choose(answerOf(t));
      break;
  }
  expect(st().session!.solved).toBe(true);
  st().next();
}

beforeEach(() => {
  localStorage.clear();
  useBunnyMath.setState({ stars: {}, levels: {}, carrots: 0, seen: [], unlockAll: false, session: null, event: null, player: '이서' });
});

describe('단계 진행', () => {
  it('5문제를 다 풀면 별, 당근, 다음 단계가 열린다', () => {
    st().startLesson('field', 0);
    for (let k = 0; k < TASKS_PER_LESSON; k++) solve();
    const s = st().session!;
    expect(s.done).toBe(true);
    expect(s.stars).toBe(3);
    expect(st().stars['field:0']).toBe(3);
    expect(st().carrots).toBe(5);
    expect(isLessonOpen(st(), 'field', 1)).toBe(true);
    expect(isLessonOpen(st(), 'field', 2)).toBe(false);
  });

  it('모든 단원·단계가 끝까지 풀린다', () => {
    useBunnyMath.setState({ unlockAll: true });
    for (const c of CHAPTERS) {
      for (let l = 0; l < c.lessons.length; l++) {
        st().startLesson(c.id, l);
        for (let k = 0; k < TASKS_PER_LESSON; k++) solve();
        expect(st().session!.done).toBe(true);
      }
    }
    expect(Object.keys(st().stars)).toHaveLength(36);
  });

  it('단원 4단계를 다 깨면 친구가 오고 다음 단원이 열린다', () => {
    expect(isChapterOpen(st(), 1)).toBe(false);
    useBunnyMath.setState({ stars: { 'field:0': 2, 'field:1': 2, 'field:2': 1 } });
    st().startLesson('field', 3);
    for (let k = 0; k < TASKS_PER_LESSON; k++) solve();
    expect(st().session!.chapterDone).toBe(true);
    expect(isChapterOpen(st(), 1)).toBe(true);
    expect(nextLesson(st())).toEqual({ chapter: 'acorn', lesson: 0 });
    // 다시 깨면 처음이 아니다
    st().startLesson('field', 3);
    for (let k = 0; k < TASKS_PER_LESSON; k++) solve();
    expect(st().session!.chapterDone).toBe(false);
  });

  it('별은 더 좋은 기록만 남는다, 틀리면 별이 줄어든다', () => {
    useBunnyMath.setState({ stars: { 'field:0': 3 } });
    st().startLesson('field', 0);
    setTask({ id: 'x', kind: 'count', item: 'carrot', n: 3, layout: 'row', tap: false, spots: [], options: [2, 3, 4] });
    st().choose(2);
    st().choose(4);
    st().choose(3);
    st().next();
    for (let k = 1; k < TASKS_PER_LESSON; k++) solve();
    expect(st().session!.stars).toBe(2);
    expect(st().stars['field:0']).toBe(3);
  });
});

describe('문제별 규칙', () => {
  beforeEach(() => st().startLesson('field', 0));

  it('세기: 같은 것을 두 번 눌러도 한 번만 센다, 다 세야 보기를 고를 수 있다', () => {
    setTask({ id: 'x', kind: 'count', item: 'carrot', n: 3, layout: 'row', tap: true, spots: [], options: [2, 3, 4] });
    st().tapItem(0);
    st().tapItem(0);
    expect(st().session!.marks).toEqual([0]);
    st().choose(3);
    expect(st().session!.solved).toBe(false);
    st().tapItem(1);
    st().tapItem(2);
    expect(st().session!.phase).toBe('answer');
    st().choose(3);
    expect(st().session!.solved).toBe(true);
  });

  it('두 번 틀리면 정답 공개, 그 뒤엔 정답만 눌린다', () => {
    setTask({ id: 'x', kind: 'calc', op: '+', a: 3, b: 2, missing: false, view: { lo: 0, hi: 10 }, options: [4, 5, 6] });
    st().choose(4);
    expect(st().event!.kind).toBe('wrong');
    st().choose(6);
    expect(st().event!.kind).toBe('reveal');
    st().choose(4);
    expect(st().session!.tries).toBe(2);
    st().choose(5);
    expect(st().session!.solved).toBe(true);
  });

  it('바구니: 넣고 빼고, 개수가 맞아야 정답', () => {
    setTask({ id: 'x', kind: 'make', item: 'apple', n: 3, field: 5, spots: [] });
    for (const i of [0, 1, 2, 3]) st().tapItem(i);
    st().submit();
    expect(st().session!.solved).toBe(false);
    expect(st().event!.kind).toBe('wrong');
    st().tapItem(3); // 바구니에서 다시 빼기
    expect(st().session!.marks).toEqual([0, 1, 2]);
    st().submit();
    expect(st().session!.solved).toBe(true);
  });

  it('깡충: 한 칸씩, 반대쪽은 틀림, 멀리 있는 돌을 바로 누르면 틀림', () => {
    setTask({ id: 'x', kind: 'hop', from: 3, k: 2, dir: 1, view: { lo: 0, hi: 10 } });
    st().hop(-1);
    expect(st().session!.tries).toBe(1);
    expect(st().session!.path).toEqual([3]);
    st().tapStone(5);
    expect(st().session!.tries).toBe(2);
    st().tapStone(4);
    expect(st().session!.path).toEqual([3, 4]);
    st().hop(1);
    expect(st().session!.path).toEqual([3, 4, 5]);
    expect(st().session!.solved).toBe(true);
  });

  it('도착 맞히기: 맞히면 토리가 한 칸씩 뛰는 길이 생긴다', () => {
    setTask({ id: 'x', kind: 'land', from: 6, k: 3, dir: -1, view: { lo: 0, hi: 10 } });
    st().tapStone(4);
    expect(st().session!.tries).toBe(1);
    st().tapStone(3);
    expect(st().session!.path).toEqual([6, 5, 4, 3]);
    expect(st().session!.solved).toBe(true);
  });

  it('이야기 더하기: 선물을 하나 넣을 때마다 토리가 앞으로 한 칸', () => {
    setTask({ id: 'x', kind: 'story', op: '+', a: 3, b: 2, item: 'carrot', who: 'bear', view: { lo: 0, hi: 10 }, options: [4, 5, 6] });
    st().tapItem(0);
    expect(st().session!.path).toEqual([3, 4]);
    st().tapItem(0);
    expect(st().session!.path).toEqual([3, 4]);
    st().tapItem(1);
    expect(st().session!.path).toEqual([3, 4, 5]);
    expect(st().session!.phase).toBe('answer');
    st().choose(5);
    expect(st().session!.solved).toBe(true);
  });

  it('이야기 빼기: 하나 줄 때마다 토리가 뒤로 한 칸', () => {
    setTask({ id: 'x', kind: 'story', op: '-', a: 5, b: 2, item: 'cheese', who: 'mouse', view: { lo: 0, hi: 10 }, options: [2, 3, 4] });
    st().tapItem(4);
    st().tapItem(1);
    expect(st().session!.path).toEqual([5, 4, 3]);
    st().choose(3);
    expect(st().session!.solved).toBe(true);
  });

  it('식: 토리를 마음대로 뛰게 해 볼 수 있고 답은 보기로', () => {
    setTask({ id: 'x', kind: 'calc', op: '+', a: 3, b: 2, missing: true, view: { lo: 0, hi: 10 }, options: [1, 2, 3] });
    st().hop(1);
    st().hop(1);
    st().hop(1);
    st().hop(-1);
    expect(st().session!.path).toEqual([3, 4, 5]);
    expect(st().session!.solved).toBe(false);
    st().choose(2);
    expect(st().session!.solved).toBe(true);
  });

  it('10 만들기: 빈칸만 채우고, 다 채워야 보기', () => {
    setTask({ id: 'x', kind: 'ten', a: 7, options: [2, 3, 4] });
    st().tapItem(2); // 이미 알이 있는 칸
    expect(st().session!.marks).toEqual([]);
    for (const i of [7, 8, 9]) st().tapItem(i);
    expect(st().session!.phase).toBe('answer');
    st().choose(3);
    expect(st().session!.solved).toBe(true);
  });

  it('잘 맞히면 난이도가 오르고 다음에 이어서 시작한다', () => {
    const before = st().session!.level;
    solve();
    expect(st().session!.level).toBeGreaterThan(before);
  });
});

describe('섞어 놀기·잠금', () => {
  it('섞어 놀기는 다 깬 단계에서만 문제를 낸다', () => {
    useBunnyMath.setState({ stars: { 'stream:0': 3 } });
    st().startMix();
    for (let k = 0; k < TASKS_PER_LESSON; k++) {
      expect(task().kind).toBe('hop');
      solve();
    }
    expect(st().session!.done).toBe(true);
    expect(st().stars).toEqual({ 'stream:0': 3 });
  });

  it('모두 열기면 아무 단원·단계나 할 수 있다', () => {
    expect(isChapterOpen(st(), 8)).toBe(false);
    useBunnyMath.setState({ unlockAll: true });
    expect(isChapterOpen(st(), 8)).toBe(true);
    expect(isLessonOpen(st(), 'hill', 3)).toBe(true);
  });

  it('이름은 비우면 기본값, 8자까지', () => {
    st().setPlayer('  ');
    expect(st().player).toBe('이서');
    st().setPlayer('아주아주긴이름입니다요');
    expect(st().player).toHaveLength(8);
  });
});
