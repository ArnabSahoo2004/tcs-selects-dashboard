// src/components/ui/ProgressBar/ProgressBar.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  size = 'md',
  showValue = false,
  className,
}) => {
  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={cn(styles.track, styles[size])}>
        <div
          className={cn(styles.bar, styles[variant])}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showValue ? (
        <span className={styles.valueText}>{Math.round(percentage)}%</span>
      ) : null}
    </div>
  );
};
