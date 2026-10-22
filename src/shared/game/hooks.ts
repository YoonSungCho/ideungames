import { useEffect, useRef } from 'react';

/** running인 동안 250ms마다 흐른 시간을 tick(ms)으로 알려준다. 화면이 안 보이면 세지 않는다. */
export function useGameClock(running: boolean, tick: (ms: number) => void) {
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

/**
 * 앱을 내리거나(화면 숨김) 게임 화면을 떠나면 멈춘다 → 돌아오면 "계속하기".
 * picking(메뉴를 보는 중)이 되어도 멈춘다.
 */
export function useAutoPause(pause: () => void, picking: boolean) {
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    const onVisibility = () => document.visibilityState === 'hidden' && pauseRef.current();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      pauseRef.current();
    };
  }, []);
  useEffect(() => {
    if (picking) pauseRef.current();
  }, [picking]);
}
