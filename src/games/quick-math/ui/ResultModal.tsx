import { Link, useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS } from '@/shared/game/medals';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { Modal } from '@/shared/ui/Modal';
import { medalFor, nextMedalFor } from '../records';
import { recordKey, SPRINT_COUNT, useQuickMath } from '../store';
import { setupTitle } from './labels';
import styles from './QuickMath.module.css';

export function ResultModal({ onMenu }: { onMenu: () => void }) {
  const session = useQuickMath((s) => s.session)!;
  const best = useQuickMath((s) => s.records[recordKey(session)]?.best);
  const newGame = useQuickMath((s) => s.newGame);
  const { playerName, mode } = useSettings();
  const navigate = useNavigate();

  const sprint = session.mode === 'sprint';
  const value = sprint ? session.elapsedMs : session.correct;
  const show = (v: number) => (sprint ? formatTime(v) : `${v}개`);
  const medal = medalFor(session, value);
  const prevMedal = medalFor(session, session.prevBest);
  const first = session.prevBest === undefined;
  // 화면에 보이는 단위로 좋아졌을 때만 갱신 축하
  const improved = !first && (sprint ? Math.floor(value / 1000) < Math.floor(session.prevBest! / 1000) : value > session.prevBest!);
  const medalUp = !!medal && (!prevMedal || MEDALS.indexOf(medal) < MEDALS.indexOf(prevMedal));
  const next = nextMedalFor(session, best);

  return (
    <>
      {medal && <Confetti />}
      <Modal open labelledBy="result-title">
        <div className={styles.result}>
          <div className={styles.resultMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '완주'}>{medal ? MEDAL_ICON[medal] : '🎖️'}</div>
          <h2 id="result-title">{sprint ? `${callName(playerName)}, 다 풀었어!` : `${callName(playerName)}, 시간 끝!`}</h2>
          <p className={styles.resultSub}>
            {setupTitle(session)}
            {medal && <> · <b className={styles[`pace_${medal}`]}>{MEDAL_LABEL[medal]} 메달</b></>}
          </p>
          {improved && (
            <p className={styles.recordBanner}>
              🏆 최고 기록 갱신! <s>{show(session.prevBest!)}</s> → <b>{show(value)}</b>
            </p>
          )}
          {first && <p className={styles.recordBanner}>🎉 첫 기록이에요!</p>}
          {!first && !improved && medalUp && <p className={styles.recordBanner}>✨ 새 메달을 받았어요!</p>}
          {!first && !improved && !medalUp && session.rank && session.rank <= 3 && <p className={styles.recordBanner}>👏 내 기록 {session.rank}등!</p>}
          <dl className={styles.resultStats}>
            <div><dt>{sprint ? '걸린 시간' : '맞힌 문제'}</dt><dd>{show(value)}</dd></div>
            <div><dt>최고 기록</dt><dd>{best !== undefined ? show(best) : '-'}</dd></div>
            <div><dt>{sprint ? '바로 맞힘' : '최고 연속'}</dt><dd>{sprint ? `${session.correct}/${SPRINT_COUNT}` : `${session.maxCombo}연속`}</dd></div>
            {mode === 'challenge' && <div><dt>실수</dt><dd>{session.mistakes}</dd></div>}
          </dl>
          {next && (
            <p className={styles.nextGoal}>
              다음 목표: {MEDAL_ICON[next.medal]} <b>{sprint ? `${formatTime(next.limit)} 안에` : `${next.limit}개 이상`}</b>!
            </p>
          )}
          <div className={styles.resultActions}>
            <Button size="lg" onClick={() => newGame(session)}>한 판 더!</Button>
            <Button variant="secondary" onClick={onMenu}>계산 바꾸기</Button>
            <Link to="records" className={styles.recordsBtn}>🏆 기록 보기</Link>
            <Button variant="ghost" onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
