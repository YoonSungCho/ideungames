import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS, type Medal } from '@/shared/game/medals';
import { whenLabel } from '@/shared/game/records';
import styles from '@/shared/game/Records.module.css';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { LEVELS, PAIRS, type Level, type Rule } from '../engine/deck';
import { medalFor, nextMedalFor } from '../records';
import { hasProgress, recordKey, useMemoryCards } from '../store';
import { LEVEL_COLOR, LEVEL_LABEL, LEVEL_STARS, RULE_LABEL, setupTitle } from './labels';

const SHOWN_RUNS = 5;
const RULES: Rule[] = ['same', 'word'];

function MedalShelf() {
  const records = useMemoryCards((s) => s.records);
  const counts = Object.fromEntries(MEDALS.map((m) => [m, 0])) as Record<Medal, number>;
  for (const [key, book] of Object.entries(records)) {
    const [level, rule] = key.split(':') as [Level, Rule];
    const m = medalFor({ level, rule }, book.best);
    if (m) counts[m]++;
  }
  return (
    <section className={styles.shelf} aria-label="모은 메달">
      <div className={styles.shelfTitle}>
        <h2>🏆 내 메달</h2>
        <span>
          모두 <b>{LEVELS.length * RULES.length}</b>가지 중 다이아 <b>{counts.diamond}</b>
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

function LevelRecord({ level, rule, onPlay }: { level: Level; rule: Rule; onPlay: () => void }) {
  const book = useMemoryCards((s) => s.records[recordKey({ level, rule })]);
  const best = book?.best;
  const medal = medalFor({ level, rule }, best);
  const next = nextMedalFor({ level, rule }, best);
  const progress = best !== undefined && next ? Math.min(1, next.limit / best) : 0;

  return (
    <article className={styles.card} style={{ '--d': LEVEL_COLOR[level] } as CSSProperties}>
      <header className={styles.cardHead}>
        <span className={styles.stars}>
          {[1, 2, 3, 4].map((k) => (
            <StarIcon key={k} filled={k <= LEVEL_STARS[level]} width={18} height={18} />
          ))}
        </span>
        <h3>{LEVEL_LABEL[level]} · {PAIRS[level]}쌍</h3>
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
              <b>{formatTime(best)}</b>
            </div>
            <button className={styles.play} onClick={onPlay} aria-label={`${LEVEL_LABEL[level]} 다시 도전`}>도전 ▶</button>
          </div>
          {next ? (
            <div className={styles.goal}>
              <p>
                {MEDAL_ICON[next.medal]} {MEDAL_LABEL[next.medal]} 메달까지 <b>{formatTime(best - next.limit)} 더 빨리</b>!
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
                <b className={styles.runTime}>{formatTime(r.value)}</b>
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
  const setup = useMemoryCards((s) => s.setup);
  const setSetup = useMemoryCards((s) => s.setSetup);
  const session = useMemoryCards((s) => s.session);
  const newGame = useMemoryCards((s) => s.newGame);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Level | null>(null);

  const play = (level: Level) => {
    newGame({ level });
    useMemoryCards.setState({ menuOnReturn: false });
    navigate('/games/memory-cards');
  };

  return (
    <div className={styles.page}>
      <MedalShelf />
      <div className={styles.tabs} role="tablist" aria-label="짝 규칙">
        {RULES.map((r) => (
          <button key={r} role="tab" aria-selected={setup.rule === r} className={setup.rule === r ? styles.tabOn : undefined} onClick={() => setSetup({ rule: r })}>
            {RULE_LABEL[r]}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {LEVELS.map((l) => (
          <LevelRecord key={`${setup.rule}-${l}`} level={l} rule={setup.rule} onPlay={() => (hasProgress(session) ? setConfirm(l) : play(l))} />
        ))}
      </div>
      <p className={styles.legend}>{MEDALS.map((m) => `${MEDAL_ICON[m]} ${MEDAL_LABEL[m]}`).join(' · ')} — 빨리 찾을수록 좋은 메달!</p>
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
