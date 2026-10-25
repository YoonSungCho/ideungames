import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addRun, type RecordBook } from '@/shared/game/records';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { closeMiss, deal, flip, PAIRS, type Board, type Level, type Rule, type ThemeId } from './engine/deck';
import { createRng } from './engine/rng';

export interface Setup {
  theme: ThemeId;
  level: Level;
  rule: Rule;
}

export interface Session extends Setup, Board {
  status: 'ready' | 'playing' | 'done';
  /** 시작하면 잠깐 모든 카드를 보여 준다 (이 시간은 기록에 안 들어감) */
  peekLeftMs: number;
  elapsedMs: number;
  prevBest?: number;
  rank?: number;
}

export interface MemoryEvent {
  kind: 'start' | 'match' | 'miss' | 'won';
  /** 짝을 찾은 카드 이름 (읽어 주기) */
  name?: string;
  key: number;
}

/** 시작할 때 미리 보여 주는 시간: 카드가 많을수록 조금 더 */
export const peekMs = (level: Level) => 1500 + PAIRS[level] * 120;
/** 틀린 두 장을 보여 주는 시간 */
export const MISS_SHOW_MS = 900;

interface State {
  setup: Setup;
  session: Session | null;
  paused: boolean;
  menuOnReturn: boolean;
  event: MemoryEvent | null;
  records: Record<string, RecordBook>;

  setSetup: (patch: Partial<Setup>) => void;
  newGame: (patch?: Partial<Setup>) => void;
  start: () => void;
  pause: () => void;
  flipCard: (i: number) => void;
  hideMiss: () => void;
  tick: (ms: number) => void;
  quit: () => void;
}

/** 기록은 단계·규칙별 (테마는 그림만 바뀌므로 같이 센다) */
export const recordKey = (s: Pick<Setup, 'level' | 'rule'>) => `${s.level}:${s.rule}`;
export const hasProgress = (s: Session | null) => s?.status === 'playing';
const isLive = (st: Pick<State, 'session' | 'paused'>) => st.session?.status === 'playing' && !st.paused;
export const peeking = (s: Session) => s.status === 'playing' && s.peekLeftMs > 0;

let eventKey = 0;
const ev = (kind: MemoryEvent['kind'], name?: string): MemoryEvent => ({ kind, name, key: ++eventKey });
const rng = createRng();

export const useMemoryCards = create<State>()(
  persist(
    (set, get) => ({
      setup: { theme: 'animal', level: 'easy', rule: 'same' },
      session: null,
      paused: true,
      menuOnReturn: false,
      event: null,
      records: {},

      setSetup: (patch) => {
        playSound('tap');
        set({ setup: { ...get().setup, ...patch } });
      },

      newGame: (patch) => {
        const setup = { ...get().setup, ...patch };
        const board = deal(setup.theme, setup.level, setup.rule, rng);
        set({ setup, session: { ...setup, ...board, status: 'ready', peekLeftMs: peekMs(setup.level), elapsedMs: 0 }, paused: false, event: null });
      },

      start: () => {
        const { session } = get();
        if (!session || session.status === 'done') return;
        playSound('select');
        const first = session.status === 'ready';
        // 멈춘 사이 열려 있던 틀린 두 장은 닫고 이어 간다
        set({ session: first ? { ...session, status: 'playing' } : { ...session, ...closeMiss(session) }, paused: false, event: first ? ev('start') : get().event });
      },

      pause: () => {
        if (isLive(get())) set({ paused: true });
      },

      flipCard: (i) => {
        const { session } = get();
        if (!session || !isLive(get()) || peeking(session)) return;
        const { board, result } = flip(session, i);
        if (result === 'none') return;
        const s: Session = { ...session, ...board };
        const name = session.cards[i].name;
        if (result === 'open') {
          playSound('tap', 1.2);
          set({ session: s });
        } else if (result === 'match') {
          playSound(board.combo >= 3 ? 'hint' : 'place', 1 + Math.min(board.combo, 6) * 0.04);
          set({ session: s, event: ev('match', name) });
        } else if (result === 'miss') {
          playSound('wrong');
          set({ session: s, event: ev('miss') });
        } else {
          const key = recordKey(s);
          const { book, rank, prevBest } = addRun(get().records[key], { value: s.elapsedMs, at: Date.now(), mistakes: s.misses }, 'lower');
          playSound('win');
          set({ session: { ...s, status: 'done', prevBest, rank }, records: { ...get().records, [key]: book }, event: ev('won', name) });
        }
      },

      hideMiss: () => {
        const { session } = get();
        if (session && session.open.length === 2) set({ session: { ...session, ...closeMiss(session) } });
      },

      tick: (ms) => {
        const { session } = get();
        if (!session || !isLive(get())) return;
        if (session.peekLeftMs > 0) {
          const left = session.peekLeftMs - ms;
          if (left <= 0) playSound('select');
          set({ session: { ...session, peekLeftMs: Math.max(0, left) } });
          return;
        }
        set({ session: { ...session, elapsedMs: session.elapsedMs + ms } });
      },

      quit: () => set({ session: null, event: null, paused: false }),
    }),
    {
      name: storageKey('memory-cards'),
      version: 1,
      partialize: (s) => ({ setup: s.setup, session: s.session, records: s.records }),
    },
  ),
);
