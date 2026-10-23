import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS, type Medal } from '@/shared/game/medals';
import { whenLabel } from '@/shared/game/records';
import styles from '@/shared/game/Records.module.css';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { SPEEDS, type Speed } from '../engine/game';
import { MODES, type Mode } from '../engine/questions';
import { medalFor, nextMedalFor } from '../records';
import { hasProgress, recordKey, useNumberRain } from '../store';
import { MODE_INFO, setupTitle, SPEED_INFO } from './labels';
import local from './NumberRain.module.css';

const SHOWN_RUNS = 5;
const COLOR: Record<Speed, string> = { slow: 'd_easy', normal: 'd_medium', fast: 'd_hard' };

function MedalShelf() {
  const records = useNumberRain((s) => s.records);
  const counts = Object.fromEntries(MEDALS.map((m) => [m, 0])) as Record<Medal, number>;
  for (const [key, book] of Object.entries(records)) {
    const [mode, speed] = key.split(':') as [Mode, Speed];
    const m = medalFor(mode, speed, book.best);
    if (m) counts[m]++;
  }
  return (
    <section className={styles.shelf} aria-label="모은 메달">
      <div className={styles.shelfTitle}>
        <h2>🏆 내 메달</h2>
        <span>
          도전한 비 <b>{Object.keys(records).length}</b>가지
        </span>
      </div>
      <div className={styles.shelfRow}>
        {MEDALS.map((m) => (
          <div key={m} className={[styles.shelfItem, counts[m] === 0 && styles.shelfEmpty].filter(Boolean).join(' ')}>
            <span className={styles.shelfIcon}>{MEDAL_ICON[m]}</span>
            <b>{counts[m]}</b>
            <small>{MEDAL_LABEL[m]}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function SpeedRecord({ mode, speed, onPlay }: { mode: Mode; speed: Speed; onPlay: () => void }) {
  const book = useNumberRain((s) => s.records[recordKey({ mode, speed })]);
  const info = SPEED_INFO[speed];
  const best = book?.best;
  const medal = medalFor(mode, speed, best);
  const next = nextMedalFor(mode, speed, best);
  const progress = best !== undefined && next ? Math.min(1, best / next.limit) : 0;

  return (
    <article className={[styles.card, styles[COLOR[speed]]].join(' ')}>
      <header className={styles.cardHead}>
        <span className={styles.stars}>
          {[1, 2, 3].map((k) => <StarIcon key={k} filled={k <= info.stars} width={20} height={20} />)}
        </span>
        <h3>{info.emoji} {info.name}</h3>
        <span className={styles.wins}>{book?.plays ? `${book.plays}번 도전` : ''}</span>
      </header>
      {best === undefined ? (
        <div className={styles.empty}>
          <p>아직 기록이 없어요</p>
          <button className={styles.play} onClick={onPlay}>첫 기록 만들기 ▶</button>
        </div>
      ) : (
        <>
          <div className={styles.best}>
            <span className={styles.bestMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '메달 없음'}>{medal ? MEDAL_ICON[medal] : '🎖️'}</span>
            <div>
              <small>내 최고 기록</small>
              <b>{best}점</b>
            </div>
            <button className={styles.play} onClick={onPlay} aria-label={`${info.name} 다시 도전`}>도전 ▶</button>
          </div>
          {next ? (
            <div className={styles.goal}>
              <p>
                {MEDAL_ICON[next.medal]} {MEDAL_LABEL[next.medal]} 메달까지 <b>{next.limit - best}점 더</b>!
              </p>
              <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          ) : (
            <p className={styles.goalDone}>💎 최고 메달 달성! 이제 내 기록을 깨 봐!</p>
          )}
          <ol className={styles.runs}>
            {book!.runs.slice(0, SHOWN_RUNS).map((r, i) => (
              <li key={`${r.at}-${r.value}-${i}`} className={i === 0 ? styles.runTop : undefined}>
                <span className={styles.rank}>{i + 1}</span>
                <b className={styles.runTime}>{r.value}점</b>
                <span className={styles.runMeta}>{whenLabel(r.at)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </article>
  );
}

export function RecordsPage() {
  const setup = useNumberRain((s) => s.setup);
  const setSetup = useNumberRain((s) => s.setSetup);
  const game = useNumberRain((s) => s.game);
  const newGame = useNumberRain((s) => s.newGame);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Speed | null>(null);

  const play = (speed: Speed) => {
    newGame({ speed });
    useNumberRain.setState({ menuOnReturn: false });
    navigate('/games/number-rain');
  };

  return (
    <div className={styles.page}>
      <MedalShelf />
      <div className={local.recordModes} role="radiogroup" aria-label="모드">
        {MODES.map((m) => (
          <button key={m} role="radio" aria-checked={setup.mode === m} className={setup.mode === m ? local.on : undefined} onClick={() => setSetup({ mode: m })}>
            {MODE_INFO[m].emoji} {MODE_INFO[m].name}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {SPEEDS.map((sp) => (
          <SpeedRecord key={`${setup.mode}-${sp}`} mode={setup.mode} speed={sp} onPlay={() => (hasProgress(game) ? setConfirm(sp) : play(sp))} />
        ))}
      </div>
      <p className={styles.legend}>{MEDALS.map((m) => `${MEDAL_ICON[m]} ${MEDAL_LABEL[m]}`).join(' · ')} — 많이 터뜨릴수록 좋은 메달!</p>
      <ConfirmDialog
        open={confirm !== null}
        title="새 게임을 시작할까?"
        message={game ? `하던 ${setupTitle(game)} 게임은 취소돼요.` : undefined}
        cancelLabel="그냥 기록 볼래"
        confirmLabel="취소하고 새로 시작"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          play(confirm!);
          setConfirm(null);
        }}
      />
    </div>
  );
}
