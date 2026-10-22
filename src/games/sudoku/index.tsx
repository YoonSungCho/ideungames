import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAutoPause, useGameClock } from '@/shared/game/hooks';
import { useLeaveAsking, useLeaveGuard } from '@/shared/leaveGuard';
import { useSettings } from '@/shared/settings/store';
import { hasProgress, useSudoku } from './store';
import { Board } from './ui/Board';
import { Coach } from './ui/Coach';
import { Controls } from './ui/Controls';
import { DifficultyPicker } from './ui/DifficultyPicker';
import { NumberPad } from './ui/NumberPad';
import { RecordsPage } from './ui/RecordsPage';
import { StartOverlay } from './ui/StartOverlay';
import { ModeBar, StatusBar } from './ui/StatusBar';
import { WinModal } from './ui/WinModal';
import styles from './ui/Sudoku.module.css';

/** 도전 모드 힌트 개수. 쉬운 모드는 무제한. */
const CHALLENGE_HINTS = 3;

function useKeyboard(enabled: boolean, maxHints: number) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const s = useSudoku.getState();
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          s.undo();
        }
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= (s.game?.spec.size ?? 0)) return s.pressNumber(n);
      const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (moves[e.key]) {
        e.preventDefault();
        return s.moveSelection(...moves[e.key]);
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') return s.erase();
      if (e.key.toLowerCase() === 'n') return s.toggleNoteMode();
      if (e.key.toLowerCase() === 'h') return s.hint(maxHints);
      if (e.key === 'Escape') useSudoku.setState({ selected: null, focus: null });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, maxHints]);
}

function Play() {
  const game = useSudoku((s) => s.game);
  const paused = useSudoku((s) => s.paused);
  const challenge = useSettings((s) => s.mode) === 'challenge';
  const maxHints = challenge ? CHALLENGE_HINTS : Infinity;
  // 그만하기로 나갔다 오면 메뉴부터 (이어하기 버튼으로 바로 이어서)
  const [picking, setPicking] = useState(() => !game || game.status === 'won' || useSudoku.getState().menuOnReturn);
  // 메뉴(난이도 화면)나 시작 전 화면에서 떠났다면 돌아올 때도 메뉴부터
  const leftFromMenu = useRef(false);
  leftFromMenu.current = picking || game?.status === 'ready';
  useEffect(() => {
    useSudoku.setState({ menuOnReturn: false });
    return () => {
      if (leftFromMenu.current) useSudoku.setState({ menuOnReturn: true });
    };
  }, []);
  const resume = useCallback(() => {
    setPicking(false);
    useSudoku.getState().start();
  }, []);
  const markQuit = useCallback(() => useSudoku.setState({ menuOnReturn: true }), []);

  const live = !picking && game?.status === 'playing' && !paused;
  const asking = useLeaveAsking();
  useLeaveGuard(!picking && hasProgress(game), markQuit);
  useAutoPause(useSudoku.getState().pause, picking);
  useGameClock(live && !asking, useSudoku.getState().tick);
  useKeyboard(live && !asking, maxHints);

  if (picking || !game) {
    return (
      <DifficultyPicker
        onStart={() => setPicking(false)}
        onResume={hasProgress(game) ? resume : undefined}
      />
    );
  }

  const veiled = game.status === 'ready' || (game.status === 'playing' && paused);
  return (
    <div className={[styles.play, veiled && styles.veiled].filter(Boolean).join(' ')}>
      <div className={styles.side}>
        <ModeBar onNewGame={() => setPicking(true)} />
        <StatusBar showMistakes={challenge} />
        <Coach />
      </div>
      <div className={styles.boardWrap}>
        <Board />
        {veiled && <StartOverlay />}
      </div>
      <div className={styles.tools}>
        <Controls maxHints={maxHints} />
      </div>
      <div className={styles.padArea}>
        <NumberPad />
      </div>
      {game.status === 'won' && <WinModal onPickDifficulty={() => setPicking(true)} />}
    </div>
  );
}

export default function SudokuGame() {
  return (
    <Routes>
      <Route index element={<Play />} />
      <Route path="records" element={<RecordsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
