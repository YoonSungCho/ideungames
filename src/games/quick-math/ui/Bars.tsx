import { useRef, useState } from 'react';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL } from '@/shared/game/medals';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { ClockIcon } from '@/shared/ui/icons';
import { liveTarget } from '../records';
import { BLITZ_MS, hasProgress, recordKey, remainingMs, SPRINT_COUNT, useQuickMath, type GameMode } from '../store';
import { DIFFICULTY_LABEL, MODE_LABEL, opsSymbols } from './labels';
import styles from './QuickMath.module.css';

const MODES: GameMode[] = ['sprint', 'blitz'];

/** 상단 바(허브 헤더 가운데): 게임 방식 전환 + 연산·난이도 칩(→ 메뉴) */
export function ModeBar({ onMenu }: { onMenu: () => void }) {
  const session = useQuickMath((s) => s.session)!;
  const paused = useQuickMath((s) => s.paused);
  const { newGame, pause, start } = useQuickMath.getState();
  const [switchTo, setSwitchTo] = useState<GameMode | null>(null);
  const resumeAfter = useRef(false);

  const choose = (m: GameMode) => {
    if (m === session.mode) return;
    if (hasProgress(session)) {
      resumeAfter.current = !paused;
      pause();
      setSwitchTo(m);
    } else newGame({ ...session, mode: m });
  };

  return (
    <HeaderSlot>
      <div className={styles.modeSwitch} role="radiogroup" aria-label="게임 방식 바꾸기">
        {MODES.map((m) => (
          <button key={m} role="radio" aria-checked={m === session.mode} className={m === session.mode ? styles.on : undefined} onClick={() => choose(m)}>
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <button className={[styles.setupChip, styles[`d_${session.difficulty}`]].join(' ')} onClick={onMenu} aria-label={`계산 ${opsSymbols(session.ops)}, 난이도 ${DIFFICULTY_LABEL[session.difficulty]}, 바꾸기`}>
        <b>{opsSymbols(session.ops)}</b> {DIFFICULTY_LABEL[session.difficulty]} <span className={styles.chipHint}>▾</span>
      </button>
      <ConfirmDialog
        open={switchTo !== null}
        title={switchTo ? `${MODE_LABEL[switchTo]}로 바꿀까?` : ''}
        message="진행 중인 게임은 취소돼요."
        cancelLabel="하던 게임 계속하기"
        confirmLabel={switchTo ? `취소하고 ${MODE_LABEL[switchTo]} 하기` : ''}
        onCancel={() => {
          setSwitchTo(null);
          if (resumeAfter.current) start();
        }}
        onConfirm={() => {
          newGame({ ...session, mode: switchTo! });
          setSwitchTo(null);
        }}
      />
    </HeaderSlot>
  );
}

/** 보드 위 한 줄: 진행/점수 · 메달 목표 · 최고 · (실수) · 시간 */
export function StatusBar({ showMistakes }: { showMistakes: boolean }) {
  const session = useQuickMath((s) => s.session)!;
  const paused = useQuickMath((s) => s.paused);
  const pause = useQuickMath((s) => s.pause);
  const best = useQuickMath((s) => s.records[recordKey(session)]?.best);
  const live = session.status === 'playing' && !paused;
  const sprint = session.mode === 'sprint';
  const target = session.status === 'done' ? null : liveTarget(session, session.elapsedMs, session.correct);
  const clock = sprint ? session.elapsedMs : remainingMs(session);
  const hurry = !sprint && clock <= 10_000 && session.status === 'playing';

  return (
    <div className={styles.status}>
      <span className={styles.stat} aria-label={sprint ? `${session.index + 1}번째 문제` : `정답 ${session.correct}개`}>
        {sprint ? (
          <>📝 <b>{Math.min(session.index + 1, SPRINT_COUNT)}</b>/{SPRINT_COUNT}</>
        ) : (
          <>⭐ <b>{session.correct}</b>개</>
        )}
      </span>
      {session.combo >= 3 && (
        <span className={styles.combo} key={session.combo} aria-label={`${session.combo}연속 정답`}>
          🔥 {session.combo}연속
        </span>
      )}
      <div className={styles.paceInfo}>
        {target && (
          <span className={styles[`pace_${target.medal}`]}>
            {MEDAL_ICON[target.medal]} {MEDAL_LABEL[target.medal]}까지{' '}
            <b>{'sprintLeftMs' in target ? formatTime(target.sprintLeftMs!) : `${target.need}개`}</b>
          </span>
        )}
        {best !== undefined && (
          <span className={styles.paceBest}>🏆 <b>{sprint ? formatTime(best) : `${best}개`}</b></span>
        )}
      </div>
      {showMistakes && (
        <span className={styles.stat} aria-label={`실수 ${session.mistakes}번`}>
          실수 <b>{session.mistakes}</b>
        </span>
      )}
      <span className={[styles.stat, hurry && styles.hurry].filter(Boolean).join(' ')} aria-label={sprint ? '걸린 시간' : '남은 시간'}>
        <ClockIcon width={18} height={18} /> <b className={styles.time}>{formatTime(sprint ? clock : Math.ceil(clock / 1000) * 1000)}</b>
        {live && (
          <button className={styles.pauseBtn} onClick={pause} aria-label="잠깐 멈추기">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        )}
      </span>
      {!sprint && (
        <div className={styles.timeBar} aria-hidden>
          <span style={{ width: `${(remainingMs(session) / BLITZ_MS) * 100}%` }} />
        </div>
      )}
      {sprint && (
        <div className={styles.timeBar} aria-hidden>
          <span style={{ width: `${(session.index / SPRINT_COUNT) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
