import { useState } from 'react';
import { Link } from 'react-router';
import { formatTime } from '@/shared/format';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import type { Difficulty } from '../engine';
import { MEDAL_ICON, medalFor } from '../records';
import { hasProgress, recordKey, useSudoku } from '../store';
import { boardLabel, DIFFICULTIES, DIFFICULTY_LABEL, DIFFICULTY_STARS, modeLabel, SIZES } from './labels';
import styles from './Sudoku.module.css';

export function DifficultyPicker({ onStart, onResume }: { onStart: () => void; onResume?: () => void }) {
  const newGame = useSudoku((s) => s.newGame);
  const records = useSudoku((s) => s.records);
  const size = useSudoku((s) => s.size);
  const setSize = useSudoku((s) => s.setSize);
  const current = useSudoku((s) => s.game);
  const [confirm, setConfirm] = useState<Difficulty | null>(null);

  const begin = (d: Difficulty) => {
    newGame(d, size);
    onStart();
  };

  return (
    <div className={styles.picker}>
      <div className={styles.pickerIntro}>
        <Robot mood="happy" size={96} />
        <p className={styles.bubbleLarge}>
          가로줄, 세로줄, 굵은 네모 블록 안에
          <br />
          {size === 4 ? (
            <><b>1, 2, 3, 4</b>가 한 번씩만 들어가요!</>
          ) : (
            <><b>1부터 {size}까지</b> 한 번씩만 들어가요!</>
          )}
        </p>
      </div>

      {onResume && current && (
        <Button size="lg" onClick={onResume} className={styles.resume}>
          ▶ 하던 게임 이어하기 <small>({modeLabel(current.spec.size)} 블록 {DIFFICULTY_LABEL[current.difficulty]})</small>
        </Button>
      )}

      <div className={styles.sizeTabs} role="radiogroup" aria-label="보드 크기">
        {SIZES.map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={size === n}
            className={[styles.sizeTab, size === n && styles.sizeTabOn].filter(Boolean).join(' ')}
            onClick={() => setSize(n)}
          >
            <span className={styles.sizeName}>{modeLabel(n)} 블록</span>
            <span className={styles.sizeMeta}>{boardLabel(n)} · 숫자 1~{n}</span>
          </button>
        ))}
      </div>

      <div className={styles.diffList}>
        {DIFFICULTIES.map((d) => {
          const rec = records[recordKey(size, d)];
          const medal = medalFor(size, d, rec?.bestMs);
          return (
            <button
              key={d}
              className={[styles.diffCard, styles[`d_${d}`]].join(' ')}
              onClick={() => (hasProgress(current) ? setConfirm(d) : begin(d))}
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
              {medal && <span className={styles.diffMedal} aria-label="받은 메달">{MEDAL_ICON[medal]}</span>}
            </button>
          );
        })}
      </div>

      <Link to="records" className={styles.recordsLink}>
        🏆 내 기록 · 메달 보기
      </Link>

      <ConfirmDialog
        open={confirm !== null}
        title="새 게임을 시작할까?"
        message={current ? `하던 ${modeLabel(current.spec.size)} 블록 ${DIFFICULTY_LABEL[current.difficulty]} 게임은 취소돼요.` : undefined}
        cancelLabel="하던 게임 이어하기"
        confirmLabel="취소하고 새로 시작"
        onCancel={() => {
          setConfirm(null);
          onResume?.();
        }}
        onConfirm={() => {
          begin(confirm!);
          setConfirm(null);
        }}
      />
    </div>
  );
}
