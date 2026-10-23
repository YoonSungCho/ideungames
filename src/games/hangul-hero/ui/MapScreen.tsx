import { Link, useNavigate } from 'react-router';
import { REGIONS } from '../data/regions';
import { PROLOGUE } from '../data/story';
import { OPPOSITES } from '../data/opposites';
import { WORDS } from '../data/words';
import { isRegionOpen, regionProgress, totalStars, useHangulHero } from '../store';
import { Cutscene } from './Cutscene';
import { Hero, Imp } from './characters';
import styles from './HangulHero.module.css';

const TOTAL_PIECES = 14 + 10 + WORDS.length + OPPOSITES.length;

/** 모험 지도: 지역들이 길로 이어져 있다. 되찾은 지역은 제 색으로 빛난다. */
export function MapScreen() {
  const progress = useHangulHero((s) => s.progress);
  const pieces = useHangulHero((s) => s.pieces.length);
  const prologueSeen = useHangulHero((s) => s.prologueSeen);
  const markSeen = useHangulHero((s) => s.markSeen);
  const navigate = useNavigate();
  const stars = totalStars(progress);
  const allClear = REGIONS.every((r) => regionProgress(progress, r.id).bossCleared);

  return (
    <div className={styles.mapPage}>
      {!prologueSeen && <Cutscene lines={PROLOGUE} title="프롤로그" onDone={() => markSeen('prologue')} />}
      <div className={styles.mapTop}>
        <Hero mood="happy" size={72} />
        <div className={styles.mapStats}>
          <span aria-label={`별 ${stars}개`}>⭐ <b>{stars}</b>/{REGIONS.length * 9}</span>
          <Link to="book" className={styles.bookBtn}>📖 한글 도감 <b>{pieces}</b>/{TOTAL_PIECES}</Link>
        </div>
        <button className={styles.storyBtn} onClick={() => useHangulHero.setState({ prologueSeen: false })} aria-label="처음 이야기 다시 보기">📜</button>
      </div>
      {allClear && <p className={styles.rainbow}>🌈 한글 나라를 모두 되찾았어요! 도감에서 인증서를 확인해 봐!</p>}

      <ol className={styles.path}>
        {REGIONS.map((r, i) => {
          const p = regionProgress(progress, r.id);
          const open = isRegionOpen(progress, i);
          const got = p.stars.reduce((a, b) => a + b, 0);
          return (
            <li key={r.id} className={[styles.node, i % 2 ? styles.right : styles.left].join(' ')}>
              <button
                className={[styles.island, p.bossCleared && styles.freed, !open && styles.locked, open && !p.bossCleared && styles.current].filter(Boolean).join(' ')}
                style={{ ['--rc' as string]: r.color }}
                disabled={!open}
                onClick={() => navigate(r.id)}
                aria-label={`${i + 1}. ${r.name}${open ? `, 별 ${got}개${p.bossCleared ? ', 되찾음' : ''}` : ', 잠김'}`}
              >
                <span className={styles.islandEmoji}>{open ? r.emoji : '🔒'}</span>
                {open && !p.bossCleared && (
                  <span className={styles.islandImp} aria-hidden>
                    <Imp who={r.villain === 'bakjuk' ? 'bakjuk' : 'dwijuk'} size={44} />
                  </span>
                )}
              </button>
              <div className={styles.nodeLabel}>
                <b>{r.name}</b>
                <small>{open ? `${'★'.repeat(Math.round(got / 3))}${'☆'.repeat(3 - Math.round(got / 3))} · ${r.learn}` : '앞 지역을 되찾으면 열려요'}</small>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
