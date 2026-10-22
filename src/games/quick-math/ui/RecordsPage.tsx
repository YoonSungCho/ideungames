import { useState } from 'react';
import { useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS, type Medal } from '@/shared/game/medals';
import { whenLabel } from '@/shared/game/records';
import styles from '@/shared/game/Records.module.css';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import type { Difficulty } from '../engine';
import { medalFor, nextMedalFor } from '../records';
import { hasProgress, recordKey, useQuickMath, type GameMode } from '../store';
import { DIFFICULTIES, DIFFICULTY_LABEL, DIFFICULTY_STARS, MODE_LABEL, opsLabel, dansLabel, setupTitle } from './labels';
import local from './QuickMath.module.css';

const SHOWN_RUNS = 5;
const MODES: GameMode[] = ['sprint', 'blitz'];

/** 모든 조합의 최고 메달 수집 현황 */
function MedalShelf() {
  const records = useQuickMath((s) => s.records);
  const counts = Object.fromEntries(MEDALS.map((m) => [m, 0])) as Record<Medal, number>;
  for (const [key, book] of Object.entries(records)) {
    const [mode, , , difficulty] = key.split(':') as [GameMode, string, string, Difficulty];
    const m = medalFor({ mode, difficulty }, book.best);
    if (m) counts[m]++;
  }
  return (
    <section className={styles.shelf} aria-label="모은 메달">
      <div className={styles.shelfTitle}>
        <h2>🏆 내 메달</h2>
        <span>
          도전한 계산 <b>{Object.keys(records).length}</b>가지
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

function DifficultyRecord({ mode, difficulty, onPlay }: { mode: GameMode; difficulty: Difficulty; onPlay: () => void }) {
  const setup = useQuickMath((s) => s.setup);
  const book = useQuickMath((s) => s.records[recordKey({ ...setup, mode, difficulty })]);
  const sprint = mode === 'sprint';
  const show = (v: number) => (sprint ? formatTime(v) : `${v}개`);
  const best = book?.best;
  const medal = medalFor({ mode, difficulty }, best);
  const next = nextMedalFor({ mode, difficulty }, best);
  const progress = best !== undefined && next ? Math.min(1, sprint ? next.limit / best : best / next.limit) : 0;

  return (
    <article className={[styles.card, styles[`d_${difficulty}`]].join(' ')}>
      <header className={styles.cardHead}>
        <span className={styles.stars}>
          {[1, 2, 3].map((k) => (
            <StarIcon key={k} filled={k <= DIFFICULTY_STARS[difficulty]} width={20} height={20} />
          ))}
        </span>
        <h3>{DIFFICULTY_LABEL[difficulty]}</h3>
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
              <b>{show(best)}</b>
            </div>
            <button className={styles.play} onClick={onPlay} aria-label={`${DIFFICULTY_LABEL[difficulty]} 다시 도전`}>도전 ▶</button>
          </div>
          {next ? (
            <div className={styles.goal}>
              <p>
                {MEDAL_ICON[next.medal]} {MEDAL_LABEL[next.medal]} 메달까지{' '}
                <b>{sprint ? `${formatTime(best - next.limit)} 더 빨리` : `${next.limit - best}개 더`}</b>!
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
                <b className={styles.runTime}>{show(r.value)}</b>
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
  const setup = useQuickMath((s) => s.setup);
  const setSetup = useQuickMath((s) => s.setSetup);
  const session = useQuickMath((s) => s.session);
  const newGame = useQuickMath((s) => s.newGame);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Difficulty | null>(null);

  const play = (difficulty: Difficulty) => {
    newGame({ difficulty });
    useQuickMath.setState({ menuOnReturn: false });
    navigate('..');
  };

  return (
    <div className={styles.page}>
      <MedalShelf />
      <div className={styles.tabs} role="tablist" aria-label="게임 방식">
        {MODES.map((m) => (
          <button key={m} role="tab" aria-selected={setup.mode === m} className={setup.mode === m ? styles.tabOn : undefined} onClick={() => setSetup({ mode: m })}>
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <p className={local.recordsFor}>
        <b>{opsLabel(setup.ops)}</b> {dansLabel(setup.dans)} 기록 <small>(메뉴에서 고른 계산 기준)</small>
      </p>
      <div className={styles.grid}>
        {DIFFICULTIES.map((d) => (
          <DifficultyRecord key={`${setup.mode}-${d}`} mode={setup.mode} difficulty={d} onPlay={() => (hasProgress(session) ? setConfirm(d) : play(d))} />
        ))}
      </div>
      <p className={styles.legend}>{MEDALS.map((m) => `${MEDAL_ICON[m]} ${MEDAL_LABEL[m]}`).join(' · ')} — 빠르고 많이 맞힐수록 좋은 메달!</p>
      <ConfirmDialog
        open={confirm !== null}
        title="새 게임을 시작할까?"
        message={session ? `하던 ${setupTitle(session)} 게임은 취소돼요.` : undefined}
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
