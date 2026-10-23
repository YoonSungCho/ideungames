import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { speak } from '@/shared/sound/speak';
import { REGIONS } from '../data/regions';
import { OPPOSITES } from '../data/opposites';
import { WORDS } from '../data/words';
import { CONSONANTS, VOWELS } from '../engine/hangul';
import { regionProgress, useHangulHero } from '../store';
import { Hero } from './characters';
import styles from './HangulHero.module.css';

/** 한글 도감: 되찾은 자음·모음·낱말이 반짝인다. 다 되찾으면 용사 인증서 */
export function BookScreen() {
  const pieces = new Set(useHangulHero((s) => s.pieces));
  const progress = useHangulHero((s) => s.progress);
  const name = useSettings((s) => s.playerName);
  const allClear = REGIONS.every((r) => regionProgress(progress, r.id).bossCleared);
  const count = (prefix: string, list: string[]) => list.filter((x) => pieces.has(`${prefix}:${x}` as never)).length;

  const Cell = ({ id, label, say, emoji }: { id: string; label: string; say: string; emoji?: string }) => {
    const got = pieces.has(id as never);
    return (
      <button className={[styles.bookCell, got && styles.got].filter(Boolean).join(' ')} disabled={!got} onClick={() => speak(say)} aria-label={got ? label : '아직 못 찾음'}>
        {emoji && <span className={styles.bookEmoji}>{got ? emoji : '❔'}</span>}
        <span>{got ? label : '?'}</span>
      </button>
    );
  };

  return (
    <div className={styles.bookPage}>
      {allClear && (
        <section className={styles.certificate} aria-label="한글 용사 인증서">
          <Hero mood="happy" size={90} />
          <div>
            <h2>📜 한글 용사 인증서</h2>
            <p>
              <b>{name}</b> 용사는 뒤죽과 박죽에게서 한글 나라를 모두 되찾았기에 이 인증서를 드립니다.
            </p>
            <small>{callName(name)}, 정말 멋져! — 띠봇</small>
          </div>
        </section>
      )}
      <section className={styles.bookSection}>
        <h2>자음 <small>{count('c', CONSONANTS.map((c) => c.j))}/14</small></h2>
        <div className={styles.bookGrid}>
          {CONSONANTS.map((c) => <Cell key={c.j} id={`c:${c.j}`} label={c.j} say={c.name} />)}
        </div>
      </section>
      <section className={styles.bookSection}>
        <h2>모음 <small>{count('v', VOWELS.map((v) => v.j))}/10</small></h2>
        <div className={styles.bookGrid}>
          {VOWELS.map((v) => <Cell key={v.j} id={`v:${v.j}`} label={v.j} say={v.say} />)}
        </div>
      </section>
      <section className={styles.bookSection}>
        <h2>낱말 <small>{count('w', WORDS.map((w) => w.word))}/{WORDS.length}</small></h2>
        <div className={[styles.bookGrid, styles.wordGrid].join(' ')}>
          {WORDS.map((w) => <Cell key={w.word} id={`w:${w.word}`} label={w.word} say={w.word} emoji={w.emoji} />)}
        </div>
      </section>
      <section className={styles.bookSection}>
        <h2>반대말 짝꿍 <small>{count('o', OPPOSITES.map((o) => o.a))}/{OPPOSITES.length}</small></h2>
        <div className={[styles.bookGrid, styles.wordGrid, styles.oppGrid].join(' ')}>
          {OPPOSITES.map((o) => <Cell key={o.a} id={`o:${o.a}`} label={`${o.a} ↔ ${o.b}`} say={`${o.a}, ${o.b}`} emoji={`${o.ea}${o.eb}`} />)}
        </div>
      </section>
    </div>
  );
}
