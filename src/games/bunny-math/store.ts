import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { CHAPTERS, chapterById, TASKS_PER_LESSON } from './data/chapters';
import { firstPhase, type Phase } from './engine/prompts';
import { createRng, type Rng } from './engine/rng';
import { answerOf, makeTask, stepPath } from './engine/tasks';
import type { Spec, Task } from './engine/types';
import type { ItemId, FriendId } from './data/items';

/** 섞어 놀기 판의 열쇠 */
export const MIX = 'mix';

export interface Session {
  /** "field:0" (단원:단계) 또는 섞어 놀기 */
  key: string;
  tasks: Task[];
  index: number;
  /** 지금 문제에서 틀린 횟수 (2번이면 정답을 보여 줌) */
  tries: number;
  mistakes: number;
  phase: Phase;
  /** 맞혀서 다음 문제로 넘어가기 직전 */
  solved: boolean;
  done: boolean;
  /** 잘하면 올라가고 헤매면 내려가는 난이도 (0~1) */
  level: number;
  /**
   * 누른 물건 (순서대로):
   * count = 센 물건, make = 바구니에 든 물건, story = 넣은(+)/준(−) 물건, ten = 채운 칸
   */
  marks: number[];
  /** 수 길에서 토리가 지나온 돌 (처음 자리부터) */
  path: number[];
  /** 이번 판에 모은 당근 */
  earned: number;
  stars?: number;
  /** 이 판으로 단원을 처음 다 깼다 */
  chapterDone?: boolean;
}

export interface BunnyEvent {
  kind: 'tap' | 'untap' | 'hop' | 'correct' | 'wrong' | 'reveal' | 'clear' | 'bump';
  value?: number;
  key: number;
}

interface State {
  player: string;
  /** 단계별 별 (열쇠 "field:0") */
  stars: Record<string, number>;
  /** 단계별 난이도 — 다음에 다시 할 때 이어서 */
  levels: Record<string, number>;
  /** 지금까지 모은 당근 (맞힌 문제 수) */
  carrots: number;
  seen: string[];
  unlockAll: boolean;
  session: Session | null;
  event: BunnyEvent | null;

  setPlayer: (name: string) => void;
  markSeen: (id: string) => void;
  setUnlockAll: (on: boolean) => void;
  startLesson: (chapterId: string, lesson: number) => void;
  startMix: () => void;
  tapItem: (i: number) => void;
  untapItem: (i: number) => void;
  submit: () => void;
  hop: (dir: 1 | -1) => void;
  tapStone: (n: number) => void;
  choose: (v: number) => void;
  next: () => void;
  quit: () => void;
}

export const lessonKey = (chapterId: string, lesson: number) => `${chapterId}:${lesson}`;
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
export const currentTask = (s: Session) => s.tasks[s.index];

export const chapterStars = (stars: Record<string, number>, chapterId: string) =>
  chapterById(chapterId)!.lessons.reduce((n, _, i) => n + (stars[lessonKey(chapterId, i)] ?? 0), 0);
export const isChapterDone = (stars: Record<string, number>, chapterId: string) => chapterById(chapterId)!.lessons.every((_, i) => (stars[lessonKey(chapterId, i)] ?? 0) > 0);
export const isChapterOpen = (st: Pick<State, 'stars' | 'unlockAll'>, index: number) =>
  st.unlockAll || index === 0 || isChapterDone(st.stars, CHAPTERS[index - 1].id) || chapterStars(st.stars, CHAPTERS[index].id) > 0;
export const isLessonOpen = (st: Pick<State, 'stars' | 'unlockAll'>, chapterId: string, lesson: number) =>
  st.unlockAll || lesson === 0 || (st.stars[lessonKey(chapterId, lesson - 1)] ?? 0) > 0 || (st.stars[lessonKey(chapterId, lesson)] ?? 0) > 0;
export const totalStars = (stars: Record<string, number>) => Object.values(stars).reduce((a, b) => a + b, 0);
/** 다 깬 단계들 (섞어 놀기 재료) */
export const clearedLessons = (stars: Record<string, number>) =>
  CHAPTERS.flatMap((c) => c.lessons.map((_, i) => lessonKey(c.id, i))).filter((k) => (stars[k] ?? 0) > 0);
/** 다음에 할 단계: 열려 있고 아직 별이 없는 첫 단계 */
export function nextLesson(st: Pick<State, 'stars' | 'unlockAll'>): { chapter: string; lesson: number } | null {
  for (const [ci, c] of CHAPTERS.entries()) {
    if (!isChapterOpen(st, ci)) continue;
    for (let i = 0; i < c.lessons.length; i++) if (!(st.stars[lessonKey(c.id, i)] ?? 0) && isLessonOpen(st, c.id, i)) return { chapter: c.id, lesson: i };
  }
  return null;
}
/** 진행 중인 판이 있는가 (하나라도 풀었을 때) */
export const hasProgress = (s: Session | null) => !!s && !s.done && (s.index > 0 || s.marks.length > 0 || s.tries > 0 || s.path.length > 1);

