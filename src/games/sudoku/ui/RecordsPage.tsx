import { useState } from 'react';
import { useNavigate } from 'react-router';
import { formatTime } from '@/shared/format';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import type { BoardSize, Difficulty } from '../engine';
import { MEDAL_ICON, MEDAL_LABEL, MEDALS, medalFor, nextMedalAfter, type Medal } from '../records';
import { hasProgress, recordKey, useSudoku, type SudokuRun } from '../store';
import { DIFFICULTIES, DIFFICULTY_LABEL, DIFFICULTY_STARS, SIZES, modeLabel } from './labels';
import styles from './Records.module.css';

const SHOWN_RUNS = 5;

function when(at: number) {
  if (!at) return '';
  const d = new Date(at);
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** 모든 크기·난이도의 최고 메달 수집 현황 */
function MedalShelf() {
  const records = useSudoku((s) => s.records);
  const counts = Object.fromEntries(MEDALS.map((m) => [m, 0])) as Record<Medal, number>;
  for (const size of SIZES) {
    for (const d of DIFFICULTIES) {
      const m = medalFor(size, d, records[recordKey(size, d)]?.bestMs);
      if (m) counts[m]++;
    }
  }
  const total = SIZES.length * DIFFICULTIES.length;
  const diamonds = counts.diamond;
  return (
    <section className={styles.shelf} aria-label="모은 메달">
      <div className={styles.shelfTitle}>
        <h2>🏆 내 메달</h2>
        <span>
          💎 다이아 <b>{diamonds}</b> / {total}
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

function RunList({ runs }: { runs: SudokuRun[]; size: BoardSize; difficulty: Difficulty }) {
  return (
    <ol className={styles.runs}>
      {runs.slice(0, SHOWN_RUNS).map((r, i) => (
        <li key={`${r.at}-${r.ms}-${i}`} className={i === 0 ? styles.runTop : undefined}>
          <span className={styles.rank}>{i + 1}</span>
          <b className={styles.runTime}>{formatTime(r.ms)}</b>
          <span className={styles.runMeta}>
            {r.hints > 0 && `💡${r.hints} `}
            {when(r.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function DifficultyRecord({ size, difficulty, onPlay }: { size: BoardSize; difficulty: Difficulty; onPlay: () => void }) {
  const rec = useSudoku((s) => s.records[recordKey(size, difficulty)]);
  const best = rec?.bestMs;
  const medal = medalFor(size, difficulty, best);
  const next = nextMedalAfter(size, difficulty, best);
  // 다음 메달까지 얼마나 왔는지 (기준시간 / 내 최고) — 1이면 도달
  const progress = best !== undefined && next ? Math.min(1, next.limitMs / best) : 0;

  return (
    <article className={[styles.card, styles[`d_${difficulty}`]].join(' ')}>
      <header className={styles.cardHead}>
        <span className={styles.stars}>
          {[1, 2, 3].map((k) => (
            <StarIcon key={k} filled={k <= DIFFICULTY_STARS[difficulty]} width={20} height={20} />
          ))}
        </span>
        <h3>{DIFFICULTY_LABEL[difficulty]}</h3>
        <span className={styles.wins}>{rec?.wins ? `${rec.wins}번 성공` : ''}</span>
      </header>

      {best === undefined ? (
        <div className={styles.empty}>
          <p>아직 기록이 없어요</p>
          <button className={styles.play} onClick={onPlay}>
            첫 기록 만들기 ▶
          </button>
        </div>
      ) : (
        <>
          <div className={styles.best}>
            <span className={styles.bestMedal} aria-label={medal ? `${MEDAL_LABEL[medal]} 메달` : '메달 없음'}>
              {medal ? MEDAL_ICON[medal] : '🎖️'}
            </span>
            <div>
              <small>내 최고 기록</small>
              <b>{formatTime(best)}</b>
            </div>
            <button className={styles.play} onClick={onPlay} aria-label={`${DIFFICULTY_LABEL[difficulty]} 다시 도전`}>
              도전 ▶
            </button>
          </div>
          {next ? (
            <div className={styles.goal}>
              <p>
                {MEDAL_ICON[next.medal]} {MEDAL_LABEL[next.medal]} 메달까지 <b>{formatTime(best - next.limitMs)}</b> 더 빨리!
              </p>
              <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          ) : (
            <p className={styles.goalDone}>💎 최고 메달 달성! 이제 내 기록을 깨 봐!</p>
          )}
          {rec?.runs && rec.runs.length > 0 && <RunList runs={rec.runs} size={size} difficulty={difficulty} />}
        </>
      )}
    </article>
  );
}

export function RecordsPage() {
  const size = useSudoku((s) => s.size);
  const setSize = useSudoku((s) => s.setSize);
  const game = useSudoku((s) => s.game);
  const newGame = useSudoku((s) => s.newGame);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Difficulty | null>(null);

  const play = (d: Difficulty) => {
    newGame(d, size);
    // 새 판은 메뉴를 거치지 않고 바로 "시작하기" 화면으로
    useSudoku.setState({ menuOnReturn: false });
    navigate('..');
  };

  return (
    <div className={styles.page}>
      <MedalShelf />

      <div className={styles.tabs} role="tablist" aria-label="보드 크기">
        {SIZES.map((n) => (
          <button key={n} role="tab" aria-selected={size === n} className={size === n ? styles.tabOn : undefined} onClick={() => setSize(n)}>
            {modeLabel(n)} 블록
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {DIFFICULTIES.map((d) => (
          <DifficultyRecord key={`${size}-${d}`} size={size} difficulty={d} onPlay={() => (hasProgress(game) ? setConfirm(d) : play(d))} />
        ))}
      </div>

      <p className={styles.legend}>
        {MEDALS.map((m) => `${MEDAL_ICON[m]} ${MEDAL_LABEL[m]}`).join(' · ')} — 빨리 풀수록 좋은 메달!
      </p>

      <ConfirmDialog
        open={confirm !== null}
        title="새 게임을 시작할까?"
        message={game ? `하던 ${modeLabel(game.spec.size)} 블록 ${DIFFICULTY_LABEL[game.difficulty]} 게임은 취소돼요.` : undefined}
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
