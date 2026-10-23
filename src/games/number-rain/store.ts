import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addRun, type RecordBook } from '@/shared/game/records';
import { useSettings } from '@/shared/settings/store';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import * as engine from './engine/game';
import type { Game, GameEvent, Speed } from './engine/game';
import type { Mode } from './engine/questions';
import { createRng } from './engine/rng';

export interface Setup {
  mode: Mode;
  speed: Speed;
}

interface State {
  setup: Setup;
  /** 지금 판 (매 프레임 바뀌므로 저장하지 않음 — 멈출 때 saved에 저장) */
  game: Game | null;
  saved: Game | null;
  paused: boolean;
  menuOnReturn: boolean;
  music: boolean;
  records: Record<string, RecordBook>;

  setSetup: (patch: Partial<Setup>) => void;
  newGame: (patch?: Partial<Setup>) => void;
  start: () => void;
  pause: () => void;
  frame: (dt: number) => void;
  typeDigit: (d: number) => void;
  backspace: () => void;
  submit: () => void;
  toggleMusic: () => void;
  quit: () => void;
}

export const recordKey = (s: Setup) => `${s.mode}:${s.speed}`;
export const hasProgress = (g: Game | null) => g?.status === 'playing';
const isLive = (s: Pick<State, 'game' | 'paused'>) => s.game?.status === 'playing' && !s.paused;

/** 화면 효과(터짐·번쩍임·글자)는 매 프레임 상태가 아니라 사건으로 알려준다 */
type Listener = (events: GameEvent[], game: Game) => void;
const listeners = new Set<Listener>();
export function onGameEvents(fn: Listener) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

const buzz = (pattern: number | number[]) => {
  if (useSettings.getState().sound) navigator.vibrate?.(pattern);
};

function react(events: GameEvent[], game: Game) {
  for (const e of events) {
    switch (e.type) {
      case 'pop':
        if (e.kind === 'normal') playSound('pop', 1 + Math.min(game.combo, 12) * 0.04);
        break;
      case 'bomb':
        playSound('boom');
        buzz([40, 30, 80]);
        break;
      case 'ice':
        playSound('freeze');
        break;
      case 'heart':
        playSound('heart');
        break;
      case 'fever':
        playSound('fever');
        break;
      case 'level':
        playSound('levelup');
        break;
      case 'land':
        if (e.hurt) {
          playSound('splash');
          buzz(60);
        }
        break;
      case 'wrong':
        playSound('wrong');
        break;
      case 'over':
        playSound('gameover');
        break;
    }
  }
  if (events.length) listeners.forEach((fn) => fn(events, game));
}

const rng = createRng();

/** 같은 내용이면 저장소에 다시 쓰지 않는다 (매 프레임 set이 일어나므로) */
const lastWritten = new Map<string, string>();
const storage = createJSONStorage(() => ({
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => {
    if (lastWritten.get(k) === v) return;
    lastWritten.set(k, v);
    localStorage.setItem(k, v);
  },
  removeItem: (k: string) => {
    lastWritten.delete(k);
    localStorage.removeItem(k);
  },
}));

export const useNumberRain = create<State>()(
  persist(
    (set, get) => {
      const apply = (r: { game: Game; events: GameEvent[] }) => {
        let game = r.game;
        if (game.status === 'done' && get().game?.status === 'playing') {
          const key = recordKey(game);
          const { book, rank, prevBest } = addRun(get().records[key], { value: game.score, at: Date.now(), mistakes: game.mistakes }, 'higher');
          game = { ...game, rank, prevBest };
          set({ game, saved: game, records: { ...get().records, [key]: book } });
        } else set({ game });
        react(r.events, game);
      };

      return {
        setup: { mode: 'digit', speed: 'slow' },
        game: null,
        saved: null,
        // 앱을 새로 열면 진행 중인 판은 멈춘 상태로
        paused: true,
        menuOnReturn: false,
        music: true,
        records: {},

        setSetup: (patch) => {
          playSound('tap');
          set({ setup: { ...get().setup, ...patch } });
        },

        newGame: (patch) => {
          const setup = { ...get().setup, ...patch };
          const game = engine.newGame(setup.mode, setup.speed);
          set({ setup: { mode: setup.mode, speed: setup.speed }, game, saved: game, paused: false });
        },

        start: () => {
          const { game } = get();
          if (!game || game.status === 'done') return;
          playSound('select');
          set({ game: game.status === 'ready' ? { ...game, status: 'playing' } : game, paused: false });
        },

        pause: () => {
          if (isLive(get())) set({ paused: true, saved: get().game });
        },

        frame: (dt) => {
          const s = get();
          if (!s.game || !isLive(s)) return;
          apply(engine.step(s.game, dt, rng));
        },

        typeDigit: (d) => {
          const s = get();
          if (!s.game || !isLive(s)) return;
          playSound('tap');
          apply(engine.typeDigit(s.game, d));
        },

        backspace: () => {
          const s = get();
          if (!s.game || !isLive(s) || !s.game.input) return;
          playSound('erase');
          set({ game: engine.backspace(s.game) });
        },

        submit: () => {
          const s = get();
          if (!s.game || !isLive(s) || !s.game.input) return;
          apply(engine.submit(s.game));
        },

        toggleMusic: () => set({ music: !get().music }),

        quit: () => set({ game: null, saved: null, paused: false }),
      };
    },
    {
      name: storageKey('number-rain'),
      version: 1,
      storage,
      partialize: (s) => ({ setup: s.setup, saved: s.saved, music: s.music, records: s.records }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, game: p.saved ?? null, paused: true };
      },
    },
  ),
);
