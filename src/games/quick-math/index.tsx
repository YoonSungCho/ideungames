import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAutoPause, useGameClock } from '@/shared/game/hooks';
import { StartOverlay } from '@/shared/game/StartOverlay';
import { useLeaveAsking, useLeaveGuard } from '@/shared/leaveGuard';
import { useSettings } from '@/shared/settings/store';
import { hasProgress, useQuickMath } from './store';
import { ModeBar, StatusBar } from './ui/Bars';
import { Coach } from './ui/Coach';
import { Keypad } from './ui/Keypad';
import { setupTitle } from './ui/labels';
import { Menu } from './ui/Menu';
import { RecordsPage } from './ui/RecordsPage';
import { ResultModal } from './ui/ResultModal';
import { Stage } from './ui/Stage';
import styles from './ui/QuickMath.module.css';

function useKeyboard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useQuickMath.getState();
      if (/^[0-9]$/.test(e.key)) return s.typeDigit(Number(e.key));
      if (e.key === 'Backspace' || e.key === 'Delete') return s.backspace();
      if (e.key === 'Enter') {
        e.preventDefault();
        return s.submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

function Play() {
  const session = useQuickMath((s) => s.session);
  const paused = useQuickMath((s) => s.paused);
  const challenge = useSettings((s) => s.mode) === 'challenge';
  // 그만하기·메뉴에서 나갔다 오면 메뉴부터 (이어하기로 바로 진행) — GAME_UX_GUIDE §2
  const [picking, setPicking] = useState(() => !session || session.status === 'done' || useQuickMath.getState().menuOnReturn);
  const leftFromMenu = useRef(false);
  leftFromMenu.current = picking || session?.status === 'ready';
  useEffect(() => {
    useQuickMath.setState({ menuOnReturn: false });
    return () => {
      if (leftFromMenu.current) useQuickMath.setState({ menuOnReturn: true });
    };
  }, []);
  const resume = useCallback(() => {
    setPicking(false);
    useQuickMath.getState().start();
  }, []);
  const markQuit = useCallback(() => useQuickMath.setState({ menuOnReturn: true }), []);

  const live = !picking && session?.status === 'playing' && !paused;
  const asking = useLeaveAsking();
  useLeaveGuard(!picking && hasProgress(session), markQuit);
  useAutoPause(useQuickMath.getState().pause, picking);
  useGameClock(live && !asking, useQuickMath.getState().tick);
  useKeyboard(live && !asking);

  if (picking || !session) {
    return <Menu onStart={() => setPicking(false)} onResume={hasProgress(session) ? resume : undefined} />;
  }

  const veiled = session.status === 'ready' || (session.status === 'playing' && paused);
  return (
    <div className={[styles.play, veiled && styles.veiled].filter(Boolean).join(' ')}>
      <ModeBar onMenu={() => setPicking(true)} />
      <div className={styles.side}>
        <StatusBar showMistakes={challenge} />
        <Coach />
      </div>
      <div className={styles.stage} data-stage>
        <Stage />
        {veiled && (
          <StartOverlay
            ready={session.status === 'ready'}
            title={setupTitle(session)}
            onStart={useQuickMath.getState().start}
            readyHint="누르면 문제가 나오고 시간이 흘러가요"
            pausedHint="문제는 다시 시작하면 보여요"
          />
        )}
      </div>
      <div className={styles.padArea}>
        <Keypad />
      </div>
      {session.status === 'done' && <ResultModal onMenu={() => setPicking(true)} />}
    </div>
  );
}

export default function QuickMathGame() {
  return (
    <Routes>
      <Route index element={<Play />} />
      <Route path="records" element={<RecordsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
