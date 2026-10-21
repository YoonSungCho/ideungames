import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { games } from '@/games/registry';
import { CATEGORY_LABELS, type GameCategory } from '@/games/types';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { GearIcon } from '@/shared/ui/icons';
import { Robot } from '@/shared/ui/Robot';
import styles from './pages.module.css';

type Filter = 'all' | GameCategory;

export function HomePage() {
  const name = useSettings((s) => s.playerName);
  const [filter, setFilter] = useState<Filter>('all');

  // 실제 게임이 있는 카테고리만 칩으로 노출
  const categories = useMemo(() => [...new Set(games.map((g) => g.category))], []);
  const visible = filter === 'all' ? games : games.filter((g) => g.category === filter);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <Robot mood="happy" size={92} />
        <div className={styles.heroText}>
          <h1>이든 게임즈</h1>
          <p className={styles.heroBubble}>{callName(name)}, 오늘은 뭐 하고 놀까?</p>
        </div>
        <Link to="/settings" className={[styles.iconBtn, styles.heroGear].join(' ')} aria-label="설정">
          <GearIcon />
        </Link>
      </header>

      {categories.length > 1 && (
        <nav className={styles.chips} aria-label="게임 종류">
          {(['all', ...categories] as Filter[]).map((c) => (
            <button key={c} className={[styles.chip, filter === c && styles.chipOn].filter(Boolean).join(' ')} onClick={() => setFilter(c)}>
              {c === 'all' ? '전체' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </nav>
      )}

      <main className={styles.grid}>
        {visible.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`} className={styles.card} style={{ ['--card' as string]: g.color }}>
            {g.badge && <span className={styles.cardBadge}>{g.badge === 'new' ? 'NEW' : 'BETA'}</span>}
            <div className={styles.thumb}>
              <g.Thumbnail />
            </div>
            <div className={styles.cardBody}>
              <h2>{g.title}</h2>
              <p>{g.description}</p>
              <div className={styles.tags}>
                <span>{CATEGORY_LABELS[g.category]}</span>
                {g.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
                <span>{g.ages[0]}~{g.ages[1]}세</span>
              </div>
            </div>
          </Link>
        ))}
        <div className={[styles.card, styles.soon].join(' ')} aria-hidden>
          <div className={styles.thumb}>🎁</div>
          <div className={styles.cardBody}>
            <h2>새 게임 준비 중</h2>
            <p>띠봇이 열심히 만들고 있어요!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