let eventKey = 0;
const ev = (kind: BunnyEvent['kind'], value?: number): BunnyEvent => ({ kind, value, key: ++eventKey });
const rng: Rng = createRng();

interface Source {
  spec: Spec;
  items: readonly ItemId[];
  friend: FriendId;
}

/** 이 판에서 낼 문제 재료 (단계는 설정을 돌려 가며, 섞어 놀기는 다 깬 단계에서 골고루) */
function sourceFor(key: string, index: number, stars: Record<string, number>): Source {
  if (key === MIX) {
    const pool = clearedLessons(stars);
    const k = pool[Math.floor(rng() * pool.length)] ?? lessonKey('field', 0);
    return sourceFor(k, Math.floor(rng() * 4), stars);
  }
  const [cid, li] = key.split(':');
  const c = chapterById(cid)!;
  const specs = c.lessons[Number(li)].specs;
  return { spec: specs[index % specs.length], items: c.items, friend: c.friend === 'tori' ? 'squirrel' : c.friend };
}

/** 바로 앞 문제와 똑같은 문제는 피한다 */
function freshTask(key: string, index: number, level: number, stars: Record<string, number>, prev?: Task): Task {
  let t: Task;
  for (let k = 0; ; k++) {
    const src = sourceFor(key, index, stars);
    t = makeTask(src.spec, rng, level, src);
    if (!prev || k > 8 || answerOf(t) !== answerOf(prev) || t.kind !== prev.kind) return t;
  }
}

function startPath(t: Task): number[] {
  if (t.kind === 'hop' || t.kind === 'land') return [t.from];
  if (t.kind === 'story' || t.kind === 'calc') return [t.a];
  return [];
}

const newSession = (key: string, level: number, stars: Record<string, number>): Session => {
  const first = freshTask(key, 0, level, stars);
  return { key, tasks: [first], index: 0, tries: 0, mistakes: 0, phase: firstPhase(first), solved: false, done: false, level, marks: [], path: startPath(first), earned: 0 };
};

