import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addRun, type RecordBook } from '@/shared/game/records';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { closeMiss, deal, flip, PAIRS, sayMath, type Board, type Card, type Level, type Rule, type ThemeId } from './engine/deck';
import { createRng } from './engine/rng';

/** 둘이서 대결할 때 상대 */
export type RivalId = 'friend' | 'mom' | 'dad' | 'sibling';
export const RIVALS: { id: RivalId; name: string; icon: string }[] = [
  { id: 'friend', name: '친구', icon: '🧒' },
  { id: 'mom', name: '엄마', icon: '👩' },
  { id: 'dad', name: '아빠', icon: '👨' },
  { id: 'sibling', name: '동생', icon: '👶' },
];
export const rival = (id: RivalId) => RIVALS.find((r) => r.id === id) ?? RIVALS[0];

export interface Setup {
  theme: ThemeId;
  level: Level;
  rule: Rule;
  /** 1: 혼자 (시간 기록·메달) / 2: 둘이서 번갈아 (짝을 많이 찾은 사람이 이김) */
  players: 1 | 2;
  rival: RivalId;
}

export interface Session extends Setup, Board {
  status: 'ready' | 'playing' | 'done';
  /** 시작하면 잠깐 모든 카드를 보여 준다 (이 시간은 기록에 안 들어감) */
  peekLeftMs: number;
  elapsedMs: number;
  /** 대결: 지금 차례 (0 = 나, 1 = 상대) · 찾은 짝 수 */
  turn: 0 | 1;
  scores: [number, number];
  prevBest?: number;
  rank?: number;
}

export interface MemoryEvent {
  kind: 'start' | 'match' | 'miss' | 'won';
  /** 대결: 이 일 다음 차례 */
  turn?: 0 | 1;
  /** 짝을 찾은 카드 이름 (계산식이면 '12+5=17') */
  name?: string;
  /** 읽어 줄 말 */
  say?: string;
  key: number;
}

const isMath = (c: Card) => c.face === 'expr' || c.face === 'num';
export const cardTitle = (c: Card) => (isMath(c) ? `${c.sym}=${c.name}` : c.name);
const cardSay = (c: Card) => (isMath(c) ? sayMath(c.sym, c.name) : c.name);

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
export const isBattle = (s: Pick<Setup, 'players'>) => s.players === 2;
export const hasProgress = (s: Session | null) => s?.status === 'playing';
const isLive = (st: Pick<State, 'session' | 'paused'>) => st.session?.status === 'playing' && !st.paused;
export const peeking = (s: Session) => s.status === 'playing' && s.peekLeftMs > 0;

/** 대결 한 판 더: 진 사람이 먼저 (비기면 마지막에 못 찾은 사람) */
function firstTurn(prev: Session | null, setup: Setup): 0 | 1 {
  if (!isBattle(setup) || !prev || !isBattle(prev) || prev.status !== 'done') return 0;
  const [a, b] = prev.scores;
  return a === b ? ((1 - prev.turn) as 0 | 1) : a < b ? 0 : 1;
}

let eventKey = 0;
const ev = (kind: MemoryEvent['kind'], card?: Card): MemoryEvent => ({ kind, name: card && cardTitle(card), say: card && cardSay(card), key: ++eventKey });
const rng = createRng();

export const useMemoryCards = create<State>()(
  persist(
    (set, get) => ({
      setup: { theme: 'animal', level: 'easy', rule: 'same', players: 1, rival: 'friend' },
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
        set({ setup, session: { ...setup, ...board, status: 'ready', peekLeftMs: peekMs(setup.level), elapsedMs: 0, turn: firstTurn(get().session, setup), scores: [0, 0] }, paused: false, event: null });
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
        const battle = isBattle(session);
        const card = session.cards[i];
        const scored = result === 'match' || result === 'won';
        // 대결: 짝을 찾으면 한 번 더, 틀리면 상대 차례
        const scores: [number, number] = [...session.scores];
        if (scored) scores[session.turn]++;
        const turn = battle && result === 'miss' ? (1 - session.turn) as 0 | 1 : session.turn;
        const s: Session = { ...session, ...board, scores, turn };
        if (result === 'open') {
          playSound('tap', 1.2);
          set({ session: s });
        } else if (result === 'match') {
          playSound(board.combo >= 3 ? 'hint' : 'place', 1 + Math.min(board.combo, 6) * 0.04);
          set({ session: s, event: ev('match', card) });
        } else if (result === 'miss') {
          playSound('wrong');
          set({ session: s, event: { ...ev('miss'), turn } });
        } else if (battle) {
          playSound('win');
          set({ session: { ...s, status: 'done' }, event: ev('won', card) });
        } else {
          const key = recordKey(s);
          const { book, rank, prevBest } = addRun(get().records[key], { value: s.elapsedMs, at: Date.now(), mistakes: s.misses }, 'lower');
          playSound('win');
          set({ session: { ...s, status: 'done', prevBest, rank }, records: { ...get().records, [key]: book }, event: ev('won', card) });
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
      version: 2,
      partialize: (s) => ({ setup: s.setup, session: s.session, records: s.records }),
      // v2: 대결 모드 (예전 하던 판은 차례·점수가 없어서 비운다)
      migrate: (old, v) => {
        const st = old as Pick<State, 'setup' | 'session' | 'records'>;
        if (v < 2) return { ...st, setup: { players: 1, rival: 'friend', ...(st.setup as Partial<Setup>) }, session: null };
        return st;
      },
    },
  ),
);
