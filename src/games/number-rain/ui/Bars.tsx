import { MEDAL_ICON, MEDAL_LABEL } from '@/shared/game/medals';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { MAX_LIVES } from '../engine/game';
import { liveTarget } from '../records';
import { recordKey, useNumberRain } from '../store';
import { MODE_INFO, SPEED_INFO } from './labels';
import styles from './NumberRain.module.css';

/** 상단 바 가운데: 모드·빠르기 칩(→ 메뉴) + 배경 음악 켜고 끄기 */
export function TopBar({ onMenu }: { onMenu: () => void }) {
  const game = useNumberRain((s) => s.game)!;
  const music = useNumberRain((s) => s.music);
  const toggleMusic = useNumberRain((s) => s.toggleMusic);
  const m = MODE_INFO[game.mode];
  const sp = SPEED_INFO[game.speed];
  return (
    <HeaderSlot>
      <button className={styles.setupChip} onClick={onMenu} aria-label={`${m.name}, ${sp.name}, 바꾸기`}>
        {m.emoji} {m.name} {sp.emoji} <span className={styles.chipHint}>▾</span>
      </button>
      <button className={[styles.musicBtn, music && styles.on].filter(Boolean).join(' ')} onClick={toggleMusic} aria-pressed={music} aria-label="배경 음악">
        {music ? '🎵' : '🔇'}
      </button>
    </HeaderSlot>
  );
}

/** 판 위 한 줄: 목숨 · 점수 · 단계 · 메달 목표 · 최고 · (실수) · 멈춤 */
export function StatusBar({ showMistakes }: { showMistakes: boolean }) {
  const game = useNumberRain((s) => s.game)!;
  const paused = useNumberRain((s) => s.paused);
  const pause = useNumberRain((s) => s.pause);
  const best = useNumberRain((s) => s.records[recordKey(game)]?.best);
  const live = game.status === 'playing' && !paused;
  const target = game.status === 'done' ? null : liveTarget(game.mode, game.speed, game.score);
  const beat = best !== undefined && game.score > best;

  return (
    <div className={styles.status}>
      <span className={[styles.lives, game.lives === 1 && styles.livesLow].filter(Boolean).join(' ')} aria-label={`목숨 ${game.lives}개`}>
        {Array.from({ length: MAX_LIVES }, (_, i) => (
          <span key={i} className={i < game.lives ? styles.heartOn : styles.heartOff}>{i < game.lives ? '❤️' : '🤍'}</span>
        ))}
      </span>
      <span className={styles.stat} aria-label={`점수 ${game.score}점`}>
        ⭐ <b key={game.score} className={styles.bump}>{game.score}</b>
      </span>
      <span className={[styles.stat, styles.levelStat].join(' ')} aria-label={`${game.level}단계`}>
        🚀 <b>{game.level}</b>
      </span>
      <div className={styles.paceInfo}>
        {target && (
          <span className={styles[`pace_${target.medal}`]}>
            {MEDAL_ICON[target.medal]} {MEDAL_LABEL[target.medal]}까지 <b>{target.need}</b>
          </span>
        )}
        {best !== undefined && (
          <span className={beat ? styles.beat : undefined}>🏆 <b>{best}</b></span>
        )}
        {showMistakes && <span>실수 <b>{game.mistakes}</b></span>}
      </div>
      {live && (
        <button className={styles.pauseBtn} onClick={pause} aria-label="잠깐 멈추기">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
