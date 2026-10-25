import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useSettings } from '@/shared/settings/store';
import type { Dir } from '../engine/maze';
import { CHALLENGE_HINTS, hero, useMazeEscape } from '../store';
import { hold, releaseHold, stopWalk } from './walker';
import styles from './Maze.module.css';

const ARROW: Record<Dir, string> = { up: '▲', right: '▶', down: '▼', left: '◀' };
const KEYS: Record<string, Dir> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', w: 'up', d: 'right', s: 'down', a: 'left' };

export const hintLimit = (challenge: boolean) => (challenge ? CHALLENGE_HINTS : Infinity);

function move(d: Dir) {
  stopWalk();
  releaseHold();
  useMazeEscape.getState().step(d);
}

/** 화살표 키·WASD로 한 칸씩 (누르고 있으면 키 반복으로 계속) */
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

const ARROWS: Dir[] = ['up', 'right', 'down', 'left'];

/**
 * 조이스틱: 누르고 그쪽으로 밀면 손을 뗄 때까지 계속 간다 (꺾인 길은 알아서 따라 돎).
 * 가운데 손잡이는 친구 얼굴.
 */
export function Joystick() {
  const icon = useMazeEscape((s) => (s.session ? hero(s.session.hero).icon : '🙂'));
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const [dir, setDir] = useState<Dir | null>(null);
  const active = useRef(false);

  const update = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const R = r.width / 2;
    let dx = e.clientX - (r.left + R);
    let dy = e.clientY - (r.top + R);
    const len = Math.hypot(dx, dy);
    const max = R * 0.5;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setKnob({ x: dx, y: dy });
    // 가운데 조금은 쉬는 자리
    if (len < R * 0.18) {
      releaseHold();
      setDir(null);
      return;
    }
    const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    setDir(d);
    hold(d);
  };
  const end = () => {
    active.current = false;
    releaseHold();
    setKnob(null);
    setDir(null);
  };
  useEffect(() => releaseHold, []);

  return (
    <div
      className={[styles.joy, knob && styles.joyOn].filter(Boolean).join(' ')}
      role="group"
      aria-label="조이스틱"
      data-dir={dir ?? undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = true;
        update(e);
      }}
      onPointerMove={(e) => active.current && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      {ARROWS.map((d) => (
        <span key={d} className={[styles.joyArrow, styles[`j_${d}`], dir === d && styles.joyArrowOn].filter(Boolean).join(' ')} aria-hidden>
          {ARROW[d]}
        </span>
      ))}
      <span className={styles.knob} style={knob ? { transform: `translate(${knob.x}px, ${knob.y}px)` } : undefined} aria-hidden>
        {icon}
      </span>
    </div>
  );
}

/** 💡 힌트: 도착까지 길이 잠깐 반짝 */
export function HintButton() {
  const challenge = useSettings((s) => s.mode) === 'challenge';
  const hints = useMazeEscape((s) => s.session?.hints ?? 0);
  const limit = hintLimit(challenge);
  const left = limit - hints;
  return (
    <button
      className={styles.hintBtn}
      onClick={() => useMazeEscape.getState().hint(limit)}
      disabled={left <= 0}
      aria-label={challenge ? `힌트, ${left}번 남음` : '힌트'}
    >
      💡{challenge && <small>{left}</small>}
    </button>
  );
}

/** 아래(가로 화면은 오른쪽) 조작판: 조이스틱 + 힌트 */
export function Controls() {
  return (
    <div className={styles.controls}>
      <Joystick />
      <HintButton />
    </div>
  );
}
