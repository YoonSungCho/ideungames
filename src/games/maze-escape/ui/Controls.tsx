import { useEffect } from 'react';
import { useSettings } from '@/shared/settings/store';
import type { Dir } from '../engine/maze';
import { CHALLENGE_HINTS, useMazeEscape } from '../store';
import { stopWalk } from './walker';
import styles from './Maze.module.css';

const ARROW: Record<Dir, string> = { up: '▲', right: '▶', down: '▼', left: '◀' };
const NAME: Record<Dir, string> = { up: '위로', right: '오른쪽으로', down: '아래로', left: '왼쪽으로' };
const KEYS: Record<string, Dir> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', w: 'up', d: 'right', s: 'down', a: 'left' };

export const hintLimit = (challenge: boolean) => (challenge ? CHALLENGE_HINTS : Infinity);

function move(d: Dir) {
  stopWalk();
  useMazeEscape.getState().step(d);
}

/** 화살표 키·WASD로 한 칸씩 */
export function useKeyboard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const d = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      if (!d) return;
      e.preventDefault();
      move(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

/** 십자 방향 버튼 + 가운데 💡 힌트 */
export function DPad() {
  const challenge = useSettings((s) => s.mode) === 'challenge';
  const hints = useMazeEscape((s) => s.session?.hints ?? 0);
  const limit = hintLimit(challenge);
  const left = limit - hints;
  return (
    <div className={styles.dpad} role="group" aria-label="방향 버튼">
      {(['up', 'left', 'right', 'down'] as Dir[]).map((d) => (
        <button key={d} className={[styles.dirBtn, styles[`d_${d}`]].join(' ')} onClick={() => move(d)} aria-label={NAME[d]}>
          {ARROW[d]}
        </button>
      ))}
      <button
        className={styles.hintBtn}
        onClick={() => useMazeEscape.getState().hint(limit)}
        disabled={left <= 0}
        aria-label={challenge ? `힌트, ${left}번 남음` : '힌트'}
      >
        💡{challenge && <small>{left}</small>}
      </button>
    </div>
  );
}
