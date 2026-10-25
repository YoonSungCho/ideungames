import { Link } from 'react-router';
import { Robot } from '@/shared/ui/Robot';
import { PICTURES } from '../data/pictures';
import { progress } from '../engine/art';
import { useColoring } from '../store';
import { Drawing } from './Drawing';
import styles from './Coloring.module.css';

/** 도안 고르기: 칠하던 그림은 칠한 그대로 보인다 */
export function Gallery() {
  const art = useColoring((s) => s.art);
  const doneCount = PICTURES.filter((p) => art[p.id]?.done).length;
  return (
    <div className={styles.gallery}>
      <div className={styles.intro}>
        <Robot mood="happy" size={80} />
        <p className={styles.bubbleLarge}>
          어떤 그림을 칠해 볼까?
          <br />
          <small>다 칠한 그림 {doneCount}/{PICTURES.length}</small>
        </p>
      </div>
      <div className={styles.picGrid}>
        {PICTURES.map((p) => {
          const a = art[p.id];
          const { filled, total } = progress(p, a);
          return (
            <Link key={p.id} to={p.id} className={styles.picCard} aria-label={`${p.name}${a?.done ? ', 완성' : filled ? `, ${total}곳 중 ${filled}곳 칠함` : ''}`}>
              <Drawing pic={p} art={a} className={styles.picThumb} />
              <span className={styles.picName}>
                {p.icon} {p.name}
                {a?.done && <span className={styles.doneTag}>✅</span>}
              </span>
              {!a?.done && filled > 0 && (
                <span className={styles.picBar} aria-hidden>
                  <span style={{ width: `${(filled / total) * 100}%` }} />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
