import { Link, useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS } from '@/shared/game/medals';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { Modal } from '@/shared/ui/Modal';
import { pairCount } from '../engine/deck';
import { medalFor, nextMedalFor } from '../records';
import { recordKey, useMemoryCards } from '../store';
import { setupTitle } from './labels';
import styles from './Memory.module.css';

export function ResultModal({ onMenu }: { onMenu: () => void }) {
  const session = useMemoryCards((s) => s.session)!;
  const best = useMemoryCards((s) => s.records[recordKey(session)]?.best);
  const newGame = useMemoryCards((s) => s.newGame);
  const { playerName, mode } = useSettings();
  const navigate = useNavigate();

  const value = session.elapsedMs;
  const medal = medalFor(session, value);
  const prevMedal = medalFor(session, session.prevBest);
  const first = session.prevBest === undefined;
  const improved = !first && Math.floor(value / 1000) < Math.floor(session.prevBest! / 1000);
  const medalUp = !!medal && (!prevMedal || MEDALS.indexOf(medal) < MEDALS.indexOf(prevMedal));
  const next = nextMedalFor(session, best);
  const perfect = session.misses === 0;

  return (
    <>
      <Confetti />
      <Modal open labelledBy="result-title">
        <div className={styles.result}>
          <div className={styles.resultMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '완주'}>{medal ? MEDAL_ICON[medal] : '🎖️'}</div>
          <h2 id="result-title">{callName(playerName)}, 짝꿍을 다 찾았어!</h2>
          <p className={styles.resultSub}>
            {setupTitle(session)}
            {medal && <> · <b className={styles[`pace_${medal}`]}>{MEDAL_LABEL[medal]} 메달</b></>}
          </p>
          {improved && (
            <p className={styles.recordBanner}>
              🏆 최고 기록 갱신! <s>{formatTime(session.prevBest!)}</s> → <b>{formatTime(value)}</b>
            </p>
          )}
          {first && <p className={styles.recordBanner}>🎉 첫 기록이에요!</p>}
          {!first && !improved && medalUp && <p className={styles.recordBanner}>✨ 새 메달을 받았어요!</p>}
          {!first && !improved && !medalUp && perfect && <p className={styles.recordBanner}>🧠 한 번도 안 틀렸어!</p>}
          {!first && !improved && !medalUp && !perfect && session.rank && session.rank <= 3 && <p className={styles.recordBanner}>👏 내 기록 {session.rank}등!</p>}
          <dl className={styles.resultStats}>
            <div><dt>걸린 시간</dt><dd>{formatTime(value)}</dd></div>
            <div><dt>최고 기록</dt><dd>{best !== undefined ? formatTime(best) : '-'}</dd></div>
            <div><dt>뒤집은 횟수</dt><dd>{session.moves}번</dd></div>
            <div><dt>최고 연속</dt><dd>{session.maxCombo}/{pairCount(session)}</dd></div>
            {mode === 'challenge' && <div><dt>틀린 짝</dt><dd>{session.misses}</dd></div>}
          </dl>
          {next && (
            <p className={styles.nextGoal}>
              다음 목표: {MEDAL_ICON[next.medal]} <b>{formatTime(next.limit)} 안에</b>!
            </p>
          )}
          <div className={styles.resultActions}>
            <Button size="lg" onClick={() => newGame(session)}>한 판 더!</Button>
            <Button variant="secondary" onClick={onMenu}>카드 바꾸기</Button>
            <Link to="records" className={styles.recordsBtn}>🏆 기록 보기</Link>
            <Button variant="ghost" onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
