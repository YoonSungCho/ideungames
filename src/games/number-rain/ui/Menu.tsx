import { useState } from 'react';
import { Link } from 'react-router';
import { MEDAL_ICON, MEDALS } from '@/shared/game/medals';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StarIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import { SPEEDS, type Speed } from '../engine/game';
import { MODES, type Mode } from '../engine/questions';
import { medalFor } from '../records';
import { hasProgress, recordKey, useNumberRain } from '../store';
import { MODE_INFO, setupTitle, SPEED_INFO } from './labels';
import styles from './NumberRain.module.css';

/** 모드 하나에서 받은 가장 좋은 메달 (빠르기 상관없이) */
function useBestMedal(mode: Mode) {
  const records = useNumberRain((s) => s.records);
  const got = SPEEDS.map((sp) => medalFor(mode, sp, records[recordKey({ mode, speed: sp })]?.best)).filter(Boolean);
  return MEDALS.find((m) => got.includes(m)) ?? null;
}

function ModeCard({ mode, on, onPick }: { mode: Mode; on: boolean; onPick: () => void }) {
  const info = MODE_INFO[mode];
  const medal = useBestMedal(mode);
  return (
    <button role="radio" aria-checked={on} aria-label={info.name} className={[styles.modeCard, on && styles.on].filter(Boolean).join(' ')} onClick={onPick}>
      <span className={styles.modeEmoji} aria-hidden>{info.emoji}</span>
      <span className={styles.modeName}>{info.name}</span>
      <span className={styles.modeExample}>{info.example}</span>
      {medal && <span className={styles.modeMedal} aria-label="받은 메달">{MEDAL_ICON[medal]}</span>}
    </button>
  );
}

/** 메뉴: 모드 고르기 → 빠르기 고르면 "시작하기" 화면으로 */
export function Menu({ onStart, onResume }: { onStart: () => void; onResume?: () => void }) {
  const setup = useNumberRain((s) => s.setup);
  const setSetup = useNumberRain((s) => s.setSetup);
  const newGame = useNumberRain((s) => s.newGame);
  const records = useNumberRain((s) => s.records);
  const game = useNumberRain((s) => s.game);
  const [confirm, setConfirm] = useState<Speed | null>(null);

  const begin = (speed: Speed) => {
    newGame({ speed });
    onStart();
  };

  return (
    <div className={styles.menu}>
      <div className={styles.menuIntro}>
        <Robot mood="happy" size={88} />
        <p className={styles.bubbleLarge}>
          하늘에서 <b>숫자 비</b>가 내려요! 땅에 닿기 전에 답을 눌러 <b>펑!</b>
          <br />
          💣 폭탄을 맞히면 모두 한꺼번에 펑!
        </p>
      </div>

      {onResume && game && (
        <Button size="lg" onClick={onResume} className={styles.resume}>
          ▶ 하던 게임 이어하기 <small>({setupTitle(game)})</small>
        </Button>
      )}

      <section className={styles.menuSection}>
        <h2 className={styles.menuLabel}>어떤 숫자 비를 맞을까?</h2>
        <div className={styles.modeGrid} role="radiogroup" aria-label="모드 고르기">
          {MODES.map((m) => (
            <ModeCard key={m} mode={m} on={setup.mode === m} onPick={() => setSetup({ mode: m })} />
          ))}
        </div>
      </section>

      <section className={styles.menuSection}>
        <h2 className={styles.menuLabel}>얼마나 빨리 내릴까?</h2>
        <div className={styles.speedList}>
          {SPEEDS.map((sp) => {
            const info = SPEED_INFO[sp];
            const rec = records[recordKey({ mode: setup.mode, speed: sp })];
            const medal = medalFor(setup.mode, sp, rec?.best);
            return (
              <button key={sp} className={[styles.speedCard, styles[`s_${sp}`]].join(' ')} onClick={() => (hasProgress(game) ? setConfirm(sp) : begin(sp))} aria-label={`${info.name} 시작`}>
                <span className={styles.speedEmoji} aria-hidden>{info.emoji}</span>
                <span className={styles.speedName}>
                  {info.name}
                  <span className={styles.speedStars}>
                    {[1, 2, 3].map((k) => <StarIcon key={k} filled={k <= info.stars} width={16} height={16} />)}
                  </span>
                </span>
                <span className={styles.speedMeta}>{rec?.best !== undefined ? `🏆 ${rec.best}점 · ${rec.plays}번` : info.hint}</span>
                {medal && <span className={styles.speedMedal} aria-label="받은 메달">{MEDAL_ICON[medal]}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <Link to="records" className={styles.recordsLink}>
        🏆 내 기록 · 메달 보기
      </Link>

      <ConfirmDialog
        open={confirm !== null}
        title="새 게임을 시작할까?"
        message={game ? `하던 ${setupTitle(game)} 게임은 취소돼요.` : undefined}
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
