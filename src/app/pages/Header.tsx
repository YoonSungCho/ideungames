import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { HeaderSlotTarget } from '@/shared/ui/HeaderSlot';
import { BackIcon, GearIcon } from '@/shared/ui/icons';
import styles from './pages.module.css';

interface HeaderProps {
  title: ReactNode;
  back?: boolean;
  backTo?: string;
  /** 왔던 화면으로 돌아가기 (설정처럼 어디서든 들어오는 화면). 앱 안 이전 기록이 없으면 backTo로 */
  backToPrevious?: boolean;
  right?: ReactNode;
}

export function Header({ title, back, backTo = '/', backToPrevious, right }: HeaderProps) {
  const navigate = useNavigate();
  const canGoBack = backToPrevious && ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
  return (
    <header className={styles.header}>
      {back && canGoBack ? (
        <button className={styles.iconBtn} aria-label="뒤로" onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
      ) : back ? (
        <Link to={backTo} className={styles.iconBtn} aria-label={backTo === '/' ? '홈으로' : '뒤로'}>
          <BackIcon />
        </Link>
      ) : (
        <span className={styles.iconSpacer} />
      )}
      <h1 className={styles.title}>{title}</h1>
      <HeaderSlotTarget className={styles.slot} />
      {right ?? (
        <Link to="/settings" className={styles.iconBtn} aria-label="설정">
          <GearIcon />
        </Link>
      )}
    </header>
  );
}
