import { Button } from '@/shared/ui/Button';
import { useSudoku } from '../store';
import { DIFFICULTY_LABEL, modeLabel } from './labels';
import styles from './Sudoku.module.css';

/** 시작 전 / 멈춤 중에 보드를 가리고 큰 시작 버튼을 보여준다 (시간은 누를 때부터). */
export function StartOverlay() {
  const game = useSudoku((s) => s.game)!;
  const start = useSudoku((s) => s.start);
  const ready = game.status === 'ready';

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <p className={styles.overlayTitle}>
          {ready ? `${modeLabel(game.spec.size)} 블록 · ${DIFFICULTY_LABEL[game.difficulty]}` : '잠깐 쉬는 중'}
        </p>
        <Button size="lg" className={styles.startBtn} onClick={start} autoFocus>
          ▶ {ready ? '시작하기' : '계속하기'}
        </Button>
        <p className={styles.overlayHint}>{ready ? '누르면 시간이 흘러가요' : '보드는 다시 시작하면 보여요'}</p>
      </div>
    </div>
  );
}
