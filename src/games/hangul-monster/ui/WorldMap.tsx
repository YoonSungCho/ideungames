import type { CSSProperties } from 'react';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { BADGES, BUILDING_TILE, MAPS, NPCS, type MapId } from '../data/world';
import { nextGoal, ROUTE, useHangulMonster } from '../store';
import { MapArt } from './MapArt';
import styles from './HangulMonster.module.css';

/** 이 지역에 들어가려면 필요한 배지 수 (지기가 막고 있음) */
const NEED: Record<MapId, number> = { town: 0, forest: 0, beach: 1, cave: 2, flower: 3, mountain: 4, tower: 5, castle: 6 };

/** 지금 지도에서 목표가 있는 칸: 같은 지도면 체육관·사람, 아니면 그쪽 출구 */
export function goalTile(here: MapId, goalMap: MapId, text: string): [number, number] | null {
  const m = MAPS[here];
  if (goalMap !== here) {
    const forward = ROUTE.indexOf(goalMap) > ROUTE.indexOf(here);
    const exit = m.exits.find((e) => (forward ? e.y === 0 : e.y > 0));
    return exit ? [exit.x, exit.y] : null;
  }
  const find = (ch: string) => {
    for (let y = 0; y < m.rows.length; y++) {
      const x = m.rows[y].indexOf(ch);
      if (x >= 0) return [x, y] as [number, number];
    }
    return null;
  };
  if (text.includes('연구소')) return find('L');
  if (text.includes('졸개')) return [9, 1];
  if (text.includes('체육관')) return find('G');
  const boss = NPCS.find((n) => n.kind === 'boss' && n.map === here);
  return boss ? [boss.x, boss.y] : null;
}

/** 🗺️ 한글 나라 지도: 지역 길 + 지금 지역 지도 + 다음 목표 */
export function WorldMap() {
  const s = useHangulMonster();
  const close = s.closeOverlay;
  const goal = nextGoal(s);
  const here = MAPS[s.map];
  const target = goalTile(s.map, goal.map, goal.text);
  const cols = here.rows[0].length;
  const rows = here.rows.length;
  const pct = (x: number, y: number) => ({ left: `${((x + 0.5) / cols) * 100}%`, top: `${((y + 0.5) / rows) * 100}%` }) as CSSProperties;

  return (
    <Modal open wide labelledBy="worldmap-title" onClose={close}>
      <div className={styles.sheet}>
        <h2 id="worldmap-title" className={styles.sheetTitle}>🗺️ 한글 나라 지도</h2>
        <p className={styles.goalBox} role="status">🎯 <b>다음 목표</b> {goal.text}</p>
        <div className={styles.mapSplit}>
          <ol className={styles.route} aria-label="지역 길">
            {[...ROUTE].reverse().map((id) => {
              const m = MAPS[id];
              const locked = s.badges < NEED[id] || (id !== 'town' && !s.defeated.includes('grunt0'));
              const gym = m.gym;
              const cleared = gym !== undefined && s.badges > gym;
              return (
                <li
                  key={id}
                  className={[styles.routeNode, id === s.map && styles.routeHere, id === goal.map && styles.routeGoal, locked && styles.routeLocked].filter(Boolean).join(' ')}
                  aria-label={`${m.name}${id === s.map ? ', 지금 여기' : ''}${locked ? ', 아직 못 감' : ''}${id === goal.map ? ', 다음 목표' : ''}`}
                >
                  <span className={styles.routeEmoji}>{locked ? '🔒' : m.emoji}</span>
                  <span className={styles.routeName}>{m.name}</span>
                  {gym !== undefined && <span className={styles.routeBadge} title={BADGES[gym].name}>{cleared ? BADGES[gym].icon : '·'}</span>}
                  {id === 'castle' && <span className={styles.routeBadge}>{s.champion ? '🏆' : '👺'}</span>}
                  {id === s.map && <span className={styles.here}>📍 여기</span>}
                  {id === goal.map && id !== s.map && <span className={styles.goalTag}>🎯</span>}
                </li>
              );
            })}
          </ol>
          <div className={styles.miniMapWrap}>
            <p className={styles.miniTitle}>{here.emoji} {here.name}</p>
            <div className={styles.miniMap} style={{ aspectRatio: `${cols} / ${rows}` }}>
              <MapArt map={s.map} />
              {here.rows.flatMap((r, y) => [...r].map((t, x) => (BUILDING_TILE[t] === 'center' ? <span key={`${x},${y}`} className={styles.mmIcon} style={pct(x, y)}>🏥</span> : null)))}
              {target && <span className={styles.mmGoal} style={pct(...target)} aria-label="목표">🎯</span>}
              <span className={styles.mmMe} style={pct(s.x, s.y)} aria-label="내 위치" />
            </div>
            <p className={styles.miniHint}>🔴 내 위치 · 🎯 가야 할 곳</p>
          </div>
        </div>
        <Button onClick={close}>닫기</Button>
      </div>
    </Modal>
  );
}
