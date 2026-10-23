import { Link, useNavigate } from 'react-router';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS } from '@/shared/game/medals';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { Modal } from '@/shared/ui/Modal';
import { medalFor, nextMedalFor } from '../records';
import { recordKey, useNumberRain } from '../store';
import { setupTitle } from './labels';
import styles from './NumberRain.module.css';

/** 목숨을 다 쓰면: 점수 · 메달 · 기록 */
export function ResultModal({ onMenu }: { onMenu: () => void }) {
  const game = useNumberRain((s) => s.game)!;
  const best = useNumberRain((s) => s.records[recordKey(game)]?.best);
  const newGame = useNumberRain((s) => s.newGame);
  const { playerName, mode } = useSettings();
  const navigate = useNavigate();

  const medal = medalFor(game.mode, game.speed, game.score);
  const prevMedal = medalFor(game.mode, game.speed, game.prevBest);
  const first = game.prevBest === undefined;
  const improved = !first && game.score > game.prevBest!;
  const medalUp = !!medal && (!prevMedal || MEDALS.indexOf(medal) < MEDALS.indexOf(prevMedal));
  const next = nextMedalFor(game.mode, game.speed, best);

  return (
    <>
      {medal && <Confetti />}
      <Modal open labelledBy="rain-result-title">
        <div className={styles.result}>
          <div className={styles.resultMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '완주'}>{medal ? MEDAL_ICON[medal] : '☔'}</div>
          <h2 id="rain-result-title">{callName(playerName)}, {game.score}점이야!</h2>
          <p className={styles.resultSub}>
            {setupTitle(game)}
            {medal && <> · <b className={styles[`pace_${medal}`]}>{MEDAL_LABEL[medal]} 메달</b></>}
          </p>
          {improved && (
            <p className={styles.recordBanner}>
              🏆 최고 기록 갱신! <s>{game.prevBest}점</s> → <b>{game.score}점</b>
            </p>
          )}
          {first && <p className={styles.recordBanner}>🎉 첫 기록이에요!</p>}
          {!first && !improved && medalUp && <p className={styles.recordBanner}>✨ 새 메달을 받았어요!</p>}
          {!first && !improved && !medalUp && game.rank && game.rank <= 3 && <p className={styles.recordBanner}>👏 내 기록 {game.rank}등!</p>}
          <dl className={styles.resultStats}>
            <div><dt>점수</dt><dd>{game.score}점</dd></div>
            <div><dt>최고 기록</dt><dd>{best !== undefined ? `${best}점` : '-'}</dd></div>
            <div><dt>최고 연속</dt><dd>{game.maxCombo}연속</dd></div>
            <div><dt>오른 단계</dt><dd>🚀 {game.level}</dd></div>
            {game.bombs > 0 && <div><dt>터뜨린 폭탄</dt><dd>💣 {game.bombs}</dd></div>}
            {mode === 'challenge' && <div><dt>실수</dt><dd>{game.mistakes}</dd></div>}
          </dl>
          {next && (
            <p className={styles.nextGoal}>
              다음 목표: {MEDAL_ICON[next.medal]} <b>{next.limit}점 이상</b>!
            </p>
          )}
          <div className={styles.resultActions}>
            <Button size="lg" onClick={() => newGame(game)}>한 판 더!</Button>
            <Button variant="secondary" onClick={onMenu}>모드 바꾸기</Button>
            <Link to="records" className={styles.recordsBtn}>🏆 기록 보기</Link>
            <Button variant="ghost" onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
