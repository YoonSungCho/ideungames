import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/shared/settings/store';
import { useSudoku } from './store';
import { Board } from './ui/Board';
import { Coach } from './ui/Coach';
import { Controls } from './ui/Controls';
import { DifficultyPicker } from './ui/DifficultyPicker';
import { NumberPad } from './ui/NumberPad';
import { StatusBar } from './ui/StatusBar';
import { WinModal } from './ui/WinModal';
import styles from './ui/Sudoku.module.css';

/** 도전 모드 힌트 개수. 쉬운 모드는 무제한. */
const CHALLENGE_HINTS = 3;

function useTimer(running: boolean) {
  const tick = useSudoku((s) => s.tick);
  const last = useRef(0);
  useEffect(() => {
    if (!running) return;
    last.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === 'visible') tick(now - last.current);
      last.current = now;
    }, 250);
    return () => clearInterval(id);
  }, [running, tick]);
}

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
      if (e.key === 'Escape') useSudoku.setState({ selected: null, armed: null });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, maxHints]);
}

export default function SudokuGame() {
  const game = useSudoku((s) => s.game);
  const challenge = useSettings((s) => s.mode) === 'challenge';
  const maxHints = challenge ? CHALLENGE_HINTS : Infinity;
  const [picking, setPicking] = useState(() => !game || game.status === 'won');

  const playing = !picking && game?.status === 'playing';
  useTimer(playing);
  useKeyboard(playing, maxHints);

  if (picking || !game) {
    return (
      <DifficultyPicker
        onStart={() => setPicking(false)}
        onResume={game?.status === 'playing' ? () => setPicking(false) : undefined}
      />
    );
  }

  return (
    <div className={styles.play}>
      <div className={styles.side}>
        <StatusBar challenge={challenge} onNewGame={() => setPicking(true)} />
        <Coach />
      </div>
      <div className={styles.boardWrap}>
        <Board />
      </div>
      <div className={styles.inputs}>
        <Controls maxHints={maxHints} />
        <NumberPad />
      </div>
      {game.status === 'won' && <WinModal onPickDifficulty={() => setPicking(true)} />}
    </div>
  );
}