export const useBunnyMath = create<State>()(
  persist(
    (set, get) => {
      const live = () => {
        const s = get().session;
        return s && !s.done && !s.solved ? s : null;
      };

      const correct = (s: Session, extra: Partial<Session> = {}) => {
        playSound('place');
        const level = s.tries === 0 ? Math.min(1, s.level + 0.12) : s.tries >= 2 ? Math.max(0, s.level - 0.25) : s.level;
        set({ session: { ...s, ...extra, solved: true, level, earned: s.earned + 1 }, carrots: get().carrots + 1, event: ev('correct') });
      };

      const wrong = (s: Session, value?: number, extra: Partial<Session> = {}) => {
        playSound('wrong');
        const tries = s.tries + 1;
        set({ session: { ...s, ...extra, tries, mistakes: s.mistakes + 1 }, event: ev(tries >= 2 ? 'reveal' : 'wrong', value) });
      };

      const finish = (s: Session): Partial<State> => {
        playSound('win');
        if (s.key === MIX) return { session: { ...s, solved: false, done: true, stars: starsFor(s.mistakes) }, event: ev('clear') };
        const stars = starsFor(s.mistakes);
        const [cid] = s.key.split(':');
        const wasDone = isChapterDone(get().stars, cid);
        const all = { ...get().stars, [s.key]: Math.max(get().stars[s.key] ?? 0, stars) };
        return {
          stars: all,
          levels: { ...get().levels, [s.key]: s.level },
          session: { ...s, solved: false, done: true, stars, chapterDone: !wasDone && isChapterDone(all, cid) },
          event: ev('clear'),
        };
      };

      return {
        player: '이서',
        stars: {},
        levels: {},
        carrots: 0,
        seen: [],
        unlockAll: false,
        session: null,
        event: null,

        setPlayer: (player) => set({ player: player.trim().slice(0, 8) || '이서' }),
        markSeen: (id) => !get().seen.includes(id) && set({ seen: [...get().seen, id] }),
        setUnlockAll: (unlockAll) => set({ unlockAll }),

        startLesson: (chapterId, lesson) => {
          const key = lessonKey(chapterId, lesson);
          // 처음엔 범위의 가운데보다 조금 쉽게
          set({ session: newSession(key, get().levels[key] ?? 0.3, get().stars), event: null });
        },

        startMix: () => set({ session: newSession(MIX, 0.6, get().stars), event: null }),

        tapItem: (i) => {
          const s = live();
          if (!s || s.phase !== 'act') return;
          const t = currentTask(s);
          if (s.marks.includes(i)) {
            // 이미 센 것: 한 번만 센다 (하나에 수 하나)
            if (t.kind === 'make') return get().untapItem(i);
            return set({ event: ev('bump', i) });
          }
          const marks = [...s.marks, i];
          playSound('tap', 1 + marks.length * 0.04);
          switch (t.kind) {
            case 'count':
              if (i >= t.n) return;
              set({ session: { ...s, marks, phase: marks.length === t.n ? 'answer' : 'act' }, event: ev('tap', marks.length) });
              return;
            case 'make':
              if (i >= t.field) return;
              set({ session: { ...s, marks }, event: ev('tap', marks.length) });
              return;
            case 'story': {
              // 받으면 앞으로, 주면 뒤로 한 칸 — 물건 수와 토리 자리가 늘 같다
              if (t.op === '+' ? i >= t.b : i >= t.a) return;
              const pos = s.path[s.path.length - 1] + (t.op === '+' ? 1 : -1);
              set({ session: { ...s, marks, path: [...s.path, pos], phase: marks.length === t.b ? 'answer' : 'act' }, event: ev('tap', pos) });
              return;
            }
            case 'ten':
              if (i < t.a || i >= 10) return;
              set({ session: { ...s, marks, phase: marks.length === 10 - t.a ? 'answer' : 'act' }, event: ev('tap', marks.length) });
              return;
          }
        },

        untapItem: (i) => {
          const s = live();
          if (!s || s.phase !== 'act' || currentTask(s).kind !== 'make' || !s.marks.includes(i)) return;
          playSound('erase');
          const marks = s.marks.filter((m) => m !== i);
          set({ session: { ...s, marks }, event: ev('untap', marks.length) });
        },

        /** "다 담았어!" */
        submit: () => {
          const s = live();
          if (!s) return;
          const t = currentTask(s);
          if (t.kind !== 'make') return;
          if (s.marks.length === t.n) correct(s);
          else wrong(s, s.marks.length);
        },

        hop: (dir) => {
          const s = live();
          if (!s) return;
          const t = currentTask(s);
          const pos = s.path[s.path.length - 1];
          if (t.kind === 'hop') {
            if (dir !== t.dir) return wrong(s, pos);
            const to = pos + dir;
            if (to < t.view.lo || to > t.view.hi) return set({ event: ev('bump', pos) });
            const path = stepPath(s.path, to);
            playSound('select', 1 + (path.length - 1) * 0.06);
            if (path.length - 1 === t.k) return correct(s, { path });
            return set({ session: { ...s, path }, event: ev('hop', path.length - 1) });
          }
          // 식 문제: 토리를 마음대로 뛰게 해서 세어 볼 수 있다 (정답 확인은 숫자 보기로)
          if (t.kind === 'calc') {
            const to = pos + dir;
            if (to < t.view.lo || to > t.view.hi) return set({ event: ev('bump', pos) });
            playSound('select');
            const path = stepPath(s.path, to);
            return set({ session: { ...s, path }, event: ev('hop', path.length - 1) });
          }
        },

        tapStone: (n) => {
          const s = live();
          if (!s) return;
          const t = currentTask(s);
          const pos = s.path[s.path.length - 1];
          if (t.kind === 'land') {
            if (n === answerOf(t)) {
              // 맞히면 토리가 한 칸씩 뛰어 확인
              const path = Array.from({ length: t.k + 1 }, (_, i) => t.from + t.dir * i);
              return correct(s, { path });
            }
            return wrong(s, n);
          }
          if (t.kind === 'hop' || t.kind === 'calc') {
            if (n === pos) return;
            // 토리는 한 번에 한 칸씩만 — 멀리 있는 돌을 바로 누르면 알려 준다
            if (Math.abs(n - pos) !== 1) return t.kind === 'hop' ? wrong(s, n) : set({ event: ev('bump', n) });
            return get().hop(n > pos ? 1 : -1);
          }
        },

        choose: (v) => {
          const s = live();
          if (!s || s.phase !== 'answer') return;
          const t = currentTask(s);
          if (t.kind === 'hop' || t.kind === 'land' || t.kind === 'make') return;
          if (v === answerOf(t)) return correct(s);
          // 정답을 보여 준 뒤에는 정답만 누를 수 있게
          if (s.tries >= 2) return;
          wrong(s, v);
        },

        /** 정답 애니메이션이 끝나면 화면이 부른다 */
        next: () => {
          const s = get().session;
          if (!s || !s.solved) return;
          if (s.index + 1 >= TASKS_PER_LESSON) return set(finish(s));
          const t = freshTask(s.key, s.index + 1, s.level, get().stars, currentTask(s));
          set({ session: { ...s, tasks: [...s.tasks, t], index: s.index + 1, tries: 0, solved: false, phase: firstPhase(t), marks: [], path: startPath(t) }, event: null });
        },

        quit: () => set({ session: null, event: null }),
      };
    },
    {
      name: storageKey('bunny-math'),
      version: 1,
      partialize: (s) => ({ player: s.player, stars: s.stars, levels: s.levels, carrots: s.carrots, seen: s.seen, unlockAll: s.unlockAll, session: s.session }),
    },
  ),
);
