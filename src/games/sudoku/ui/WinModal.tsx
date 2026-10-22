import { Link, useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { StarIcon } from '@/shared/ui/icons';
import { Modal } from '@/shared/ui/Modal';
import type { BoardSize } from '../engine';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS, medalFor, nextMedalAfter } from '../records';
import { recordKey, useSudoku } from '../store';
import { DIFFICULTY_LABEL, modeLabel } from './labels';
import styles from './Sudoku.module.css';

export function WinModal({ onPickDifficulty }: { onPickDifficulty: () => void }) {
  const game = useSudoku((s) => s.game)!;
  const records = useSudoku((s) => s.records);
  const newGame = useSudoku((s) => s.newGame);
  const { playerName, mode } = useSettings();
  const navigate = useNavigate();

  const size = game.spec.size as BoardSize;
  const slips = game.mistakes + game.hintsUsed;
  const stars = slips === 0 ? 3 : slips <= 2 ? 2 : 1;
  const best = records[recordKey(size, game.difficulty)]?.bestMs;
  const firstClear = game.prevBestMs === undefined;
  // 화면에 보이는 초 단위로 빨라졌을 때만 갱신 축하 (0:12 → 0:12 방지)
  const newRecord = !firstClear && Math.floor(game.elapsedMs / 1000) < Math.floor(game.prevBestMs! / 1000);
  const medal = medalFor(size, game.difficulty, game.elapsedMs);
  const prevMedal = medalFor(size, game.difficulty, game.prevBestMs);
  const medalUp = !!medal && (!prevMedal || MEDALS.indexOf(medal) < MEDALS.indexOf(prevMedal));
  const next = nextMedalAfter(size, game.difficulty, best);

  return (
    <>
      <Confetti />
      <Modal open labelledBy="win-title">
        <div className={styles.win}>
          <div className={styles.winMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '완주'}>
            {medal ? MEDAL_ICON[medal] : '🎖️'}
          </div>
          <h2 id="win-title">{callName(playerName)}, 해냈어!</h2>
          <div className={styles.stars} aria-label={`별 ${stars}개`}>
            {[1, 2, 3].map((k) => (
              <StarIcon key={k} filled={k <= stars} width={40} height={40} className={k <= stars ? styles.starOn : styles.starOff} style={{ animationDelay: `${k * 0.15}s` }} />
            ))}
          </div>
          <p className={styles.winSub}>
            스도쿠 {modeLabel(size)} 블록 {DIFFICULTY_LABEL[game.difficulty]} 완성!
            {medal && <> · <b className={styles[`pace_${medal}`]}>{MEDAL_LABEL[medal]} 메달</b></>}
          </p>
          {newRecord && (
            <p className={styles.recordBanner}>
              🏆 최고 기록 갱신! <s>{formatTime(game.prevBestMs!)}</s> → <b>{formatTime(game.elapsedMs)}</b>
            </p>
          )}
          {firstClear && <p className={styles.recordBanner}>🎉 첫 기록이에요!</p>}
          {!firstClear && !newRecord && medalUp && <p className={styles.recordBanner}>✨ 새 메달을 받았어요!</p>}
          {!firstClear && !newRecord && !medalUp && game.rank && game.rank <= 3 && (
            <p className={styles.recordBanner}>👏 내 기록 {game.rank}등!</p>
          )}
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
          {next && (
            <p className={styles.nextGoal}>
              다음 목표: {MEDAL_ICON[next.medal]} <b>{formatTime(next.limitMs)}</b> 안에 풀기!
            </p>
          )}
          <div className={styles.winActions}>
            <Button size="lg" onClick={() => newGame(game.difficulty, size)}>한 판 더!</Button>
            <Button variant="secondary" onClick={onPickDifficulty}>난이도 바꾸기</Button>
            <Link to="records" className={styles.winLink}>🏆 기록 보기</Link>
            <Button variant="ghost" onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
