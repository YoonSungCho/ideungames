import { useEffect, useState, type CSSProperties } from 'react';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL } from '@/shared/game/medals';
import { callName, josa } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { ClockIcon } from '@/shared/ui/icons';
import { Robot, type RobotMood } from '@/shared/ui/Robot';
import { STAR_COUNT } from '../engine/maze';
import { liveTarget } from '../records';
import { hero, recordKey, useMazeEscape } from '../store';
import { LEVEL_COLOR, LEVEL_LABEL, sizeLabel } from './labels';
import styles from './Maze.module.css';

/** 상단 바 가운데: 지금 미로 → 누르면 메뉴 */
export function ModeBar({ onMenu }: { onMenu: () => void }) {
  const session = useMazeEscape((s) => s.session)!;
  const h = hero(session.hero);
  return (
    <HeaderSlot>
      <button
        className={styles.setupChip}
        style={{ '--d': LEVEL_COLOR[session.level] } as CSSProperties}
        onClick={onMenu}
        aria-label={`${h.name}, ${LEVEL_LABEL[session.level]} 미로, 바꾸기`}
      >
        {h.icon} <b>{LEVEL_LABEL[session.level]}</b> {sizeLabel(session.level)} <span className={styles.chipHint}>▾</span>
      </button>
    </HeaderSlot>
  );
}

/** 보드 위 한 줄: 별 · 메달 목표 · 최고 · 시간 */
export function StatusBar() {
  const session = useMazeEscape((s) => s.session)!;
  const paused = useMazeEscape((s) => s.paused);
  const pause = useMazeEscape((s) => s.pause);
  const best = useMazeEscape((s) => s.records[recordKey(session)]?.best);
  const live = session.status === 'playing' && !paused;
  const target = session.status === 'done' ? null : liveTarget(session.level, session.elapsedMs);

  return (
    <div className={styles.status}>
      <span className={styles.stat} aria-label={`별 ${session.got.length}개, 모두 ${STAR_COUNT}개`}>
        {Array.from({ length: STAR_COUNT }, (_, k) => (
          <span key={k} className={k < session.got.length ? styles.starOn : styles.starOff}>⭐</span>
        ))}
      </span>
      <div className={styles.paceInfo}>
        {target && (
          <span className={styles[`pace_${target.medal}`]}>
            {MEDAL_ICON[target.medal]} {MEDAL_LABEL[target.medal]}까지 <b>{formatTime(target.leftMs)}</b>
          </span>
        )}
        {best !== undefined && (
          <span className={styles.paceBest}>
            🏆 <b>{formatTime(best)}</b>
          </span>
        )}
      </div>
      <span className={styles.stat} aria-label="걸린 시간">
        <ClockIcon width={18} height={18} /> <b className={styles.time}>{formatTime(session.elapsedMs)}</b>
        {live && (
          <button className={styles.pauseBtn} onClick={pause} aria-label="잠깐 멈추기">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        )}
      </span>
    </div>
  );
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** 가로 화면 오른쪽 칸의 띠봇 */
export function Coach() {
  const event = useMazeEscape((s) => s.event);
  const session = useMazeEscape((s) => s.session);
  const paused = useMazeEscape((s) => s.paused);
  const name = useSettings((s) => s.playerName);
  const [line, setLine] = useState<{ text: string; mood: RobotMood }>({ text: '준비됐어?', mood: 'idle' });
  const h = session ? hero(session.hero) : null;
  const got = session?.got.length ?? 0;

  useEffect(() => {
    if (!event || !h) return;
    if (event.kind === 'start') setLine({ text: `${josa(h.goalName, '을/를')} 찾으러 가자! ${h.icon} 친구를 잡고 끌어 봐!`, mood: 'happy' });
    if (event.kind === 'star') setLine(got >= STAR_COUNT ? { text: '별을 다 모았어! 이제 도착!', mood: 'cheer' } : { text: pick(['반짝! 별 찾았다!', '보물 별이야!', '좋아, 별 하나 더!']), mood: 'happy' });
    if (event.kind === 'bump') setLine({ text: pick(['앗, 벽이야!', '다른 길로 가 볼까?', '쿵! 막혔네']), mood: 'oops' });
    if (event.kind === 'hint') setLine({ text: '반짝이는 길을 따라가 봐!', mood: 'think' });
    if (event.kind === 'won') setLine({ text: `${callName(name)}, 탈출 성공!`, mood: 'cheer' });
  }, [event, h, got, name]);

  const shown =
    session?.status === 'ready' ? { text: `${callName(name)}, 준비되면 시작하기를 눌러 줘!`, mood: 'happy' as const }
    : session?.status === 'playing' && paused ? { text: '쉬는 중이야. 다시 하려면 계속하기!', mood: 'think' as const }
    : line;

  return (
    <div className={styles.coach}>
      <Robot mood={shown.mood} size={60} key={shown.mood === 'oops' ? `oops${event?.key}` : 'robot'} />
      <p className={styles.bubble} key={`line${event?.key}`} aria-live="polite">{shown.text}</p>
    </div>
  );
}
