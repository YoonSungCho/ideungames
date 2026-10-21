import { formatTime } from '@/shared/format';
import { Button } from '@/shared/ui/Button';
import { StarIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import { useSudoku } from '../store';
import { DIFFICULTIES, DIFFICULTY_LABEL, DIFFICULTY_STARS } from './labels';
import styles from './Sudoku.module.css';

export function DifficultyPicker({ onStart, onResume }: { onStart: () => void; onResume?: () => void }) {
  const newGame = useSudoku((s) => s.newGame);
  const records = useSudoku((s) => s.records);

  return (
    <div className={styles.picker}>
      <div className={styles.pickerIntro}>
        <Robot mood="happy" size={96} />
        <p className={styles.bubbleLarge}>
          가로줄, 세로줄, 네모 칸 안에
          <br />
          <b>1, 2, 3, 4</b>가 한 번씩만 들어가요!
        </p>
      </div>

      {onResume && (
        <Button size="lg" onClick={onResume} className={styles.resume}>
          ▶ 하던 게임 이어하기
        </Button>
      )}

      <div className={styles.diffList}>
        {DIFFICULTIES.map((d) => {
          const rec = records[d];
          return (
            <button
              key={d}
              className={[styles.diffCard, styles[`d_${d}`]].join(' ')}
              onClick={() => {
                newGame(d);
                onStart();
              }}
            >
              <span className={styles.diffStars}>
                {[1, 2, 3].map((k) => (
                  <StarIcon key={k} filled={k <= DIFFICULTY_STARS[d]} width={26} height={26} />
                ))}
              </span>
              <span className={styles.diffName}>{DIFFICULTY_LABEL[d]}</span>
              <span className={styles.diffMeta}>
                {rec?.wins ? `${rec.wins}번 성공` : '도전해 봐!'}
                {rec?.bestMs !== undefined && ` · 🏆 ${formatTime(rec.bestMs)}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
