import { useRef, useState } from 'react';
import { formatTime } from '@/shared/format';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { ClockIcon } from '@/shared/ui/icons';
import type { BoardSize } from '../engine';
import { MEDAL_ICON, MEDAL_LABEL, nextTarget } from '../records';
import { hasProgress, recordKey, useSudoku } from '../store';
import { DIFFICULTY_LABEL, SIZES, sizeLabel } from './labels';
import styles from './Sudoku.module.css';

export function StatusBar({ showMistakes, onNewGame }: { showMistakes: boolean; onNewGame: () => void }) {
  const game = useSudoku((s) => s.game)!;
  const paused = useSudoku((s) => s.paused);
  const { newGame, pause, start } = useSudoku.getState();
  const size = game.spec.size as BoardSize;
  const best = useSudoku((s) => s.records[recordKey(size, game.difficulty)]?.bestMs);
  const [switchTo, setSwitchTo] = useState<BoardSize | null>(null);
  // 물어보기 전에 진행 중이었으면, 취소 시 다시 이어서 (원래 멈춰 있었으면 그대로)
  const resumeAfter = useRef(false);
  const live = game.status === 'playing' && !paused;
  const target = game.status === 'won' ? null : nextTarget(size, game.difficulty, game.elapsedMs);
  const beatingBest = best !== undefined && game.elapsedMs < best;

  const chooseSize = (n: BoardSize) => {
    if (n === size) return;
    if (hasProgress(game)) {
      resumeAfter.current = live;
      pause();
      setSwitchTo(n);
    } else newGame(game.difficulty, n);
  };

  return (
    <div className={styles.statusWrap}>
      <div className={styles.status}>
        <div className={styles.sizeSwitch} role="radiogroup" aria-label="보드 크기 바꾸기">
          {SIZES.map((n) => (
            <button key={n} role="radio" aria-checked={n === size} className={n === size ? styles.sizeOn : undefined} onClick={() => chooseSize(n)}>
              {sizeLabel(n)}
            </button>
          ))}
        </div>
        <button className={[styles.diffChip, styles[`d_${game.difficulty}`]].join(' ')} onClick={onNewGame} aria-label={`난이도 ${DIFFICULTY_LABEL[game.difficulty]}, 바꾸기`}>
          {DIFFICULTY_LABEL[game.difficulty]} <span className={styles.chipHint}>▾</span>
        </button>
        {showMistakes && (
          <span className={[styles.stat, styles.mistakes].join(' ')} aria-label={`실수 ${game.mistakes}번`}>
            실수 <b>{game.mistakes}</b>
          </span>
        )}
      </div>
      <div className={styles.pace}>
        <div className={styles.paceInfo}>
          {target ? (
            <span className={styles[`pace_${target.medal}`]}>
              {MEDAL_ICON[target.medal]} {MEDAL_LABEL[target.medal]} 메달까지 <b>{formatTime(target.leftMs)}</b>
            </span>
          ) : (
            game.status !== 'won' && <span>끝까지 완주해 보자! 💪</span>
          )}
          {best !== undefined && (
            <span className={[styles.paceBest, beatingBest && styles.paceBeating].filter(Boolean).join(' ')}>
              🏆 내 최고 <b>{formatTime(best)}</b>
            </span>
          )}
        </div>
        <span className={styles.stat} aria-label="걸린 시간">
          <ClockIcon width={18} height={18} /> <b className={styles.time}>{formatTime(game.elapsedMs)}</b>
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
      <ConfirmDialog
        open={switchTo !== null}
        title={switchTo ? `${sizeLabel(switchTo)}로 바꿀까?` : ''}
        message="진행 중인 게임은 취소돼요."
        cancelLabel="하던 게임 계속하기"
        confirmLabel={switchTo ? `취소하고 ${sizeLabel(switchTo)} 하기` : ''}
        onCancel={() => {
          setSwitchTo(null);
          if (resumeAfter.current) start();
        }}
        onConfirm={() => {
          newGame(game.difficulty, switchTo!);
          setSwitchTo(null);
        }}
      />
    </div>
  );
}
