import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { josa } from '@/shared/korean';
import { BIT, lineTo, pathToGoal, slide, xy, type Dir } from '../engine/maze';
import { hero, isLive, useMazeEscape } from '../store';
import { stopWalk, walk } from './walker';
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
  const down = useRef<{ x: number; y: number } | null>(null);

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

  useEffect(() => () => stopWalk(), []);

  const onPointerDown = (e: PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = down.current;
    down.current = null;
    if (!start || !isLive(useMazeEscape.getState())) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cellPx = (rect.width * U) / size;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const s = useMazeEscape.getState().session!;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > Math.max(16, cellPx * 0.45)) {
      // 밀기: 그쪽 길을 따라 갈림길까지
      const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      const path = slide(s.maze, s.pos, d, s.maze.stars.filter((c) => !s.got.includes(c)));
      if (path.length) walk(path);
      else useMazeEscape.getState().step(d);
      return;
    }
    // 누르기: 같은 줄에 벽 없이 이어진 칸이면 거기까지
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size / U - PAD / U);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size / U - PAD / U);
    if (x < 0 || y < 0 || x >= n || y >= maze.h) return;
    const path = lineTo(s.maze, s.pos, y * n + x);
    if (path) walk(path);
  };

  const veiled = session.status === 'ready' || (session.status === 'playing' && paused);

  return (
    <div className={styles.boardWrap}>
      <div
        className={styles.board}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (down.current = null)}
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
