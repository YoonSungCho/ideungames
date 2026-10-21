import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BackIcon, GearIcon } from '@/shared/ui/icons';
import styles from './pages.module.css';

export function Header({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  return (
    <header className={styles.header}>
      {back ? (
        <Link to="/" className={styles.iconBtn} aria-label="홈으로">
          <BackIcon />
        </Link>
      ) : (
        <span className={styles.iconSpacer} />
      )}
      <h1 className={styles.title}>{title}</h1>
      {right ?? (
        <Link to="/settings" className={styles.iconBtn} aria-label="설정">
          <GearIcon />
        </Link>
      )}
    </header>
  );
}
