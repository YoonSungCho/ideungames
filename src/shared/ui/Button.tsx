import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return <button className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')} {...rest} />;
}
