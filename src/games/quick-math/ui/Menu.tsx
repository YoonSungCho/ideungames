import { useState } from 'react';
import { Link } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON } from '@/shared/game/medals';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import { DANS, OP_LABEL, OP_SYMBOL, OPS, type Difficulty } from '../engine';
import { medalFor } from '../records';
import { hasProgress, recordKey, useQuickMath, type GameMode } from '../store';
import { DIFFICULTIES, DIFFICULTY_HINT, DIFFICULTY_LABEL, DIFFICULTY_STARS, MODE_DESC, MODE_LABEL, setupTitle } from './labels';
import styles from './QuickMath.module.css';

const MODES: GameMode[] = ['sprint', 'blitz'];

/** 메뉴: 게임 방식 · 연산 · (구구단 단) · 난이도 → 고르면 "시작하기" 화면으로 */
export function Menu({ onStart, onResume }: { onStart: () => void; onResume?: () => void }) {
  const setup = useQuickMath((s) => s.setup);
  const setSetup = useQuickMath((s) => s.setSetup);
  const newGame = useQuickMath((s) => s.newGame);
  const records = useQuickMath((s) => s.records);
  const session = useQuickMath((s) => s.session);
  const [confirm, setConfirm] = useState<Difficulty | null>(null);
  const usesDans = setup.ops.includes('mul') || setup.ops.includes('div');

  const begin = (difficulty: Difficulty) => {
    newGame({ difficulty });
    onStart();
  };
  const toggleOp = (op: (typeof OPS)[number]) =>
    setSetup({ ops: setup.ops.includes(op) ? setup.ops.filter((o) => o !== op) : [...setup.ops, op] });
  const toggleDan = (dan: number) =>
    setSetup({ dans: setup.dans.includes(dan) ? setup.dans.filter((d) => d !== dan) : [...setup.dans, dan] });

  return (
    <div className={styles.menu}>
      <div className={styles.menuIntro}>
        <Robot mood="happy" size={88} />
        <p className={styles.bubbleLarge}>
          문제를 보고 <b>숫자 패드</b>로 답을 눌러!
          <br />
          {MODE_DESC[setup.mode]}
        </p>
      </div>

      {onResume && session && (
        <Button size="lg" onClick={onResume} className={styles.resume}>
          ▶ 하던 게임 이어하기 <small>({setupTitle(session)})</small>
        </Button>
      )}

      <section className={styles.menuSection} aria-label="게임 방식">
        <div className={styles.modeTabs} role="radiogroup" aria-label="게임 방식">
          {MODES.map((m) => (
            <button key={m} role="radio" aria-checked={setup.mode === m} className={setup.mode === m ? styles.on : undefined} onClick={() => setSetup({ mode: m })}>
              <span className={styles.modeName}>{m === 'sprint' ? '📝' : '⏱'} {MODE_LABEL[m]}</span>
              <span className={styles.modeMeta}>{m === 'sprint' ? '빨리 풀기' : '많이 맞히기'}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.menuSection}>
        <h2 className={styles.menuLabel}>어떤 계산을 할까? <small>(여러 개 골라도 돼)</small></h2>
        <div className={styles.opChips} role="group" aria-label="연산 고르기">
          {OPS.map((op) => {
            const on = setup.ops.includes(op);
            return (
              <button
                key={op}
                aria-pressed={on}
                aria-label={OP_LABEL[op]}
                className={[styles.opChip, styles[`op_${op}`], on && styles.on].filter(Boolean).join(' ')}
                onClick={() => toggleOp(op)}
                disabled={on && setup.ops.length === 1}
              >
                <span className={styles.opSymbol}>{OP_SYMBOL[op]}</span>
                <span>{OP_LABEL[op]}</span>
              </button>
            );
          })}
        </div>
        {usesDans && (
          <div className={styles.dans} role="group" aria-label="구구단 단 고르기">
            <span className={styles.dansLabel}>구구단</span>
            <button aria-pressed={setup.dans.length === 0} className={setup.dans.length === 0 ? styles.on : undefined} onClick={() => setSetup({ dans: [] })}>
              자동
            </button>
            {DANS.map((d) => (
              <button key={d} aria-pressed={setup.dans.includes(d)} aria-label={`${d}단`} className={setup.dans.includes(d) ? styles.on : undefined} onClick={() => toggleDan(d)}>
                {d}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className={styles.diffList}>
        {DIFFICULTIES.map((d) => {
          const rec = records[recordKey({ ...setup, difficulty: d })];
          const medal = medalFor({ mode: setup.mode, difficulty: d }, rec?.best);
          return (
            <button key={d} className={[styles.diffCard, styles[`d_${d}`]].join(' ')} onClick={() => (hasProgress(session) ? setConfirm(d) : begin(d))}>
              <span className={styles.diffStars}>
                {[1, 2, 3].map((k) => (
                  <StarIcon key={k} filled={k <= DIFFICULTY_STARS[d]} width={22} height={22} />
                ))}
              </span>
              <span className={styles.diffName}>{DIFFICULTY_LABEL[d]}</span>
              <span className={styles.diffMeta}>
                {rec?.best !== undefined
                  ? `🏆 ${setup.mode === 'sprint' ? formatTime(rec.best) : `${rec.best}개`} · ${rec.plays}번`
                  : DIFFICULTY_HINT[d]}
              </span>
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
