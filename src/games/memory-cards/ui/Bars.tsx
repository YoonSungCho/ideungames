import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL } from '@/shared/game/medals';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { ClockIcon } from '@/shared/ui/icons';
import { Robot, type RobotMood } from '@/shared/ui/Robot';
import { pairCount, theme } from '../engine/deck';
import { liveTarget } from '../records';
import { isBattle, peeking, recordKey, useMemoryCards } from '../store';
import { LEVEL_COLOR, LEVEL_LABEL, PLAYER_COLOR, players, RULE_ICON, RULE_LABEL } from './labels';
import styles from './Memory.module.css';

/** 상단 바 가운데: 지금 카드(테마·규칙·단계) → 누르면 메뉴 */
export function ModeBar({ onMenu }: { onMenu: () => void }) {
  const session = useMemoryCards((s) => s.session)!;
  const t = theme(session.theme);
  return (
    <HeaderSlot>
      <button
        className={styles.setupChip}
        style={{ '--d': LEVEL_COLOR[session.level] } as CSSProperties}
        onClick={onMenu}
        aria-label={`${session.rule === 'math' ? '' : `${t.name} 카드, `}${RULE_LABEL[session.rule]}, ${LEVEL_LABEL[session.level]}, 바꾸기`}
      >
        {session.rule === 'math' ? RULE_ICON.math : t.icon} <b>{RULE_LABEL[session.rule]}</b> {LEVEL_LABEL[session.level]} <span className={styles.chipHint}>▾</span>
      </button>
    </HeaderSlot>
  );
}

function PauseButton() {
  const pause = useMemoryCards((s) => s.pause);
  return (
    <button className={styles.pauseBtn} onClick={pause} aria-label="잠깐 멈추기">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
        <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
      </svg>
    </button>
  );
}

/**
 * 대결: 한 사람 칸 (이름 · 점수 · 차례). 마주 앉아 하니까
 * 상대(1) 칸은 화면 위쪽에 거꾸로 놓여 상대 쪽에서 바로 읽힌다.
 */
export function PlayerPanel({ k }: { k: 0 | 1 }) {
  const session = useMemoryCards((s) => s.session)!;
  const paused = useMemoryCards((s) => s.paused);
  const myName = useSettings((s) => s.playerName);
  const p = players(session, myName)[k];
  const now = session.status !== 'done' && session.turn === k;
  const live = session.status === 'playing' && !paused;
  return (
    <div className={[styles.playerRow, k === 1 && styles.upsideDown].filter(Boolean).join(' ')}>
      <span
        className={[styles.player, now && styles.playerOn].filter(Boolean).join(' ')}
        style={{ '--pc': PLAYER_COLOR[k] } as CSSProperties}
        aria-label={`${p.name} ${session.scores[k]}개${now ? ', 지금 차례' : ''}`}
      >
        <span className={styles.playerIcon}>{p.icon}</span>
        <span className={styles.playerName}>{p.name}</span>
        <span className={styles.turnMark}>{now ? (session.status === 'ready' ? '먼저 해!' : `${p.name} 차례!`) : session.status === 'done' ? '' : '기다려'}</span>
        <b>{session.scores[k]}</b>
      </span>
      {live && <PauseButton />}
    </div>
  );
}

/** 보드 위 한 줄: 찾은 짝 · 연속 · 메달 목표 · 최고 · (실수) · 시간 */
export function StatusBar({ showMistakes }: { showMistakes: boolean }) {
  const session = useMemoryCards((s) => s.session)!;
  const paused = useMemoryCards((s) => s.paused);
  const best = useMemoryCards((s) => s.records[recordKey(session)]?.best);
  const live = session.status === 'playing' && !paused;
  const target = session.status === 'done' ? null : liveTarget(session, session.elapsedMs);
  const total = pairCount(session);

  return (
    <div className={styles.status}>
      <span className={styles.stat} aria-label={`찾은 짝 ${session.found}개, 모두 ${total}개`}>
        💞 <b>{session.found}</b>/{total}
      </span>
      {session.combo >= 2 && (
        <span className={styles.combo} key={session.combo} aria-label={`${session.combo}연속 짝`}>
          🔥 {session.combo}연속
        </span>
      )}
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
      {showMistakes && (
        <span className={styles.stat} aria-label={`틀린 짝 ${session.misses}번`}>
          틀림 <b>{session.misses}</b>
        </span>
      )}
      <span className={styles.stat} aria-label="걸린 시간">
        <ClockIcon width={18} height={18} /> <b className={styles.time}>{formatTime(session.elapsedMs)}</b>
        {live && <PauseButton />}
      </span>
      <div className={styles.timeBar} aria-hidden>
        <span style={{ width: `${(session.found / total) * 100}%` }} />
      </div>
    </div>
  );
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** 가로 화면 오른쪽 칸에서 반응해 주는 띠봇 */
export function Coach() {
  const event = useMemoryCards((s) => s.event);
  const session = useMemoryCards((s) => s.session);
  const paused = useMemoryCards((s) => s.paused);
  const name = useSettings((s) => s.playerName);
  const [line, setLine] = useState<{ text: string; mood: RobotMood }>({ text: '준비됐어?', mood: 'idle' });
  const combo = session?.combo ?? 0;
  const battle = !!session && isBattle(session);
  const rivalId = session?.rival;
  const battleWho = useMemo(() => (battle && rivalId ? players({ rival: rivalId }, name) : null), [battle, rivalId, name]);

  useEffect(() => {
    if (!event) return;
    if (event.kind === 'start') setLine({ text: '카드를 잘 봐 둬!', mood: 'think' });
    if (event.kind === 'match')
      setLine(combo >= 3 ? { text: `${combo}연속! 기억력 대장! 🔥`, mood: 'cheer' } : { text: `${event.name}! ${pick(['찾았다!', '딩동댕!', '짝꿍이야!'])}`, mood: 'happy' });
    if (event.kind === 'miss')
      setLine(battleWho ? { text: `아까워! 이제 ${battleWho[event.turn ?? 0].name} 차례!`, mood: 'oops' } : { text: pick(['아까워! 어디 있었더라?', '괜찮아, 위치를 기억해 봐!', '다음엔 찾을 수 있어!']), mood: 'oops' });
    if (event.kind === 'match' && battleWho) setLine({ text: `${event.name}! 한 번 더 해!`, mood: 'happy' });
    if (event.kind === 'won') setLine({ text: battleWho ? '다 찾았다! 누가 이겼을까?' : `${callName(name)}, 다 찾았어!`, mood: 'cheer' });
  }, [event, combo, name, battleWho]);

  const shown =
    session?.status === 'ready' ? { text: `${callName(name)}, 준비되면 시작하기를 눌러 줘!`, mood: 'happy' as const }
    : session?.status === 'playing' && paused ? { text: '쉬는 중이야. 다시 하려면 계속하기!', mood: 'think' as const }
    : session && peeking(session) ? { text: '어디에 뭐가 있는지 잘 봐!', mood: 'think' as const }
    : battleWho && session?.status === 'playing' && event?.kind === 'start' ? { text: `${battleWho[session.turn].name} 먼저 해!`, mood: 'happy' as const }
    : line;

  return (
    <div className={styles.coach}>
      <Robot mood={shown.mood} size={60} key={shown.mood === 'oops' ? `oops${event?.key}` : 'robot'} />
      <p className={styles.bubble} key={`line${event?.key}`} aria-live="polite">{shown.text}</p>
    </div>
  );
}
