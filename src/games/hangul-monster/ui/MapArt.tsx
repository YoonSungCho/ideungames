import { memo, type ReactNode } from 'react';
import { BUILDING_TILE, MAPS, type Building, type MapId } from '../data/world';
import styles from './MapArt.module.css';

/**
 * 지도 그림 (SVG 한 장). 한 칸 = 32 단위.
 * 바닥(풀·길·물·모래·동굴·성·탑) → 물건(나무·수풀·꽃·바위·산·건물)을 줄 순서대로 그려 위쪽이 뒤로 가게 한다.
 * 길·물은 이웃 칸을 보고 가장자리를 둥글게/물거품으로 그린다.
 */
const U = 32;
const INK = '#2b2350';

const hash = (x: number, y: number, k = 0) => {
  let h = (x * 374761393 + y * 668265263 + k * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};
const rnd = (x: number, y: number, k = 0) => (hash(x, y, k) % 1000) / 1000;

/** 모서리마다 다른 둥글기의 네모 [왼위, 오위, 오아래, 왼아래] */
function rrect(x: number, y: number, w: number, h: number, [a, b, c, d]: number[]) {
  return `M${x + a} ${y} H${x + w - b} Q${x + w} ${y} ${x + w} ${y + b} V${y + h - c} Q${x + w} ${y + h} ${x + w - c} ${y + h} H${x + d} Q${x} ${y + h} ${x} ${y + h - d} V${y + a} Q${x} ${y} ${x + a} ${y} Z`;
}

const GRASS: Record<string, [string, string]> = {
  town: ['#93d46c', '#86c860'], forest: ['#86c95e', '#79bb54'], flower: ['#9edb78', '#90cf6b'],
  beach: ['#9ad870', '#8ccc64'], mountain: ['#a3c96f', '#96bd63'], cave: ['#75625a', '#6c5a52'],
  castle: ['#5b4a8a', '#4f3f7d'], tower: ['#a4b0c0', '#97a3b4'],
};

const PATHY = new Set(['=']);
const WATERY = new Set(['~', '_']);

function Building({ b, x, y, theme }: { b: Building; x: number; y: number; theme: string }) {
  // 건물은 칸보다 조금 크게, 아래쪽을 칸에 맞춰 그린다
  const X = x * U - 6;
  const Y = y * U - 22;
  const W = U + 12;
  const roof: Record<Building, string> = { lab: '#4f8fe0', home: '#ef6f5c', shop: '#3fb6a8', center: '#ff6f9a', gym: theme === 'tower' ? '#4f8fb8' : theme === 'mountain' ? '#f2b705' : '#9b6bff' };
  const wall = b === 'gym' ? '#f3efff' : '#fff7ea';
  const r = roof[b];
  return (
    <g>
      <ellipse cx={X + W / 2} cy={Y + 54} rx={W / 2 + 2} ry="5" fill="#000" opacity="0.15" />
      {b === 'gym' ? (
        <>
          <rect x={X + 2} y={Y + 22} width={W - 4} height="30" rx="4" fill={wall} stroke={INK} strokeWidth="2" />
          <path d={`M${X} ${Y + 24} Q${X + W / 2} ${Y - 6} ${X + W} ${Y + 24} Z`} fill={r} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${X + W / 2} ${Y + 6} V${Y - 10}`} stroke={INK} strokeWidth="1.6" />
          <path d={`M${X + W / 2} ${Y - 10} L${X + W / 2 + 10} ${Y - 6} L${X + W / 2} ${Y - 2} Z`} fill="#ffd166" stroke={INK} strokeWidth="1.2" />
          <circle cx={X + W / 2} cy={Y + 32} r="5" fill="#ffd166" stroke={INK} strokeWidth="1.5" />
          <rect x={X + W / 2 - 6} y={Y + 40} width="12" height="12" rx="2" fill={r} stroke={INK} strokeWidth="1.5" />
        </>
      ) : (
        <>
          <rect x={X + 4} y={Y + 22} width={W - 8} height="30" rx="2" fill={wall} stroke={INK} strokeWidth="2" />
          <path d={`M${X - 1} ${Y + 25} L${X + W / 2} ${Y + 2} L${X + W + 1} ${Y + 25} Z`} fill={r} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${X + 6} ${Y + 20} L${X + W / 2} ${Y + 6} L${X + W - 6} ${Y + 20}`} fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
          <rect x={X + W / 2 - 5} y={Y + 38} width="10" height="14" rx="2" fill="#a0683c" stroke={INK} strokeWidth="1.5" />
          <rect x={X + 8} y={Y + 30} width="8" height="7" rx="1" fill="#bfe7ff" stroke={INK} strokeWidth="1.2" />
          <rect x={X + W - 16} y={Y + 30} width="8" height="7" rx="1" fill="#bfe7ff" stroke={INK} strokeWidth="1.2" />
          {b === 'center' && <path d={`M${X + W / 2 - 2} ${Y + 12} h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 Z`} fill="#fff" stroke="#c9184a" strokeWidth="0.8" />}
          {b === 'shop' && <path d={`M${X + 4} ${Y + 24} h${W - 8} v5 q-${(W - 8) / 8} 4 -${(W - 8) / 4} 0 q-${(W - 8) / 8} 4 -${(W - 8) / 4} 0 q-${(W - 8) / 8} 4 -${(W - 8) / 4} 0 q-${(W - 8) / 8} 4 -${(W - 8) / 4} 0 Z`} fill="#ffd166" stroke={INK} strokeWidth="1.2" />}
          {b === 'lab' && <text x={X + W / 2} y={Y + 21} textAnchor="middle" fontSize="8" fontFamily="Jua, sans-serif" fill="#fff">한글</text>}
          {b === 'home' && <rect x={X + W - 14} y={Y + 4} width="6" height="10" fill="#b5654a" stroke={INK} strokeWidth="1.2" />}
        </>
      )}
    </g>
  );
}

