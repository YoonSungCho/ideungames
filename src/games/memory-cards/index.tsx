import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAutoPause, useGameClock } from '@/shared/game/hooks';
import { StartOverlay } from '@/shared/game/StartOverlay';
import { useLeaveAsking, useLeaveGuard } from '@/shared/leaveGuard';
import { useSettings } from '@/shared/settings/store';
import { speak } from '@/shared/sound/speak';
import { hasProgress, isBattle, useMemoryCards } from './store';
import { Board } from './ui/Board';
import { Coach, ModeBar, PlayerPanel, StatusBar } from './ui/Bars';
import { players, setupTitle } from './ui/labels';
import { Menu } from './ui/Menu';
import { RecordsPage } from './ui/RecordsPage';
import { ResultModal } from './ui/ResultModal';
import styles from './ui/Memory.module.css';

/** 짝을 찾으면 이름(계산식이면 식과 답)을 읽어 준다 */
function useSayMatches() {
  const event = useMemoryCards((s) => s.event);
  useEffect(() => {
    if ((event?.kind === 'match' || event?.kind === 'won') && event.say) speak(event.say);
    // 대결: 틀리면 다음 차례를 불러 준다
    const s = useMemoryCards.getState().session;
    if (event?.kind === 'miss' && s && isBattle(s)) speak(`${players(s, useSettings.getState().playerName)[event.turn ?? 0].name} 차례!`);
  }, [event]);
}

function Play() {
  const session = useMemoryCards((s) => s.session);
  const paused = useMemoryCards((s) => s.paused);
  const challenge = useSettings((s) => s.mode) === 'challenge';
  // 그만하기·메뉴에서 나갔다 오면 메뉴부터 (이어하기로 바로 진행) — GAME_UX_GUIDE §2
  const [picking, setPicking] = useState(() => !session || session.status === 'done' || useMemoryCards.getState().menuOnReturn);
  const leftFromMenu = useRef(false);
  leftFromMenu.current = picking || session?.status === 'ready';
  useEffect(() => {
    useMemoryCards.setState({ menuOnReturn: false });
    return () => {
      if (leftFromMenu.current) useMemoryCards.setState({ menuOnReturn: true });
    };
  }, []);
  const resume = useCallback(() => {
    setPicking(false);
    useMemoryCards.getState().start();
  }, []);
  const markQuit = useCallback(() => useMemoryCards.setState({ menuOnReturn: true }), []);

  const live = !picking && session?.status === 'playing' && !paused;
  const asking = useLeaveAsking();
  useLeaveGuard(!picking && hasProgress(session), markQuit);
  useAutoPause(useMemoryCards.getState().pause, picking);
  useGameClock(live && !asking, useMemoryCards.getState().tick);
  useSayMatches();

  if (picking || !session) {
    return <Menu onStart={() => setPicking(false)} onResume={hasProgress(session) ? resume : undefined} />;
  }

  const veiled = session.status === 'ready' || (session.status === 'playing' && paused);
  const stage = (
    <div className={styles.stage} data-stage>
      <Board />
      {veiled && (
        <StartOverlay
          ready={session.status === 'ready'}
          title={setupTitle(session)}
          onStart={useMemoryCards.getState().start}
          readyHint={isBattle(session) ? '마주 앉아서 번갈아 뒤집어! 먼저 카드를 잠깐 보여 줄게.' : '누르면 카드를 잠깐 보여 줄게. 잘 기억해!'}
          pausedHint="카드는 다시 시작하면 보여요"
        />
      )}
    </div>
  );

  // 대결: 마주 앉아서 — 위(거꾸로)는 상대, 아래는 나
  if (isBattle(session))
    return (
      <div className={[styles.play, styles.battlePlay, veiled && styles.veiled].filter(Boolean).join(' ')}>
        <ModeBar onMenu={() => setPicking(true)} />
        <PlayerPanel k={1} />
        {stage}
        <PlayerPanel k={0} />
        {session.status === 'done' && <ResultModal onMenu={() => setPicking(true)} />}
      </div>
    );

  return (
    <div className={[styles.play, veiled && styles.veiled].filter(Boolean).join(' ')}>
      <ModeBar onMenu={() => setPicking(true)} />
      <div className={styles.side}>
        <StatusBar showMistakes={challenge} />
        <Coach />
      </div>
      {stage}
      {session.status === 'done' && <ResultModal onMenu={() => setPicking(true)} />}
    </div>
  );
}

export default function MemoryCardsGame() {
  return (
    <Routes>
      <Route index element={<Play />} />
      <Route path="records" element={<RecordsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
