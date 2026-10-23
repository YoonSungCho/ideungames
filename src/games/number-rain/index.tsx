import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAutoPause } from '@/shared/game/hooks';
import { StartOverlay } from '@/shared/game/StartOverlay';
import { useLeaveAsking, useLeaveGuard } from '@/shared/leaveGuard';
import { useSettings } from '@/shared/settings/store';
import { hasProgress, useNumberRain } from './store';
import { StatusBar, TopBar } from './ui/Bars';
import { Field } from './ui/Field';
import { Keypad } from './ui/Keypad';
import { setupTitle } from './ui/labels';
import { Menu } from './ui/Menu';
import { music } from './ui/music';
import { RecordsPage } from './ui/RecordsPage';
import { ResultModal } from './ui/ResultModal';
import styles from './ui/NumberRain.module.css';

/** 화면이 그려질 때마다 흐른 시간을 알려준다 (느린 기기에서 한 번에 너무 많이 떨어지지 않게 100ms까지만) */
function useFrames(running: boolean, frame: (dt: number) => void) {
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let id = 0;
    const loop = (t: number) => {
      const dt = Math.min(100, Math.max(0, t - last));
      last = t;
      if (document.visibilityState === 'visible') frame(dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running, frame]);
}

function useKeyboard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useNumberRain.getState();
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

/** 배경 음악: 진행 중에만, 단계·피버에 따라 빠르기와 멜로디가 바뀐다 */
function useMusic(on: boolean) {
  const level = useNumberRain((s) => s.game?.level ?? 1);
  const fever = useNumberRain((s) => (s.game?.feverMs ?? 0) > 0);
  useEffect(() => music.setLevel(level), [level]);
  useEffect(() => music.setFever(fever), [fever]);
  useEffect(() => {
    if (!on) return;
    music.start();
    return () => music.stop();
  }, [on]);
}

function Play() {
  const game = useNumberRain((s) => s.game);
  const paused = useNumberRain((s) => s.paused);
  const musicOn = useNumberRain((s) => s.music);
  const challenge = useSettings((s) => s.mode) === 'challenge';
  // 그만하기·메뉴에서 나갔다 오면 메뉴부터 (이어하기로 바로 진행) — GAME_UX_GUIDE §2
  const [picking, setPicking] = useState(() => !game || game.status === 'done' || useNumberRain.getState().menuOnReturn);
  const leftFromMenu = useRef(false);
  leftFromMenu.current = picking || game?.status === 'ready';
  useEffect(() => {
    useNumberRain.setState({ menuOnReturn: false });
    return () => {
      if (leftFromMenu.current) useNumberRain.setState({ menuOnReturn: true });
    };
  }, []);
  // 새로고침·창 닫기 직전에도 지금 판을 저장
  useEffect(() => {
    const save = () => useNumberRain.getState().pause();
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);
  const resume = useCallback(() => {
    setPicking(false);
    useNumberRain.getState().start();
  }, []);
  const markQuit = useCallback(() => useNumberRain.setState({ menuOnReturn: true }), []);

  const live = !picking && game?.status === 'playing' && !paused;
  const asking = useLeaveAsking();
  useLeaveGuard(!picking && hasProgress(game), markQuit);
  useAutoPause(useNumberRain.getState().pause, picking);
  useFrames(live && !asking, useNumberRain.getState().frame);
  useKeyboard(live && !asking);
  useMusic(live && !asking && musicOn);

  if (picking || !game) {
    return <Menu onStart={() => setPicking(false)} onResume={hasProgress(game) ? resume : undefined} />;
  }

  const veiled = game.status === 'ready' || (game.status === 'playing' && paused);
  return (
    <div className={[styles.play, veiled && styles.veiled].filter(Boolean).join(' ')}>
      <TopBar onMenu={() => setPicking(true)} />
      <div className={styles.side}>
        <StatusBar showMistakes={challenge} />
      </div>
      <div className={styles.stage} data-stage>
        <Field />
        {veiled && (
          <StartOverlay
            ready={game.status === 'ready'}
            title={setupTitle(game)}
            onStart={useNumberRain.getState().start}
            readyHint="누르면 숫자 비가 내리기 시작해요"
            pausedHint="숫자 비가 멈춰 있어요"
          />
        )}
      </div>
      <div className={styles.padArea}>
        <Keypad />
      </div>
      {game.status === 'done' && <ResultModal onMenu={() => setPicking(true)} />}
    </div>
  );
}

export default function NumberRainGame() {
  return (
    <Routes>
      <Route index element={<Play />} />
      <Route path="records" element={<RecordsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
