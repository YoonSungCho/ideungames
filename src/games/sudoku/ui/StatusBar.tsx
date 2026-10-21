import { formatTime } from '@/shared/format';
import { ClockIcon } from '@/shared/ui/icons';
import { useSudoku } from '../store';
import { DIFFICULTY_LABEL } from './labels';
import styles from './Sudoku.module.css';

export function StatusBar({ showMistakes, onNewGame }: { showMistakes: boolean; onNewGame: () => void }) {
  const game = useSudoku((s) => s.game)!;
  const best = useSudoku((s) => s.records[game.difficulty]?.bestMs);
  return (
    <div className={styles.status}>
      <button className={[styles.diffChip, styles[`d_${game.difficulty}`]].join(' ')} onClick={onNewGame}>
        {DIFFICULTY_LABEL[game.difficulty]} <span className={styles.chipHint}>▾ 새 게임</span>
      </button>
      <div className={styles.stats}>
        {showMistakes && (
          <span className={styles.stat} aria-label={`실수 ${game.mistakes}번`}>
            실수 <b>{game.mistakes}</b>
          </span>
        )}
        <span className={styles.stat} aria-label="걸린 시간" title={best !== undefined ? `최고 기록 ${formatTime(best)}` : undefined}>
          <ClockIcon width={18} height={18} /> <b>{formatTime(game.elapsedMs)}</b>
          {best !== undefined && <small className={styles.bestInline}>🏆 {formatTime(best)}</small>}
        </span>
      </div>
    </div>
  );
}
