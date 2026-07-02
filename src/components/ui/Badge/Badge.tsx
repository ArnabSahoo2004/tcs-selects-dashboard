// src/components/ui/Badge/Badge.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';
  glow?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  glow = false,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        styles.badge,
        styles[variant],
        glow && styles.glow,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
