import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAutoPause, useGameClock } from '@/shared/game/hooks';
import { StartOverlay } from '@/shared/game/StartOverlay';
import { useLeaveAsking, useLeaveGuard } from '@/shared/leaveGuard';
import { hasProgress, useMazeEscape } from './store';
import { Board } from './ui/Board';
import { Coach, ModeBar, StatusBar } from './ui/Bars';
import { DPad, useKeyboard } from './ui/Controls';
import { setupTitle } from './ui/labels';
import { Menu } from './ui/Menu';
import { RecordsPage } from './ui/RecordsPage';
import { ResultModal } from './ui/ResultModal';
import styles from './ui/Maze.module.css';

function Play() {
  const session = useMazeEscape((s) => s.session);
  const paused = useMazeEscape((s) => s.paused);
  // 그만하기·메뉴에서 나갔다 오면 메뉴부터 (이어하기로 바로 진행) — GAME_UX_GUIDE §2
  const [picking, setPicking] = useState(() => !session || session.status === 'done' || useMazeEscape.getState().menuOnReturn);
  const leftFromMenu = useRef(false);
  leftFromMenu.current = picking || session?.status === 'ready';
  useEffect(() => {
    useMazeEscape.setState({ menuOnReturn: false });
    return () => {
      if (leftFromMenu.current) useMazeEscape.setState({ menuOnReturn: true });
    };
  }, []);
  const resume = useCallback(() => {
    setPicking(false);
    useMazeEscape.getState().start();
  }, []);
  const markQuit = useCallback(() => useMazeEscape.setState({ menuOnReturn: true }), []);

  const live = !picking && session?.status === 'playing' && !paused;
  const asking = useLeaveAsking();
  useLeaveGuard(!picking && hasProgress(session), markQuit);
  useAutoPause(useMazeEscape.getState().pause, picking);
  useGameClock(live && !asking, useMazeEscape.getState().tick);
  useKeyboard(live && !asking);

  if (picking || !session) {
    return <Menu onStart={() => setPicking(false)} onResume={hasProgress(session) ? resume : undefined} />;
  }

  const veiled = session.status === 'ready' || (session.status === 'playing' && paused);
  return (
    <div className={[styles.play, veiled && styles.veiled].filter(Boolean).join(' ')}>
      <ModeBar onMenu={() => setPicking(true)} />
      <div className={styles.side}>
        <StatusBar />
        <Coach />
      </div>
      <div className={styles.stage} data-stage>
        <Board />
        {veiled && (
          <StartOverlay
            ready={session.status === 'ready'}
            title={setupTitle(session)}
            onStart={useMazeEscape.getState().start}
            readyHint="누르면 미로가 보이고 시간이 흘러가요"
            pausedHint="미로는 다시 시작하면 보여요"
          />
        )}
      </div>
      <div className={styles.padArea}>
        <DPad />
      </div>
      {session.status === 'done' && <ResultModal onMenu={() => setPicking(true)} />}
    </div>
  );
}

export default function MazeEscapeGame() {
  return (
    <Routes>
      <Route index element={<Play />} />
      <Route path="records" element={<RecordsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
