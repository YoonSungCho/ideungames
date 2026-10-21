import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storageKey } from '../storage';

/**
 * easy: 어린 아이용 — 타이머/실수 숫자 숨김, 힌트 무제한, 칭찬 위주
 * challenge: 도전 모드 — 타이머, 실수 횟수, 최고 기록, 힌트 제한
 */
export type PlayMode = 'easy' | 'challenge';

interface SettingsState {
  playerName: string;
  mode: PlayMode;
  sound: boolean;
  setPlayerName: (name: string) => void;
  setMode: (mode: PlayMode) => void;
  setSound: (on: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      playerName: '이든',
      mode: 'easy',
      sound: true,
      setPlayerName: (playerName) => set({ playerName }),
      setMode: (mode) => set({ mode }),
      setSound: (sound) => set({ sound }),
    }),
    { name: storageKey('settings'), version: 1 },
  ),
);
