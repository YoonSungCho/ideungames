import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { BUILDING_NAME, BUILDING_TILE, MAPS, type MapId } from '../data/world';
import { MapArt } from './MapArt';
import { findPath, visibleNpcs, type Dir } from '../engine/world';
import { flagsOf, useHangulMonster } from '../store';
import { MonsterArt } from './MonsterArt';
import { Trainer } from './Trainer';
import styles from './HangulMonster.module.css';

const STEP_MS = 150;

/** 누를 수 있는 칸 (그림은 MapArt가 그린다). 지도가 바뀔 때만 다시 만든다 */
const Tiles = memo(function Tiles({ map, onTap }: { map: MapId; onTap: (x: number, y: number) => void }) {
  const m = MAPS[map];
  return (
    <>
      {m.rows.map((row, y) =>
        [...row].map((t, x) => {
          const b = BUILDING_TILE[t];
          return (
            <div
              key={`${x},${y}`}
              className={[styles.tile, b && styles.building].filter(Boolean).join(' ')}
              style={{ '--x': x, '--y': y } as CSSProperties}
              data-xy={`${x},${y}`}
              onClick={() => onTap(x, y)}
              aria-label={b ? BUILDING_NAME[b] : undefined}
              role={b ? 'button' : undefined}
            />
          );
        }),
      )}
    </>
  );
});

/** 걸어 다니는 지도: 누른 칸까지 걸어가거나, 방향 버튼·화살표 키로 움직인다 */
export function World() {
  const map = useHangulMonster((s) => s.map);
  const x = useHangulMonster((s) => s.x);
  const y = useHangulMonster((s) => s.y);
  const dir = useHangulMonster((s) => s.dir);
  const badges = useHangulMonster((s) => s.badges);
  const defeated = useHangulMonster((s) => s.defeated);
  const picked = useHangulMonster((s) => s.picked);
  const party = useHangulMonster((s) => s.party);
  const toast = useHangulMonster((s) => s.toast);
  const busy = useHangulMonster((s) => !!(s.dialog || s.battle || s.overlay || s.mini));
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [walking, setWalking] = useState(false);
  const queue = useRef<Dir[]>([]);
  // 맨 앞 친구가 한 칸 뒤에서 따라온다
  const [follow, setFollow] = useState({ map, x, y });
  const last = useRef({ map, x, y });
  useEffect(() => {
    const prev = last.current;
    if (prev.map !== map) setFollow({ map, x, y });
    else if (prev.x !== x || prev.y !== y) setFollow(prev);
    last.current = { map, x, y };
  }, [map, x, y]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const stop = useCallback(() => {
    queue.current = [];
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setWalking(false);
  }, []);

  /** 줄 서 있는 걸음을 차례로 */
  const run = useCallback(() => {
    if (timer.current) return;
    const tick = () => {
      const d = queue.current.shift();
      if (!d || useHangulMonster.getState().walk(d) === 'stopped' || !queue.current.length) stop();
    };
    setWalking(true);
    tick();
    if (queue.current.length) timer.current = setInterval(tick, STEP_MS);
  }, [stop]);

  const onTap = useCallback(
    (tx: number, ty: number) => {
      const s = useHangulMonster.getState();
      if (s.dialog || s.battle || s.overlay || s.mini) return;
      stop();
      const path = findPath(s.map, [s.x, s.y], [tx, ty], flagsOf(s));
      if (!path?.length) return;
      queue.current = path;
      run();
    },
    [run, stop],
  );

  // 방향 버튼을 누르고 있으면 계속 걷기
  const hold = useRef<ReturnType<typeof setInterval> | null>(null);
  const press = (d: Dir) => {
    stop();
    release();
    const go = () => {
      if (useHangulMonster.getState().walk(d) === 'stopped') release();
    };
    go();
    setWalking(true);
    hold.current = setInterval(go, STEP_MS);
  };
  const release = () => {
    if (hold.current) clearInterval(hold.current);
    hold.current = null;
    setWalking(false);
  };
  useEffect(() => () => {
    stop();
    release();
  }, [stop]);

  // 키보드: 화살표·WASD
  useEffect(() => {
    const KEYS: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key];
      if (!d || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      const now = performance.now();
      // 꾹 누르고 있을 때만 걷는 빠르기를 맞춘다 (따로따로 누르면 바로바로)
      if (e.repeat && now - last < STEP_MS - 20) return;
      last = now;
      stop();
      useHangulMonster.getState().walk(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stop]);

  useEffect(() => {
    if (busy) {
      stop();
      release();
    }
  }, [busy, stop]);

  const m = MAPS[map];
  const cols = m.rows[0].length;
  const rows = m.rows.length;
  const T = Math.max(34, Math.min(64, Math.floor(Math.min(size.w / 9, size.h / 8))));
  const mapW = cols * T;
  const mapH = rows * T;
  const center = (view: number, full: number, at: number) => (full <= view ? (view - full) / 2 : Math.min(0, Math.max(view - full, view / 2 - (at + 0.5) * T)));
  const camX = center(size.w, mapW, x);
  const camY = center(size.h, mapH, y);
  const npcs = visibleNpcs(map, { badges, defeated, picked, hasStarter: party.length > 0 });

  return (
    <div ref={ref} className={[styles.world, styles[`theme_${m.theme}`]].join(' ')} data-world>
      {size.w > 0 && (
        <div className={styles.mapLayer} style={{ width: mapW, height: mapH, transform: `translate(${camX}px, ${camY}px)`, '--t': `${T}px` } as CSSProperties}>
          <MapArt map={map} />
          <Tiles map={map} onTap={onTap} />
          {npcs.map((n) => (
            // 지도 칸처럼 다룬다 (카메라 밖에 있는 건 화면 밖이 맞음)
            <div
              key={n.id}
              role="button"
              className={[styles.npc, n.kind === 'item' && styles.item].filter(Boolean).join(' ')}
              style={{ '--x': n.x, '--y': n.y } as CSSProperties}
              onClick={() => onTap(n.x, n.y)}
              aria-label={n.name}
            >
              <span className={styles.npcEmoji}>{n.emoji}</span>
              {(n.kind === 'trainer' || n.kind === 'boss') && !defeated.includes(n.id) && <span className={styles.alert} aria-hidden>❗</span>}
            </div>
          ))}
          {party[0] && follow.map === map && (
            <div className={styles.follower} style={{ '--x': follow.x, '--y': follow.y } as CSSProperties} aria-hidden>
              <MonsterArt sp={party[0].sp} size={T} animate={walking} />
            </div>
          )}
          <div className={styles.player} style={{ '--x': x, '--y': y } as CSSProperties} data-player={`${x},${y}`}>
            <Trainer dir={dir} walking={walking} />
          </div>
        </div>
      )}
      {toast && (
        <p key={toast.id} className={styles.toast} role="status">
          {toast.text}
        </p>
      )}
      <div className={styles.dpad} role="group" aria-label="방향 버튼">
        {(['up', 'left', 'right', 'down'] as Dir[]).map((d) => (
          <button
            key={d}
            className={[styles.dKey, styles[`d_${d}`]].join(' ')}
            aria-label={{ up: '위로', down: '아래로', left: '왼쪽으로', right: '오른쪽으로' }[d]}
            onPointerDown={(e) => {
              e.preventDefault();
              press(d);
            }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            onContextMenu={(e) => e.preventDefault()}
          >
            {{ up: '▲', down: '▼', left: '◀', right: '▶' }[d]}
          </button>
        ))}
      </div>
    </div>
  );
}
