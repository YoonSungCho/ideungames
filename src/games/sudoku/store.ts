import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { generatePuzzle, peersOf, unitsOf, type BoardSpec, type Difficulty, type Grid } from './engine';

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
  status: 'playing' | 'won';
  /** 이번 판 시작 전의 최고 기록 (클리어 시 저장, 신기록 판정용) */
  prevBestMs?: number;
}

export interface SudokuRecord {
  wins: number;
  bestMs?: number;
}

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
  event: SudokuEvent | null;
  records: Partial<Record<Difficulty, SudokuRecord>>;

  newGame: (difficulty: Difficulty) => void;
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
          const prev = get().records[g.difficulty] ?? { wins: 0 };
          g.prevBestMs = prev.bestMs;
          const records = {
            ...get().records,
            [g.difficulty]: {
              wins: prev.wins + 1,
              bestMs: prev.bestMs === undefined ? g.elapsedMs : Math.min(prev.bestMs, g.elapsedMs),
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
        if (!game || game.status !== 'playing' || !isEditable(game, index)) return;
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
        event: null,
        records: {},

        newGame: (difficulty) => {
          const p = generatePuzzle(difficulty);
          const cells = p.givens.length;
          set({
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
              status: 'playing',
            },
            history: [],
            selected: null,
            focus: null,
            noteMode: false,
            event: makeEvent('start'),
          });
        },

        // 칸을 누르면 선택만 한다. 숫자가 있는 칸이면 그 숫자를 하이라이트.
        selectCell: (index) => {
          const { game } = get();
          if (!game) return;
          playSound('select');
          set({ selected: index, focus: game.values[index] || null });
        },

        // 숫자 카드: 고른 빈칸에 입력 + 그 숫자 하이라이트. 고른 빈칸이 없으면 하이라이트만 켜고/끈다.
        pressNumber: (n) => {
          const { game, selected, focus, noteMode } = get();
          if (!game || game.status !== 'playing') return;
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
          if (!game || selected === null || !isEditable(game, selected)) return;
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
          if (!game || game.status !== 'playing' || history.length === 0) return;
          const prev = history[history.length - 1];
          playSound('erase');
          set({ game: { ...game, values: prev.values, notes: prev.notes }, history: history.slice(0, -1) });
        },

        toggleNoteMode: () => {
          playSound('tap');
          set((s) => ({ noteMode: !s.noteMode }));
        },

        hint: (maxHints) => {
          const { game, selected } = get();
          if (!game || game.status !== 'playing' || game.hintsUsed >= maxHints) return;
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
          if (!game) return;
          const size = game.spec.size;
          const next =
            selected === null
              ? 0
              : ((Math.floor(selected / size) + dRow + size) % size) * size + (((selected % size) + dCol + size) % size);
          set({ selected: next, focus: game.values[next] || null });
        },

        tick: (ms) => {
          const { game } = get();
          if (!game || game.status !== 'playing') return;
          set({ game: { ...game, elapsedMs: game.elapsedMs + ms } });
        },

        quit: () => set({ game: null, history: [], selected: null, focus: null, event: null }),

        resetRecords: () => set({ records: {} }),
      };
    },
    {
      name: storageKey('sudoku'),
      version: 1,
      partialize: (s) => ({ game: s.game, history: s.history, noteMode: s.noteMode, records: s.records }),
    },
  ),
);