function Tree({ x, y, theme, k }: { x: number; y: number; theme: string; k: number }) {
  const cx = x * U + 16 + (k - 0.5) * 4;
  const by = y * U + 28;
  const s = 0.9 + k * 0.2;
  if (theme === 'beach') {
    return (
      <g>
        <ellipse cx={cx} cy={by + 1} rx="9" ry="3" fill="#000" opacity="0.15" />
        <path d={`M${cx - 2} ${by} Q${cx + 4} ${by - 14} ${cx + 1} ${by - 26}`} stroke="#9c6a3d" strokeWidth="5" fill="none" strokeLinecap="round" />
        {[-60, -10, 40, 100, 150].map((a, i) => (
          <path key={i} d={`M${cx + 1} ${by - 26} q${Math.cos((a * Math.PI) / 180) * 10} ${Math.sin((a * Math.PI) / 180) * 6 - 6} ${Math.cos((a * Math.PI) / 180) * 16 * s} ${Math.sin((a * Math.PI) / 180) * 10 + 2}`} stroke="#3fa34d" strokeWidth="5" fill="none" strokeLinecap="round" />
        ))}
        <circle cx={cx + 1} cy={by - 24} r="2.5" fill="#8a5a2b" />
      </g>
    );
  }
  if (theme === 'mountain' || theme === 'forest') {
    const g = theme === 'forest' ? ['#2f8f4e', '#3fa95e', '#5cc477'] : ['#3a7d4a', '#4c9a5b', '#69b676'];
    return (
      <g>
        <ellipse cx={cx} cy={by + 1} rx="11" ry="3.5" fill="#000" opacity="0.16" />
        <rect x={cx - 2.5} y={by - 8} width="5" height="9" fill="#8a5a2b" />
        <path d={`M${cx} ${by - 34 * s} L${cx + 13 * s} ${by - 6} L${cx - 13 * s} ${by - 6} Z`} fill={g[0]} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d={`M${cx} ${by - 38 * s} L${cx + 10 * s} ${by - 16} L${cx - 10 * s} ${by - 16} Z`} fill={g[1]} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d={`M${cx - 2} ${by - 34 * s} L${cx - 7 * s} ${by - 20}`} stroke={g[2]} strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  const c = theme === 'flower' ? ['#e46fa4', '#ff8fc0', '#ffc2dd'] : ['#3f9d4c', '#55b860', '#7fd47f'];
  return (
    <g>
      <ellipse cx={cx} cy={by + 1} rx="12" ry="3.5" fill="#000" opacity="0.16" />
      <rect x={cx - 3} y={by - 10} width="6" height="11" rx="2" fill="#8a5a2b" stroke={INK} strokeWidth="1.2" />
      <circle cx={cx} cy={by - 18} r={12 * s} fill={c[0]} stroke={INK} strokeWidth="1.4" />
      <circle cx={cx - 5} cy={by - 21} r={7 * s} fill={c[1]} />
      <circle cx={cx - 6} cy={by - 24} r={3 * s} fill={c[2]} />
      {theme === 'town' && k > 0.6 && <circle cx={cx + 5} cy={by - 14} r="2.2" fill="#ff6f6f" stroke={INK} strokeWidth="0.8" />}
    </g>
  );
}

function MapArtInner({ map }: { map: MapId }) {
  const m = MAPS[map];
  const rows = m.rows;
  const h = rows.length;
  const w = rows[0].length;
  const theme = m.theme;
  const at = (x: number, y: number) => rows[y]?.[x] ?? '';
  const [g1, g2] = GRASS[theme];
  const ground: ReactNode[] = [];
  const objects: ReactNode[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = at(x, y);
      const X = x * U;
      const Y = y * U;
      const k = rnd(x, y);
      const key = `${x},${y}`;
      // ── 바닥 ──
      if (t === '~' || t === '_') {
        ground.push(<rect key={key} x={X} y={Y} width={U} height={U} fill="#4fb2f5" />);
        const edges: string[] = [];
        if (!WATERY.has(at(x, y - 1)) && y > 0) edges.push(`M${X} ${Y + 2} H${X + U}`);
        if (!WATERY.has(at(x, y + 1)) && y < h - 1) edges.push(`M${X} ${Y + U - 2} H${X + U}`);
        if (!WATERY.has(at(x - 1, y)) && x > 0) edges.push(`M${X + 2} ${Y} V${Y + U}`);
        if (!WATERY.has(at(x + 1, y)) && x < w - 1) edges.push(`M${X + U - 2} ${Y} V${Y + U}`);
        if (edges.length) ground.push(<path key={`${key}f`} d={edges.join(' ')} stroke="#e8f7ff" strokeWidth="4" opacity="0.8" strokeLinecap="round" />);
        if (t === '~' && k > 0.35) ground.push(<path key={`${key}w`} className={styles.wave} d={`M${X + 6 + k * 8} ${Y + 12 + k * 10} q4 -4 8 0 q4 4 8 0`} stroke="#bfe6ff" strokeWidth="2" fill="none" strokeLinecap="round" />);
        if (t === '_') {
          ground.push(
            <g key={`${key}b`}>
              <rect x={X + 4} y={Y} width={U - 8} height={U} fill="#c48a52" stroke={INK} strokeWidth="1.2" />
              {[6, 14, 22].map((dy) => <path key={dy} d={`M${X + 4} ${Y + dy + 2} H${X + U - 4}`} stroke="#8f5c2f" strokeWidth="1.2" />)}
              <path d={`M${X + 4} ${Y} V${Y + U} M${X + U - 4} ${Y} V${Y + U}`} stroke="#6b4423" strokeWidth="2.4" />
            </g>,
          );
        }
        continue;
      }
      if (t === 'C' || t === 'K' || t === 'W') {
        const front = !['C', 'K', 'W'].includes(at(x, y + 1)) && y < h - 1;
        const [top, face, lineC] = t === 'C' ? ['#3a2f2e', '#5a4744', '#2a2120'] : t === 'K' ? ['#2d2347', '#4b3b78', '#1f1835'] : ['#3e4757', '#5d6a7e', '#2c3340'];
        ground.push(<rect key={key} x={X} y={Y} width={U} height={U} fill={top} />);
        if (front) {
          ground.push(<rect key={`${key}f`} x={X} y={Y + 10} width={U} height={U - 10} fill={face} />);
          if (t === 'K') ground.push(<path key={`${key}b`} d={`M${X} ${Y + 20} H${X + U} M${X + 10} ${Y + 10} V${Y + 20} M${X + 22} ${Y + 20} V${Y + U}`} stroke={lineC} strokeWidth="1.5" />, <path key={`${key}c`} d={`M${X} ${Y + 10} V${Y + 4} H${X + 8} V${Y + 10} M${X + 16} ${Y + 10} V${Y + 4} H${X + 24} V${Y + 10}`} fill={face} stroke={lineC} strokeWidth="1.2" />);
          else if (t === 'W') ground.push(<path key={`${key}b`} d={`M${X} ${Y + 14} H${X + U} M${X + 4} ${Y + 18} v10 M${X + U - 4} ${Y + 18} v10`} stroke={lineC} strokeWidth="1.5" />, <circle key={`${key}r`} cx={X + 16} cy={Y + 22} r="2" fill="#8ea0b8" />);
          else ground.push(<path key={`${key}b`} d={`M${X + 4 + k * 10} ${Y + 14} l6 6 l-3 6 M${X + 20} ${Y + 18} l5 4`} stroke={lineC} strokeWidth="1.5" fill="none" />);
        } else if (t === 'C' && k > 0.7) ground.push(<circle key={`${key}s`} cx={X + 10 + k * 10} cy={Y + 12} r="3" fill="#4a3c3a" />);
        continue;
      }
      if (t === 'c' || t === ';') {
        ground.push(<rect key={key} x={X} y={Y} width={U} height={U} fill={t === ';' ? '#5a4842' : (x + y) % 2 ? g1 : g2} />);
        if (k > 0.75) ground.push(<path key={`${key}k`} d={`M${X + 6} ${Y + 10 + k * 10} l6 3 l4 -2`} stroke="#5b4a45" strokeWidth="1.2" fill="none" />);
        if (t === ';') {
          ground.push(<path key={`${key}d`} d={`M${X + 4} ${Y + 26} l4 -8 l4 8 M${X + 18} ${Y + 28} l3 -6 l3 6`} stroke="#3d302c" strokeWidth="2" fill="none" />);
          if (k > 0.55) ground.push(<path key={`${key}g`} className={styles.glow} d={`M${X + 22} ${Y + 14} l3 -7 l3 7 l-3 4 Z`} fill="#7be0ff" stroke="#2b8fb0" strokeWidth="1" />);
        }
        continue;
      }
      if (t === 'k') {
        ground.push(<rect key={key} x={X} y={Y} width={U} height={U} fill={(x + y) % 2 ? g1 : g2} />);
        ground.push(<rect key={`${key}i`} x={X + 2} y={Y + 2} width={U - 4} height={U - 4} fill="none" stroke="#6d5ca0" strokeWidth="1" opacity="0.6" />);
        continue;
      }
      if (t === 'm' || t === ':') {
        ground.push(<rect key={key} x={X} y={Y} width={U} height={U} fill={t === ':' ? '#8b98ab' : g1} />);
        ground.push(<rect key={`${key}p`} x={X + 1} y={Y + 1} width={U - 2} height={U - 2} rx="3" fill="none" stroke="#7a8799" strokeWidth="1.2" />);
        ground.push(...[[4, 4], [28, 4], [4, 28], [28, 28]].map(([dx, dy]) => <circle key={`${key}r${dx}${dy}`} cx={X + dx} cy={Y + dy} r="1.3" fill="#6b778a" />));
        if (t === ':') {
          ground.push(
            <g key={`${key}g`} className={styles.gear} style={{ transformOrigin: `${X + 16}px ${Y + 16}px` }}>
              {[0, 45, 90, 135].map((a) => <rect key={a} x={X + 14} y={Y + 6} width="4" height="20" rx="1" transform={`rotate(${a} ${X + 16} ${Y + 16})`} fill="#c7a94a" />)}
              <circle cx={X + 16} cy={Y + 16} r="6" fill="#c7a94a" stroke="#8f7426" strokeWidth="1.2" />
              <circle cx={X + 16} cy={Y + 16} r="2" fill="#8f7426" />
            </g>,
          );
        }
        continue;
      }
      // 풀·모래 바탕
      const sand = t === 's';
      ground.push(<rect key={key} x={X} y={Y} width={U} height={U} fill={sand ? '#f6e2ad' : (hash(x, y, 7) % 3 === 0 ? g2 : g1)} />);
      if (sand) {
        if (k > 0.5) ground.push(<circle key={`${key}d`} cx={X + 8 + k * 14} cy={Y + 10 + k * 12} r="1.4" fill="#d9bf80" />);
        if (k > 0.92) ground.push(<path key={`${key}sh`} d={`M${X + 10} ${Y + 20} q4 -6 8 0 Z`} fill="#ffb3a0" stroke={INK} strokeWidth="1" />);
      } else if (t === '.' && k > 0.6) {
        ground.push(<path key={`${key}t`} d={`M${X + 6 + k * 16} ${Y + 22} l2 -5 l2 5 M${X + 12 + k * 8} ${Y + 12} l1.5 -4 l1.5 4`} stroke="#6fb24f" strokeWidth="1.6" fill="none" strokeLinecap="round" />);
      }
      if (t === '.' && k > 0.93 && theme !== 'mountain') ground.push(<circle key={`${key}fl`} cx={X + 20} cy={Y + 14} r="2.2" fill={['#fff', '#ffd166', '#ff8fb8'][hash(x, y, 3) % 3]} />);
      if (PATHY.has(t)) {
        const p = (dx: number, dy: number) => PATHY.has(at(x + dx, y + dy)) || (y + dy < 0 || y + dy >= h);
        const R = 10;
        const corners = [!p(0, -1) && !p(-1, 0) ? R : 0, !p(0, -1) && !p(1, 0) ? R : 0, !p(0, 1) && !p(1, 0) ? R : 0, !p(0, 1) && !p(-1, 0) ? R : 0];
        if (theme === 'tower') {
          ground.push(<rect key={`${key}p`} x={X} y={Y} width={U} height={U} fill="#d9b84a" />, <path key={`${key}s`} d={`M${X} ${Y + 8} l8 -8 M${X} ${Y + 24} l24 -24 M${X + 8} ${Y + U} l24 -24 M${X + 24} ${Y + U} l8 -8`} stroke="#3e4757" strokeWidth="3" opacity="0.5" />);
          continue;
        }
        ground.push(<path key={`${key}p`} d={rrect(X, Y, U, U, corners)} fill={theme === 'mountain' ? '#d8c08e' : '#ecd39d'} />);
        if (k > 0.55) ground.push(<circle key={`${key}pb`} cx={X + 6 + k * 18} cy={Y + 8 + k * 16} r="1.6" fill="#c9a96c" />);
      }

      // ── 물건 ──
      if (t === ',') {
        objects.push(
          <g key={`${key}g`} className={styles.grass} style={{ animationDelay: `${-k * 2}s`, transformOrigin: `${X + 16}px ${Y + 30}px` }}>
            {[[6, 0], [16, -2], [26, 0], [11, 8], [21, 8]].map(([dx, dy], i) => (
              <path key={i} d={`M${X + dx - 5} ${Y + 22 + dy} L${X + dx - 2} ${Y + 8 + dy} L${X + dx} ${Y + 16 + dy} L${X + dx + 2} ${Y + 6 + dy} L${X + dx + 5} ${Y + 22 + dy} Z`} fill={theme === 'flower' ? '#5fbf5a' : '#3f9a43'} stroke="#2a6e2e" strokeWidth="1" strokeLinejoin="round" />
            ))}
          </g>,
        );
      } else if (t === '*') {
        objects.push(
          <g key={`${key}f`}>
            {[[8, 10], [22, 8], [14, 22], [26, 24]].map(([dx, dy], i) => {
              const c = ['#ff8fb8', '#ffd166', '#fff', '#c9a6ff', '#ff7a59'][(hash(x, y, i) % 5)];
              return (
                <g key={i}>
                  {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={X + dx + Math.cos((a * Math.PI) / 180) * 2.6} cy={Y + dy + Math.sin((a * Math.PI) / 180) * 2.6} r="2.2" fill={c} />)}
                  <circle cx={X + dx} cy={Y + dy} r="1.4" fill="#ffb703" />
                </g>
              );
            })}
          </g>,
        );
      } else if (t === '#') {
        objects.push(<Tree key={`${key}t`} x={x} y={y} theme={theme} k={k} />);
      } else if (t === 'o') {
        objects.push(
          <g key={`${key}o`}>
            <ellipse cx={X + 16} cy={Y + 27} rx="12" ry="3.5" fill="#000" opacity="0.15" />
            <path d={`M${X + 4} ${Y + 26} Q${X + 3} ${Y + 12} ${X + 14} ${Y + 8} Q${X + 26} ${Y + 6} ${X + 28} ${Y + 18} Q${X + 30} ${Y + 26} ${X + 24} ${Y + 28} Z`} fill="#a59a92" stroke={INK} strokeWidth="1.5" />
            <path d={`M${X + 10} ${Y + 14} Q${X + 14} ${Y + 10} ${X + 19} ${Y + 11}`} stroke="#d7cfc8" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>,
        );
      } else if (t === '^') {
        objects.push(
          <g key={`${key}m`}>
            <path d={`M${X - 4} ${Y + U} L${X + 12 + k * 6} ${Y - 6 - k * 6} L${X + U + 4} ${Y + U} Z`} fill={k > 0.5 ? '#9c8a74' : '#8a7a66'} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d={`M${X + 6 + k * 3} ${Y + 6 - k * 3} L${X + 12 + k * 6} ${Y - 6 - k * 6} L${X + 19 + k * 3} ${Y + 6 - k * 3} L${X + 15 + k * 4} ${Y + 3} L${X + 12 + k * 6} ${Y + 7} L${X + 9 + k * 4} ${Y + 3} Z`} fill="#fff" />
          </g>,
        );
      }
      const b = BUILDING_TILE[t];
      if (b) objects.push(<Building key={`${key}h`} b={b} x={x} y={y} theme={theme} />);
    }
  }

  return (
    <svg className={styles.map} viewBox={`0 0 ${w * U} ${h * U}`} preserveAspectRatio="none" aria-hidden>
      {ground}
      {objects}
    </svg>
  );
}

export const MapArt = memo(MapArtInner);
