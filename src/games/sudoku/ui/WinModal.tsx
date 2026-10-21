import { useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { StarIcon } from '@/shared/ui/icons';
import { Modal } from '@/shared/ui/Modal';
import { Robot } from '@/shared/ui/Robot';
import type { BoardSize } from '../engine';
import { recordKey, useSudoku } from '../store';
import { DIFFICULTY_LABEL, sizeLabel } from './labels';
import styles from './Sudoku.module.css';

export function WinModal({ onPickDifficulty }: { onPickDifficulty: () => void }) {
  const game = useSudoku((s) => s.game)!;
  const records = useSudoku((s) => s.records);
  const newGame = useSudoku((s) => s.newGame);
  const { playerName, mode } = useSettings();
  const navigate = useNavigate();

  const slips = game.mistakes + game.hintsUsed;
  const stars = slips === 0 ? 3 : slips <= 2 ? 2 : 1;
  const best = records[recordKey(game.spec.size, game.difficulty)]?.bestMs;
  const firstClear = game.prevBestMs === undefined;
  const newRecord = !firstClear && game.elapsedMs < game.prevBestMs!;

  return (
    <>
      <Confetti />
      <Modal open labelledBy="win-title">
        <div className={styles.win}>
          <Robot mood="cheer" size={110} />
          <h2 id="win-title">{callName(playerName)}, 해냈어!</h2>
          <div className={styles.stars} aria-label={`별 ${stars}개`}>
            {[1, 2, 3].map((k) => (
              <StarIcon key={k} filled={k <= stars} width={48} height={48} className={k <= stars ? styles.starOn : styles.starOff} style={{ animationDelay: `${k * 0.15}s` }} />
            ))}
          </div>
          <p className={styles.winSub}>스도쿠 {sizeLabel(game.spec.size)} {DIFFICULTY_LABEL[game.difficulty]} 완성!</p>
          {newRecord && (
            <p className={styles.recordBanner}>
              🏆 최고 기록 갱신! <s>{formatTime(game.prevBestMs!)}</s> → <b>{formatTime(game.elapsedMs)}</b>
            </p>
          )}
          {firstClear && <p className={styles.recordBanner}>🎉 첫 기록이에요!</p>}
          <dl className={styles.winStats}>
            <div><dt>이번 기록</dt><dd>{formatTime(game.elapsedMs)}</dd></div>
            <div><dt>최고 기록</dt><dd>{best !== undefined ? formatTime(best) : '-'}</dd></div>
            {mode === 'challenge' && (
              <>
                <div><dt>실수</dt><dd>{game.mistakes}</dd></div>
                <div><dt>힌트</dt><dd>{game.hintsUsed}</dd></div>
              </>
            )}
          </dl>
          <div className={styles.winActions}>
            <Button size="lg" onClick={() => newGame(game.difficulty, game.spec.size as BoardSize)}>한 판 더!</Button>
            <Button variant="secondary" onClick={onPickDifficulty}>난이도 바꾸기</Button>
            <Button variant="ghost" onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
