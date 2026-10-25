import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON } from '@/shared/game/medals';
import { josa } from '@/shared/korean';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import { medalFor } from '../records';
import { hasProgress, hero, HEROES, LEVELS, recordKey, useMazeEscape, type Level } from '../store';
import { LEVEL_COLOR, LEVEL_LABEL, LEVEL_STARS, setupTitle, sizeLabel } from './labels';
import styles from './Maze.module.css';

/** 메뉴: 누구로 갈까 · 미로 크기 → 고르면 "시작하기" 화면으로 */
export function Menu({ onStart, onResume }: { onStart: () => void; onResume?: () => void }) {
  const setup = useMazeEscape((s) => s.setup);
  const setSetup = useMazeEscape((s) => s.setSetup);
  const newGame = useMazeEscape((s) => s.newGame);
  const records = useMazeEscape((s) => s.records);
  const session = useMazeEscape((s) => s.session);
  const [confirm, setConfirm] = useState<Level | null>(null);
  const h = hero(setup.hero);

  const begin = (level: Level) => {
    newGame({ level });
    onStart();
  };

  return (
    <div className={styles.menu}>
      <div className={styles.menuIntro}>
        <Robot mood="happy" size={88} />
        <p className={styles.bubbleLarge}>
          {h.icon} {josa(h.name, '이/가')} 배고프대!
          <br />
          미로를 지나 <b>{h.goal} {h.goalName}</b>까지 데려다줘. ⭐ 별도 모아 봐!
        </p>
      </div>

      {onResume && session && (
        <Button size="lg" onClick={onResume} className={styles.resume}>
          ▶ 하던 미로 이어하기 <small>({setupTitle(session)})</small>
        </Button>
      )}

      <section className={styles.menuSection}>
        <h2 className={styles.menuLabel}>누구랑 갈까?</h2>
        <div className={styles.heroes} role="radiogroup" aria-label="친구 고르기">
          {HEROES.map((x) => (
            <button
              key={x.id}
              role="radio"
              aria-checked={setup.hero === x.id}
              aria-label={x.name}
              className={[styles.heroChip, setup.hero === x.id && styles.on].filter(Boolean).join(' ')}
              onClick={() => setSetup({ hero: x.id })}
            >
              <span className={styles.heroIcon}>{x.icon}</span>
              <span className={styles.heroGoal}>→ {x.goal}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.diffList}>
        {LEVELS.map((level) => {
          const rec = records[recordKey({ level })];
          const medal = medalFor(level, rec?.best);
          return (
            <button
              key={level}
              className={styles.diffCard}
              style={{ '--d': LEVEL_COLOR[level] } as CSSProperties}
              onClick={() => (hasProgress(session) ? setConfirm(level) : begin(level))}
              aria-label={`${LEVEL_LABEL[level]} ${sizeLabel(level)}`}
            >
              <span className={styles.diffStars}>
                {[1, 2, 3, 4].map((k) => (
                  <StarIcon key={k} filled={k <= LEVEL_STARS[level]} width={18} height={18} />
                ))}
              </span>
              <span className={styles.diffName}>
                {LEVEL_LABEL[level]} <small>{sizeLabel(level)}</small>
              </span>
              <span className={styles.diffMeta}>{rec?.best !== undefined ? `🏆 ${formatTime(rec.best)} · ${rec.plays}번` : '아직 기록 없음'}</span>
              {medal && <span className={styles.diffMedal} aria-label="받은 메달">{MEDAL_ICON[medal]}</span>}
            </button>
          );
        })}
      </div>

      <Link to="records" className={styles.recordsLink}>
        🏆 내 기록 · 메달 보기
      </Link>

      <ConfirmDialog
        open={confirm !== null}
        title="새 미로를 시작할까?"
        message={session ? `하던 ${setupTitle(session)} 미로는 취소돼요.` : undefined}
        cancelLabel="하던 미로 이어하기"
        confirmLabel="취소하고 새로 시작"
        onCancel={() => {
          setConfirm(null);
          onResume?.();
        }}
        onConfirm={() => {
          begin(confirm!);
          setConfirm(null);
        }}
      />
    </div>
  );
}
