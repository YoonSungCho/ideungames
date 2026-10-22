import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addRun, type RecordBook } from '@/shared/game/records';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { createRng, generateProblem, generateSet, problemKey, type Difficulty, type Op, type Problem } from './engine';
import { BETTER } from './records';

/** sprint: 20문제를 빨리 / blitz: 60초 동안 많이 */
export type GameMode = 'sprint' | 'blitz';
export const SPRINT_COUNT = 20;
export const BLITZ_MS = 60_000;
/** 같은 문제를 이만큼 틀리면 정답을 보여준다 (그래도 직접 입력해야 넘어감) */
export const REVEAL_AFTER = 2;

export interface Setup {
  mode: GameMode;
  ops: Op[];
  difficulty: Difficulty;
  /** 곱셈·나눗셈 단. 비어 있으면 난이도 기본값 */
  dans: number[];
}

export interface Session extends Setup {
  status: 'ready' | 'playing' | 'done';
  problems: Problem[];
  index: number;
  input: string;
  /** 지금 문제에서 틀린 횟수 */
  tries: number;
  correct: number;
  mistakes: number;
  combo: number;
  maxCombo: number;
  elapsedMs: number;
  /** 끝났을 때: 이전 최고 기록, 이번 순위 */
  prevBest?: number;
  rank?: number;
}

export interface MathEvent {
  kind: 'start' | 'correct' | 'wrong' | 'reveal' | 'done';
  key: number;
}

interface State {
  setup: Setup;
  session: Session | null;
  paused: boolean;
  /** "그만하기"·메뉴에서 나갔음 → 다시 들어오면 메뉴부터 */
  menuOnReturn: boolean;
  event: MathEvent | null;
  records: Record<string, RecordBook>;

  setSetup: (patch: Partial<Setup>) => void;
  newGame: (patch?: Partial<Setup>) => void;
  start: () => void;
  pause: () => void;
  typeDigit: (d: number) => void;
  backspace: () => void;
  submit: () => void;
  tick: (ms: number) => void;
  quit: () => void;
}

const sorted = <T,>(xs: T[]) => [...xs].sort();
/** 기록은 게임 방식·연산·단·난이도 조합별로 */
export const recordKey = (s: Setup) => `${s.mode}:${sorted(s.ops).join(',')}:${sorted(s.dans).join(',') || 'auto'}:${s.difficulty}`;

export const hasProgress = (s: Session | null) => s?.status === 'playing';
export const currentProblem = (s: Session) => s.problems[s.index];
export const remainingMs = (s: Session) => Math.max(0, BLITZ_MS - s.elapsedMs);

const isLive = (st: Pick<State, 'session' | 'paused'>) => st.session?.status === 'playing' && !st.paused;
let eventKey = 0;
const ev = (kind: MathEvent['kind']): MathEvent => ({ kind, key: ++eventKey });
const rng = createRng();

export const useQuickMath = create<State>()(
  persist(
    (set, get) => {
      /** 끝내고 기록 저장 */
      const finish = (s: Session): Partial<State> => {
        const key = recordKey(s);
        const value = s.mode === 'sprint' ? s.elapsedMs : s.correct;
        const { book, rank, prevBest } = addRun(get().records[key], { value, at: Date.now(), mistakes: s.mistakes }, BETTER[s.mode]);
        playSound('win');
        return {
          session: { ...s, status: 'done', input: '', prevBest, rank },
          records: { ...get().records, [key]: book },
          event: ev('done'),
        };
      };

      const nextProblem = (s: Session): Session => {
        if (s.mode === 'sprint') return { ...s, index: s.index + 1, input: '', tries: 0 };
        const avoid = new Set(s.problems.slice(-6).map(problemKey));
        return { ...s, problems: [...s.problems, generateProblem(rng, s, avoid)], index: s.index + 1, input: '', tries: 0 };
      };

      return {
        setup: { mode: 'sprint', ops: ['add'], difficulty: 'easy', dans: [] },
        session: null,
        // 앱을 새로 열면 진행 중인 판은 멈춘 상태로
        paused: true,
        menuOnReturn: false,
        event: null,
        records: {},

        setSetup: (patch) => {
          playSound('tap');
          const next = { ...get().setup, ...patch };
          if (next.ops.length === 0) return; // 연산은 최소 하나
          set({ setup: next });
        },

        newGame: (patch) => {
          const setup = { ...get().setup, ...patch };
          const problems = setup.mode === 'sprint' ? generateSet(rng, setup, SPRINT_COUNT) : generateSet(rng, setup, 1);
          set({
            setup,
            session: { ...setup, status: 'ready', problems, index: 0, input: '', tries: 0, correct: 0, mistakes: 0, combo: 0, maxCombo: 0, elapsedMs: 0 },
            paused: false,
            event: null,
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
          if (isLive(get())) set({ paused: true });
        },

        typeDigit: (d) => {
          const { session } = get();
          if (!session || !isLive(get()) || session.input.length >= 3) return;
          playSound('tap');
          const input = session.input === '0' ? String(d) : session.input + d;
          set({ session: { ...session, input } });
          // 답의 자릿수만큼 입력하면 바로 채점
          if (input.length >= String(currentProblem(session).answer).length) get().submit();
        },

        backspace: () => {
          const { session } = get();
          if (!session || !isLive(get()) || !session.input) return;
          playSound('erase');
          set({ session: { ...session, input: session.input.slice(0, -1) } });
        },

        submit: () => {
          const { session } = get();
          if (!session || !isLive(get()) || !session.input) return;
          const p = currentProblem(session);
          if (Number(session.input) === p.answer) {
            const combo = session.combo + 1;
            // 정답을 본 문제는 콤보·점수 대신 진행만
            const earned = session.tries < REVEAL_AFTER;
            let s: Session = {
              ...session,
              correct: session.correct + (earned ? 1 : 0),
              combo: earned ? combo : 0,
              maxCombo: Math.max(session.maxCombo, earned ? combo : 0),
            };
            if (s.mode === 'sprint' && s.index + 1 >= s.problems.length) {
              set(finish({ ...s, index: s.index + 1 }));
              return;
            }
            s = nextProblem(s);
            playSound(combo > 0 && combo % 5 === 0 ? 'complete' : 'place');
            set({ session: s, event: ev('correct') });
          } else {
            const tries = session.tries + 1;
            playSound('wrong');
            set({
              session: { ...session, input: '', tries, mistakes: session.mistakes + 1, combo: 0 },
              event: ev(tries >= REVEAL_AFTER ? 'reveal' : 'wrong'),
            });
          }
        },

        tick: (ms) => {
          const { session } = get();
          if (!session || !isLive(get())) return;
          const s = { ...session, elapsedMs: session.elapsedMs + ms };
          if (s.mode === 'blitz' && s.elapsedMs >= BLITZ_MS) {
            set(finish({ ...s, elapsedMs: BLITZ_MS }));
            return;
          }
          set({ session: s });
        },

        quit: () => set({ session: null, event: null, paused: false }),
      };
    },
    {
      name: storageKey('quick-math'),
      version: 1,
      partialize: (s) => ({ setup: s.setup, session: s.session, records: s.records }),
    },
  ),
);
