import { lazy, Suspense, useMemo, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, useParams } from 'react-router';
import { getGame } from '@/games/registry';
import { Robot } from '@/shared/ui/Robot';
import { Header } from './Header';
import { LeaveConfirm } from './LeaveConfirm';
import styles from './pages.module.css';

const lazyCache = new Map<string, LazyExoticComponent<ComponentType>>();

export function GamePage() {
  const { id = '', '*': rest } = useParams();
  const gamePath = `/games/${id}`;
  const game = getGame(id);
  const Game = useMemo(() => {
    if (!game) return null;
    if (!lazyCache.has(game.id)) lazyCache.set(game.id, lazy(game.load));
    return lazyCache.get(game.id)!;
  }, [game]);

  if (!game || !Game) return <Navigate to="/" replace />;

  return (
    <div className={styles.gamePage}>
      {/* ← 는 한 단계 위로: /games/x/a/b → /games/x/a → /games/x → 홈 */}
      <Header title={game.title} back backTo={rest ? [gamePath, ...rest.split('/').filter(Boolean).slice(0, -1)].join('/') : '/'} />
      <Suspense
        fallback={
          <div className={styles.loading}>
            <Robot mood="think" size={90} />
            <p>준비 중…</p>
          </div>
        }
      >
        <Game />
      </Suspense>
      <LeaveConfirm gamePath={gamePath} />
    </div>
  );
}
