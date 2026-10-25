import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { josa } from '@/shared/korean';
import { BIT, lineTo, pathBetween, pathToGoal, slide, xy, type Dir } from '../engine/maze';
import { hero, isLive, useMazeEscape } from '../store';
import { hold, releaseHold, stopWalk, walk } from './walker';
import styles from './Maze.module.css';

/** 칸 하나 = 10 (SVG 단위) */
const U = 10;
const PAD = 2;

/** 힌트 길을 보여 주는 동안만 true */
function useHintPath() {
  const until = useMazeEscape((s) => s.hintUntil);
  const [, rerender] = useState(0);
  useEffect(() => {
    const left = until - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => rerender((n) => n + 1), left + 20);
    return () => clearTimeout(id);
  }, [until]);
  return until > Date.now();
}

export function Board() {
  const session = useMazeEscape((s) => s.session)!;
  const paused = useMazeEscape((s) => s.paused);
  const bumpKey = useMazeEscape((s) => (s.event?.kind === 'bump' ? s.event.key : 0));
  const { maze, pos } = session;
  const h = hero(session.hero);
  const n = maze.w;
  const size = n * U + PAD * 2;
  const showHint = useHintPath();
  const gesture = useRef<{ mode: 'trace' | 'press' | 'push'; x: number; y: number; t: number; cellPx: number; steps: number; dir?: Dir } | null>(null);
  const [tracing, setTracing] = useState(false);

  // 벽: 칸마다 위·왼쪽 + 테두리의 오른쪽·아래
  const wallPath = useMemo(() => {
    let d = '';
    maze.walls.forEach((w, i) => {
      const [x, y] = xy(maze, i);
      const X = PAD + x * U;
      const Y = PAD + y * U;
      if (w & BIT.up) d += `M${X} ${Y}h${U}`;
      if (w & BIT.left) d += `M${X} ${Y}v${U}`;
      if (x === n - 1 && w & BIT.right) d += `M${X + U} ${Y}v${U}`;
      if (y === maze.h - 1 && w & BIT.down) d += `M${X} ${Y + U}h${U}`;
    });
    return d;
  }, [maze, n]);

  const center = (i: number) => {
    const [x, y] = xy(maze, i);
    return [PAD + x * U + U / 2, PAD + y * U + U / 2] as const;
  };
  const [px, py] = center(pos);
  const [gx, gy] = center(maze.goal);
  const hintPath = showHint ? [pos, ...pathToGoal(maze, pos)] : [];

  useEffect(
    () => () => {
      stopWalk();
      releaseHold();
    },
    [],
  );

  /** 화면 좌표 → 미로 칸 (밖이면 -1) */
  const cellAt = (el: HTMLElement, cx: number, cy: number) => {
    const rect = el.getBoundingClientRect();
    const x = Math.floor((((cx - rect.left) / rect.width) * size - PAD) / U);
    const y = Math.floor((((cy - rect.top) / rect.height) * size - PAD) / U);
    return x < 0 || y < 0 || x >= n || y >= maze.h ? -1 : y * n + x;
  };

  /*
   * 손가락 조작 세 가지:
   *  - 친구를 잡고 길을 따라 끌기 → 손가락을 따라 걷는다
   *  - 다른 곳을 누르고 한쪽으로 밀고 있기 → 그쪽으로 계속 (조이스틱처럼), 휙 밀고 떼면 갈림길까지
   *  - 그냥 누르기 → 같은 줄에 벽 없이 이어진 칸이면 거기까지
   */
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !isLive(useMazeEscape.getState())) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const cellPx = (rect.width * U) / size;
    const s = useMazeEscape.getState().session!;
    const [hx, hy] = center(s.pos);
    const heroX = rect.left + (hx / size) * rect.width;
    const heroY = rect.top + (hy / size) * rect.height;
    const onHero = Math.hypot(e.clientX - heroX, e.clientY - heroY) <= Math.max(cellPx * 0.9, 22);
    stopWalk();
    releaseHold();
    gesture.current = { mode: onHero ? 'trace' : 'press', x: e.clientX, y: e.clientY, t: Date.now(), cellPx, steps: s.steps };
    setTracing(onHero);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !isLive(useMazeEscape.getState())) return;
    if (g.mode === 'trace') {
      const s = useMazeEscape.getState().session!;
      const cell = cellAt(e.currentTarget, e.clientX, e.clientY);
      if (cell < 0 || cell === s.pos) return;
      // 손가락이 빨라 몇 칸 건너뛰어도 곧게 이어진 길이면 따라간다
      // (돌아가는 길은 안 감: 벽 너머로 끌면 벽을 빙 돌아 미로를 대신 풀어 주게 된다)
      const [ax, ay] = xy(s.maze, s.pos);
      const [bx, by] = xy(s.maze, cell);
      const far = Math.abs(ax - bx) + Math.abs(ay - by);
      const path = far <= 3 ? pathBetween(s.maze, s.pos, cell, far) : null;
      if (path) for (const c of path) useMazeEscape.getState().stepTo(c);
      return;
    }
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === 'press' && Math.hypot(dx, dy) < Math.max(14, g.cellPx * 0.4)) return;
    g.mode = 'push';
    const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    g.dir = d;
    hold(d);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    setTracing(false);
    releaseHold();
    if (!g || !isLive(useMazeEscape.getState())) return;
    const s = useMazeEscape.getState().session!;
    if (g.mode === 'push') {
      // 휙 밀고 바로 뗐으면 그 길을 따라 갈림길까지
      if (g.dir && Date.now() - g.t < 260 && s.steps - g.steps <= 1) {
        const path = slide(s.maze, s.pos, g.dir, s.maze.stars.filter((c) => !s.got.includes(c)));
        if (path.length) walk(path);
      }
      return;
    }
    if (g.mode === 'press') {
      const cell = cellAt(e.currentTarget, e.clientX, e.clientY);
      const path = cell >= 0 ? lineTo(s.maze, s.pos, cell) : null;
      if (path) walk(path);
    }
  };

  const onPointerCancel = () => {
    gesture.current = null;
    setTracing(false);
    releaseHold();
  };

  const veiled = session.status === 'ready' || (session.status === 'playing' && paused);

  return (
    <div className={styles.boardWrap}>
      <div
        className={styles.board}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        data-tracing={tracing || undefined}
        data-pos={pos}
        data-hint={hintPath.length > 1 || undefined}
        role="img"
        aria-label={`미로 ${n}×${n}, ${josa(h.name, '이/가')} ${josa(h.goalName, '을/를')} 찾아가요`}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className={styles.svg} aria-hidden>
          <defs>
            <pattern id="maze-floor" width={U * 2} height={U * 2} patternUnits="userSpaceOnUse" x={PAD} y={PAD}>
              <rect width={U * 2} height={U * 2} fill="#fdf1d2" />
              <rect width={U} height={U} fill="#fbeac2" />
              <rect x={U} y={U} width={U} height={U} fill="#fbeac2" />
            </pattern>
          </defs>
          <rect x={PAD} y={PAD} width={n * U} height={maze.h * U} fill="url(#maze-floor)" rx="2" />
          {!veiled && (
            <>
              {session.trail.map((c) => {
                const [x, y] = center(c);
                return <circle key={c} cx={x} cy={y} r={1.1} className={styles.trail} />;
              })}
              {hintPath.length > 1 && <polyline points={hintPath.map((c) => center(c).join(',')).join(' ')} className={styles.hint} />}
              <circle cx={gx} cy={gy} r={U * 0.42} className={styles.goalRing} />
              <text x={gx} y={gy} className={styles.emoji} fontSize={U * 0.72}>{h.goal}</text>
              {maze.stars.map((c) => {
                if (session.got.includes(c)) return null;
                const [x, y] = center(c);
                return <text key={c} x={x} y={y} className={styles.emoji} fontSize={U * 0.6}>⭐</text>;
              })}
            </>
          )}
          <path d={wallPath} className={styles.wallShade} transform="translate(0 0.9)" />
          <path d={wallPath} className={styles.wall} />
          <path d={wallPath} className={styles.wallLight} />
          {!veiled && (
            <g className={styles.heroG} style={{ transform: `translate(${px}px, ${py}px)` }}>
              <circle r={U * 0.48} className={[styles.grab, tracing && styles.grabOn].filter(Boolean).join(' ')} />
              <g key={bumpKey} className={bumpKey ? styles.bump : undefined}>
                <ellipse cx="0" cy={U * 0.32} rx={U * 0.28} ry={U * 0.09} fill="rgb(0 0 0 / 0.15)" />
                <text x="0" y="0" className={styles.emoji} fontSize={U * 0.78}>{h.icon}</text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
