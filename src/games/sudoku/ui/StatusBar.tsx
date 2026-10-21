import { formatTime } from '@/shared/format';
import { ClockIcon } from '@/shared/ui/icons';
import { useSudoku } from '../store';
import { DIFFICULTY_LABEL } from './labels';
import styles from './Sudoku.module.css';

export function StatusBar({ challenge, onNewGame }: { challenge: boolean; onNewGame: () => void }) {
  const game = useSudoku((s) => s.game)!;
  return (
    <div className={styles.status}>
      <button className={[styles.diffChip, styles[`d_${game.difficulty}`]].join(' ')} onClick={onNewGame}>
        {DIFFICULTY_LABEL[game.difficulty]} <span className={styles.chipHint}>▾ 새 게임</span>
      </button>
      {challenge && (
        <div className={styles.stats}>
          <span className={styles.stat} aria-label={`실수 ${game.mistakes}번`}>
            실수 <b>{game.mistakes}</b>
          </span>
          <span className={styles.stat} aria-label="걸린 시간">
            <ClockIcon width={18} height={18} /> <b>{formatTime(game.elapsedMs)}</b>
          </span>
        </div>
      )}
    </div>
  );
}
