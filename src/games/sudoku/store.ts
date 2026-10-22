import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { generatePuzzle, peersOf, SPECS, unitsOf, type BoardSize, type BoardSpec, type Difficulty, type Grid } from './engine';

interface Snapshot {
  values: Grid;
  notes: number[];
}

export interface SudokuGame {
  spec: BoardSpec;
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
  /** 현재 보드 (givens 포함) */
  values: Grid;
  /** 메모: 비트마스크 (bit n = 숫자 n) */
  notes: number[];
  /** 힌트로 채운 칸 */
  hinted: number[];
  mistakes: number;
  hintsUsed: number;
  elapsedMs: number;
  /** ready: 시작하기 전 (보드 가림, 시간 0) */
  status: 'ready' | 'playing' | 'won';
  /** 이번 판 시작 전의 최고 기록 (클리어 시 저장, 신기록 판정용) */
  prevBestMs?: number;
  /** 클리어 시 이번 기록의 순위 (1부터, TOP 목록 밖이면 없음) */
  rank?: number;
}

export interface SudokuRun {
  ms: number;
  /** 클리어 시각 (epoch ms). 옛 기록은 0 */
  at: number;
  mistakes: number;
  hints: number;
}

export interface SudokuRecord {
  wins: number;
  bestMs?: number;
  /** 빠른 순 TOP 기록 */
  runs?: SudokuRun[];
}

export const TOP_RUNS = 10;

/** 기록은 크기+난이도별로 따로 — 예: '6-easy' */
export type RecordKey = `${BoardSize}-${Difficulty}`;
export const recordKey = (size: number, difficulty: Difficulty) => `${size}-${difficulty}` as RecordKey;

/** UI 피드백(애니메이션/로봇 대사)용 이벤트. key가 바뀌면 새 이벤트. */
export interface SudokuEvent {
  kind: 'place' | 'wrong' | 'hint' | 'complete' | 'win' | 'start';
  cells: number[];
  key: number;
}

interface SudokuState {
  game: SudokuGame | null;
  history: Snapshot[];
  selected: number | null;
  /** 하이라이트 중인 숫자 — 이 숫자가 있는 행/열/박스를 보드에 표시 */
  focus: number | null;
  noteMode: boolean;
  /** 잠깐 멈춤 (보드 가림, 시간 멈춤). 저장하지 않음 → 다시 열면 멈춘 상태로 시작 */
  paused: boolean;
  event: SudokuEvent | null;
  /** 난이도 화면에서 고른 보드 크기 (다음 새 게임에 사용) */
  size: BoardSize;
  records: Partial<Record<RecordKey, SudokuRecord>>;

  setSize: (size: BoardSize) => void;
  /** size를 생략하면 현재 고른 크기로 */
  newGame: (difficulty: Difficulty, size?: BoardSize) => void;
  /** 시작하기 / 계속하기 */
  start: () => void;
  pause: () => void;
  selectCell: (index: number) => void;
  pressNumber: (n: number) => void;
  erase: () => void;
  undo: () => void;
  toggleNoteMode: () => void;
  hint: (maxHints: number) => void;
  moveSelection: (dRow: number, dCol: number) => void;
  tick: (ms: number) => void;
  quit: () => void;
  resetRecords: () => void;
}

const HISTORY_LIMIT = 200;
let eventKey = 0;
const makeEvent = (kind: SudokuEvent['kind'], cells: number[] = []): SudokuEvent => ({ kind, cells, key: ++eventKey });

/** 시간이 흐르고 입력을 받는 상태 */
const isLive = (s: Pick<SudokuState, 'game' | 'paused'>) => s.game?.status === 'playing' && !s.paused;

/** 취소하면 아까운 진행 중인 게임인가 (시작했고, 아직 안 끝남) */
export const hasProgress = (g: SudokuGame | null) => g?.status === 'playing';

export const isEditable = (g: SudokuGame, i: number) => g.givens[i] === 0 && g.values[i] !== g.solution[i];

export const remainingOf = (g: SudokuGame, n: number) =>
  g.spec.size - g.values.reduce((acc, v, i) => acc + (v === n && v === g.solution[i] ? 1 : 0), 0);

