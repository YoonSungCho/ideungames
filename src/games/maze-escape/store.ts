import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addRun, type RecordBook } from '@/shared/game/records';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { canMove, DIRS, generate, neighbor, type Dir, type Maze } from './engine/maze';
import { createRng } from './engine/rng';

export type Level = 'tiny' | 'easy' | 'medium' | 'hard';
export const LEVELS: Level[] = ['tiny', 'easy', 'medium', 'hard'];
export const SIZE: Record<Level, number> = { tiny: 5, easy: 7, medium: 10, hard: 13 };

export type HeroId = 'rabbit' | 'dog' | 'penguin' | 'bee' | 'mouse';
export const HEROES: { id: HeroId; name: string; icon: string; goal: string; goalName: string }[] = [
  { id: 'rabbit', name: '토끼', icon: '🐰', goal: '🥕', goalName: '당근' },
  { id: 'dog', name: '강아지', icon: '🐶', goal: '🦴', goalName: '뼈다귀' },
  { id: 'penguin', name: '펭귄', icon: '🐧', goal: '🐟', goalName: '물고기' },
  { id: 'bee', name: '꿀벌', icon: '🐝', goal: '🌻', goalName: '해바라기' },
  { id: 'mouse', name: '생쥐', icon: '🐭', goal: '🧀', goalName: '치즈' },
];
export const hero = (id: HeroId) => HEROES.find((h) => h.id === id)!;

/** 도전 모드의 힌트 수 (쉬움 모드는 무제한) */
export const CHALLENGE_HINTS = 3;
export const HINT_MS = 2500;

export interface Setup {
  level: Level;
  hero: HeroId;
}

export interface Session extends Setup {
  status: 'ready' | 'playing' | 'done';
  maze: Maze;
  pos: number;
  /** 지나온 칸 (발자국) */
  trail: number[];
  got: number[];
  steps: number;
  hints: number;
  elapsedMs: number;
  prevBest?: number;
  rank?: number;
}

export interface MazeEvent {
  kind: 'start' | 'star' | 'bump' | 'hint' | 'won';
  key: number;
}

interface State {
  setup: Setup;
  session: Session | null;
  paused: boolean;
  menuOnReturn: boolean;
  event: MazeEvent | null;
  /** 힌트 길을 보여 주는 중 (저장 안 함) */
  hintUntil: number;
  records: Record<string, RecordBook>;

  setSetup: (patch: Partial<Setup>) => void;
  newGame: (patch?: Partial<Setup>) => void;
  start: () => void;
  pause: () => void;
  /** 한 칸 움직이기. 벽이면 false */
  step: (d: Dir) => boolean;
  /** 이웃한 칸으로 한 칸 (걷기 줄에서 씀) */
  stepTo: (cell: number) => boolean;
  hint: (limit: number) => void;
  tick: (ms: number) => void;
  quit: () => void;
}

export const recordKey = (s: Pick<Setup, 'level'>) => s.level;
export const hasProgress = (s: Session | null) => s?.status === 'playing';
export const isLive = (st: Pick<State, 'session' | 'paused'>) => st.session?.status === 'playing' && !st.paused;

let eventKey = 0;
const ev = (kind: MazeEvent['kind']): MazeEvent => ({ kind, key: ++eventKey });
const rng = createRng();

export const useMazeEscape = create<State>()(
  persist(
    (set, get) => {
      const arrive = (s: Session, cell: number) => {
        let next: Session = { ...s, pos: cell, steps: s.steps + 1, trail: s.trail.includes(cell) ? s.trail : [...s.trail, cell] };
        let event = get().event;
        if (s.maze.stars.includes(cell) && !s.got.includes(cell)) {
          next = { ...next, got: [...next.got, cell] };
          playSound('pop', 1 + next.got.length * 0.1);
          event = ev('star');
        } else playSound('tap', 0.7 + (next.steps % 2) * 0.1);
        if (cell === s.maze.goal) {
          const key = recordKey(next);
          const { book, rank, prevBest } = addRun(get().records[key], { value: next.elapsedMs, at: Date.now() }, 'lower');
          playSound('win');
          set({ session: { ...next, status: 'done', prevBest, rank }, records: { ...get().records, [key]: book }, event: ev('won'), hintUntil: 0 });
          return;
        }
        set({ session: next, event });
      };

      return {
        setup: { level: 'easy', hero: 'rabbit' },
        session: null,
        paused: true,
        menuOnReturn: false,
        event: null,
        hintUntil: 0,
        records: {},

        setSetup: (patch) => {
          playSound('tap');
          set({ setup: { ...get().setup, ...patch } });
        },

        newGame: (patch) => {
          const setup = { ...get().setup, ...patch };
          const n = SIZE[setup.level];
          const maze = generate(n, n, rng);
          set({
            setup,
            session: { ...setup, status: 'ready', maze, pos: maze.start, trail: [maze.start], got: [], steps: 0, hints: 0, elapsedMs: 0 },
            paused: false,
            event: null,
            hintUntil: 0,
          });
        },

        start: () => {
          const { session } = get();
          if (!session || session.status === 'done') return;
          playSound('select');
          const first = session.status === 'ready';
          set({ session: first ? { ...session, status: 'playing' } : session, paused: false, event: first ? ev('start') : get().event });
        },

        pause: () => {
          if (isLive(get())) set({ paused: true, hintUntil: 0 });
        },

        step: (d) => {
          const { session } = get();
          if (!session || !isLive(get())) return false;
          if (!canMove(session.maze, session.pos, d)) {
            playSound('erase', 0.6);
            set({ event: ev('bump') });
            return false;
          }
          arrive(session, neighbor(session.maze, session.pos, d));
          return true;
        },

        stepTo: (cell) => {
          const { session } = get();
          if (!session || !isLive(get())) return false;
          const d = DIRS.find((x) => canMove(session.maze, session.pos, x) && neighbor(session.maze, session.pos, x) === cell);
          if (!d) return false;
          arrive(session, cell);
          return true;
        },

        hint: (limit) => {
          const { session } = get();
          if (!session || !isLive(get()) || session.hints >= limit) return;
          playSound('hint');
          set({ session: { ...session, hints: session.hints + 1 }, hintUntil: Date.now() + HINT_MS, event: ev('hint') });
        },

        tick: (ms) => {
          const { session } = get();
          if (!session || !isLive(get())) return;
          set({ session: { ...session, elapsedMs: session.elapsedMs + ms } });
        },

        quit: () => set({ session: null, event: null, paused: false }),
      };
    },
    {
      name: storageKey('maze-escape'),
      version: 1,
      partialize: (s) => ({ setup: s.setup, session: s.session, records: s.records }),
    },
  ),
);
