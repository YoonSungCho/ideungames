import { Link, useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS } from '@/shared/game/medals';
import { callName, josa } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { Modal } from '@/shared/ui/Modal';
import { distances, STAR_COUNT } from '../engine/maze';
import { medalFor, nextMedalFor } from '../records';
import { hero, recordKey, useMazeEscape } from '../store';
import { setupTitle } from './labels';
import styles from './Maze.module.css';

export function ResultModal({ onMenu }: { onMenu: () => void }) {
  const session = useMazeEscape((s) => s.session)!;
  const best = useMazeEscape((s) => s.records[recordKey(session)]?.best);
  const newGame = useMazeEscape((s) => s.newGame);
  const { playerName } = useSettings();
  const navigate = useNavigate();
  const h = hero(session.hero);

  const value = session.elapsedMs;
  const medal = medalFor(session.level, value);
  const prevMedal = medalFor(session.level, session.prevBest);
  const first = session.prevBest === undefined;
  const improved = !first && Math.floor(value / 1000) < Math.floor(session.prevBest! / 1000);
  const medalUp = !!medal && (!prevMedal || MEDALS.indexOf(medal) < MEDALS.indexOf(prevMedal));
  const next = nextMedalFor(session.level, best);
  const allStars = session.got.length === STAR_COUNT;
  const shortest = distances(session.maze, session.maze.start)[session.maze.goal];

  return (
    <>
      <Confetti />
      <Modal open labelledBy="result-title">
        <div className={styles.result}>
          <div className={styles.resultMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '탈출'}>{medal ? MEDAL_ICON[medal] : h.goal}</div>
          <h2 id="result-title">{callName(playerName)}, 탈출 성공!</h2>
          <p className={styles.resultSub}>
            {h.icon} {josa(h.name, '이/가')} {josa(h.goalName, '을/를')} 먹었어요 · {setupTitle(session).replace(`${h.icon} `, '')}
            {medal && <> · <b className={styles[`pace_${medal}`]}>{MEDAL_LABEL[medal]} 메달</b></>}
          </p>
          <p className={styles.resultStars} aria-label={`별 ${session.got.length}개`}>
            {Array.from({ length: STAR_COUNT }, (_, k) => (
              <span key={k} className={k < session.got.length ? styles.starOn : styles.starOff}>⭐</span>
            ))}
          </p>
          {improved && (
            <p className={styles.recordBanner}>
              🏆 최고 기록 갱신! <s>{formatTime(session.prevBest!)}</s> → <b>{formatTime(value)}</b>
            </p>
          )}
          {first && <p className={styles.recordBanner}>🎉 첫 기록이에요!</p>}
          {!first && !improved && medalUp && <p className={styles.recordBanner}>✨ 새 메달을 받았어요!</p>}
          {!first && !improved && !medalUp && allStars && <p className={styles.recordBanner}>⭐ 별을 다 모았어!</p>}
          <dl className={styles.resultStats}>
            <div><dt>걸린 시간</dt><dd>{formatTime(value)}</dd></div>
            <div><dt>최고 기록</dt><dd>{best !== undefined ? formatTime(best) : '-'}</dd></div>
            <div><dt>걸음</dt><dd>{session.steps}걸음</dd></div>
            <div><dt>지름길</dt><dd>{shortest}걸음</dd></div>
          </dl>
          {next && (
            <p className={styles.nextGoal}>
              다음 목표: {MEDAL_ICON[next.medal]} <b>{formatTime(next.limit)} 안에</b>!
            </p>
          )}
          <div className={styles.resultActions}>
            <Button size="lg" onClick={() => newGame(session)}>새 미로!</Button>
            <Button variant="secondary" onClick={onMenu}>크기 바꾸기</Button>
            <Link to="records" className={styles.recordsBtn}>🏆 기록 보기</Link>
            <Button variant="ghost" onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
