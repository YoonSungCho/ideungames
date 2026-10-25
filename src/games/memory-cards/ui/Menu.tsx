import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON } from '@/shared/game/medals';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import { LEVELS, PAIRS, THEMES, type Level, type Rule } from '../engine/deck';
import { medalFor } from '../records';
import { hasProgress, recordKey, useMemoryCards } from '../store';
import { LEVEL_COLOR, LEVEL_LABEL, LEVEL_STARS, RULE_ICON, RULE_LABEL, setupTitle } from './labels';
import styles from './Memory.module.css';

const RULES: Rule[] = ['same', 'word'];
const RULE_DESC: Record<Rule, string> = { same: '똑같은 그림 두 장', word: '그림 + 이름 글자' };

/** 메뉴: 카드 그림 · 짝 규칙 · 단계 → 고르면 "시작하기" 화면으로 */
export function Menu({ onStart, onResume }: { onStart: () => void; onResume?: () => void }) {
  const setup = useMemoryCards((s) => s.setup);
  const setSetup = useMemoryCards((s) => s.setSetup);
  const newGame = useMemoryCards((s) => s.newGame);
  const records = useMemoryCards((s) => s.records);
  const session = useMemoryCards((s) => s.session);
  const [confirm, setConfirm] = useState<Level | null>(null);

  const begin = (level: Level) => {
    newGame({ level });
    onStart();
  };

  return (
    <div className={styles.menu}>
      <div className={styles.menuIntro}>
        <Robot mood="happy" size={88} />
        <p className={styles.bubbleLarge}>
          카드를 두 장씩 뒤집어서 <b>짝꿍</b>을 찾아 봐!
          <br />
          {setup.rule === 'word' ? '그림과 그 이름 글자가 짝이야.' : '똑같은 그림이 짝이야.'}
        </p>
      </div>

      {onResume && session && (
        <Button size="lg" onClick={onResume} className={styles.resume}>
          ▶ 하던 게임 이어하기 <small>({setupTitle(session)})</small>
        </Button>
      )}

      <section className={styles.menuSection}>
        <h2 className={styles.menuLabel}>어떤 카드로 할까?</h2>
        <div className={styles.themes} role="radiogroup" aria-label="카드 그림">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={setup.theme === t.id}
              aria-label={t.name}
              className={[styles.themeChip, setup.theme === t.id && styles.on].filter(Boolean).join(' ')}
              style={{ '--c': t.color } as CSSProperties}
              onClick={() => setSetup({ theme: t.id })}
            >
              <span className={styles.themeIcon}>{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.menuSection}>
        <div className={styles.modeTabs} role="radiogroup" aria-label="짝 규칙">
          {RULES.map((r) => (
            <button key={r} role="radio" aria-checked={setup.rule === r} className={setup.rule === r ? styles.on : undefined} onClick={() => setSetup({ rule: r })}>
              <span className={styles.modeName}>{RULE_ICON[r]} {RULE_LABEL[r]}</span>
              <span className={styles.modeMeta}>{RULE_DESC[r]}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.diffList}>
        {LEVELS.map((level) => {
          const rec = records[recordKey({ level, rule: setup.rule })];
          const medal = medalFor({ level, rule: setup.rule }, rec?.best);
          return (
            <button
              key={level}
              className={styles.diffCard}
              style={{ '--d': LEVEL_COLOR[level] } as CSSProperties}
              onClick={() => (hasProgress(session) ? setConfirm(level) : begin(level))}
              aria-label={`${LEVEL_LABEL[level]} ${PAIRS[level]}쌍`}
            >
              <span className={styles.diffStars}>
                {[1, 2, 3, 4].map((k) => (
                  <StarIcon key={k} filled={k <= LEVEL_STARS[level]} width={18} height={18} />
                ))}
              </span>
              <span className={styles.diffName}>
                {LEVEL_LABEL[level]} <small>{PAIRS[level]}쌍</small>
              </span>
              <span className={styles.diffMeta}>{rec?.best !== undefined ? `🏆 ${formatTime(rec.best)} · ${rec.plays}번` : `카드 ${PAIRS[level] * 2}장`}</span>
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
        title="새 게임을 시작할까?"
        message={session ? `하던 ${setupTitle(session)} 게임은 취소돼요.` : undefined}
        cancelLabel="하던 게임 이어하기"
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