export const useSudoku = create<SudokuState>()(
  persist(
    (set, get) => {
      const snapshot = (g: SudokuGame): Snapshot => ({ values: g.values.slice(), notes: g.notes.slice() });
      const pushHistory = (g: SudokuGame) => {
        const history = [...get().history, snapshot(g)];
        if (history.length > HISTORY_LIMIT) history.shift();
        return history;
      };

      /** 정답 숫자를 놓은 뒤: 메모 정리, 줄/박스 완성 및 승리 판정 */
      const afterCorrect = (g: SudokuGame, index: number, value: number, fromHint: boolean) => {
        const bit = 1 << value;
        for (const p of peersOf(g.spec)[index]) g.notes[p] &= ~bit;

        if (g.values.every((v, i) => v === g.solution[i])) {
          g.status = 'won';
          const key = recordKey(g.spec.size, g.difficulty);
          const prev = get().records[key] ?? { wins: 0 };
          g.prevBestMs = prev.bestMs;
          const run: SudokuRun = { ms: g.elapsedMs, at: Date.now(), mistakes: g.mistakes, hints: g.hintsUsed };
          const runs = [...(prev.runs ?? []), run].sort((a, b) => a.ms - b.ms).slice(0, TOP_RUNS);
          const rank = runs.indexOf(run);
          g.rank = rank === -1 ? undefined : rank + 1;
          const records = {
            ...get().records,
            [key]: {
              wins: prev.wins + 1,
              bestMs: prev.bestMs === undefined ? g.elapsedMs : Math.min(prev.bestMs, g.elapsedMs),
              runs,
            },
          };
          playSound('win');
          return { event: makeEvent('win', g.values.map((_, i) => i)), records };
        }

        const completed = unitsOf(g.spec)
          .filter((u) => u.includes(index) && u.every((i) => g.values[i] === g.solution[i]))
          .flat();
        if (completed.length) {
          playSound('complete');
          return { event: makeEvent('complete', [...new Set(completed)]) };
        }
        playSound(fromHint ? 'hint' : 'place');
        return { event: makeEvent(fromHint ? 'hint' : 'place', [index]) };
      };

      const placeAt = (index: number, n: number) => {
        const { game, noteMode } = get();
        if (!game || !isLive(get()) || !isEditable(game, index)) return;
        const g: SudokuGame = { ...game, values: game.values.slice(), notes: game.notes.slice() };

        if (noteMode) {
          if (g.values[index] !== 0) return;
          const history = pushHistory(game);
          g.notes[index] ^= 1 << n;
          playSound('tap');
          set({ game: g, history });
          return;
        }

        if (g.values[index] === n) return;
        const history = pushHistory(game);
        g.values[index] = n;
        g.notes[index] = 0;

        if (n === g.solution[index]) {
          set({ game: g, history, ...afterCorrect(g, index, n, false) });
        } else {
          g.mistakes++;
          playSound('wrong');
          set({ game: g, history, event: makeEvent('wrong', [index]) });
        }
      };

      return {
        game: null,
        history: [],
        selected: null,
        focus: null,
        noteMode: false,
        // 앱을 새로 열면 진행 중인 게임은 멈춘 상태로 시작
        paused: true,
        event: null,
        size: 4,
        records: {},

        setSize: (size) => {
          playSound('tap');
          set({ size });
        },

        newGame: (difficulty, size = get().size) => {
          const p = generatePuzzle(difficulty, { spec: SPECS[size] });
          const cells = p.givens.length;
          set({
            size,
            game: {
              spec: p.spec,
              difficulty,
              givens: p.givens,
              solution: p.solution,
              values: p.givens.slice(),
              notes: new Array(cells).fill(0),
              hinted: [],
              mistakes: 0,
              hintsUsed: 0,
              elapsedMs: 0,
              status: 'ready',
            },
            history: [],
            selected: null,
            focus: null,
            noteMode: false,
            paused: false,
            event: null,
          });
        },

        start: () => {
          const { game } = get();
          if (!game || game.status === 'won') return;
          playSound('select');
          const first = game.status === 'ready';
          set({ game: first ? { ...game, status: 'playing' } : game, paused: false, event: first ? makeEvent('start') : get().event });
        },

        pause: () => {
          if (get().game?.status === 'playing' && !get().paused) set({ paused: true });
        },

        // 칸을 누르면 선택만 한다. 숫자가 있는 칸이면 그 숫자를 하이라이트.
        selectCell: (index) => {
          const { game } = get();
          if (!game || !isLive(get())) return;
          playSound('select');
          set({ selected: index, focus: game.values[index] || null });
        },

        // 숫자 카드: 고른 빈칸에 입력 + 그 숫자 하이라이트. 고른 빈칸이 없으면 하이라이트만 켜고/끈다.
        pressNumber: (n) => {
          const { game, selected, focus, noteMode } = get();
          if (!game || !isLive(get())) return;
          const canPlace = noteMode || remainingOf(game, n) > 0;
          if (canPlace && selected !== null && isEditable(game, selected)) {
            placeAt(selected, n);
            set({ focus: n });
            return;
          }
          playSound('select');
          set({ focus: focus === n ? null : n });
        },

        erase: () => {
          const { game, selected } = get();
          if (!game || !isLive(get()) || selected === null || !isEditable(game, selected)) return;
          if (game.values[selected] === 0 && game.notes[selected] === 0) return;
          const history = pushHistory(game);
          const values = game.values.slice();
          const notes = game.notes.slice();
          values[selected] = 0;
          notes[selected] = 0;
          playSound('erase');
          set({ game: { ...game, values, notes }, history });
        },

        undo: () => {
          const { game, history } = get();
          if (!game || !isLive(get()) || history.length === 0) return;
          const prev = history[history.length - 1];
          playSound('erase');
          set({ game: { ...game, values: prev.values, notes: prev.notes }, history: history.slice(0, -1) });
        },

        toggleNoteMode: () => {
          if (!isLive(get())) return;
          playSound('tap');
          set((s) => ({ noteMode: !s.noteMode }));
        },

        hint: (maxHints) => {
          const { game, selected } = get();
          if (!game || !isLive(get()) || game.hintsUsed >= maxHints) return;
          let target = selected !== null && isEditable(game, selected) ? selected : -1;
          if (target === -1) {
            const open = game.values.map((_, i) => i).filter((i) => isEditable(game, i));
            if (!open.length) return;
            target = open[Math.floor(Math.random() * open.length)];
          }
          const history = pushHistory(game);
          const g: SudokuGame = {
            ...game,
            values: game.values.slice(),
            notes: game.notes.slice(),
            hinted: [...game.hinted, target],
            hintsUsed: game.hintsUsed + 1,
          };
          g.values[target] = g.solution[target];
          g.notes[target] = 0;
          set({ game: g, history, selected: target, ...afterCorrect(g, target, g.solution[target], true) });
        },

        moveSelection: (dRow, dCol) => {
          const { game, selected } = get();
          if (!game || !isLive(get())) return;
          const size = game.spec.size;
          const next =
            selected === null
              ? 0
              : ((Math.floor(selected / size) + dRow + size) % size) * size + (((selected % size) + dCol + size) % size);
          set({ selected: next, focus: game.values[next] || null });
        },

        tick: (ms) => {
          const { game } = get();
          if (!game || !isLive(get())) return;
          set({ game: { ...game, elapsedMs: game.elapsedMs + ms } });
        },

        quit: () => set({ game: null, history: [], selected: null, focus: null, event: null, paused: false }),

        resetRecords: () => set({ records: {} }),
      };
    },
    {
      name: storageKey('sudoku'),
      version: 3,
      partialize: (s) => ({ game: s.game, history: s.history, noteMode: s.noteMode, size: s.size, records: s.records }),
      migrate: (persisted, version) => {
        const state = persisted as Partial<SudokuState> & { records?: Record<string, SudokuRecord> };
        // v1: 4x4뿐이라 기록 키가 난이도('easy')였다 → '4-easy'
        if (version < 2 && state.records) {
          state.records = Object.fromEntries(
            Object.entries(state.records).map(([k, v]) => [k.includes('-') ? k : `4-${k}`, v]),
          ) as SudokuState['records'];
        }
        // v3: TOP 기록 목록 — 기존 최고 기록을 첫 기록으로
        if (version < 3 && state.records) {
          for (const rec of Object.values(state.records) as SudokuRecord[]) {
            if (!rec.runs && rec.bestMs !== undefined) rec.runs = [{ ms: rec.bestMs, at: 0, mistakes: 0, hints: 0 }];
          }
        }
        return state as SudokuState;
      },
    },
  ),
);
