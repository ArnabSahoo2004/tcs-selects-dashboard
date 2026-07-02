// src/components/ui/Skeleton/Skeleton.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Skeleton.module.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  width,
  height,
  style,
  ...props
}) => {
  const customStyles = {
    width,
    height,
    ...style,
  };

  return (
    <div
      className={cn(styles.skeleton, styles[variant], className)}
      style={customStyles}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={cn(styles.textContainer, className)}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="text"
          className={styles.textLine}
          width={idx === lines - 1 && lines > 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn(styles.skeletonCard, className)}>
      <Skeleton variant="rect" className={styles.cardHeader} />
      <SkeletonText lines={3} className={styles.cardBody} />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 5,
  className,
}) => {
  return (
    <div className={cn(styles.tableContainer, className)}>
      {/* Table Header */}
      <div className={styles.tableHeaderRow}>
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} variant="rect" className={styles.th} />
        ))}
      </div>
      {/* Table Body */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className={styles.tableBodyRow}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} variant="text" className={styles.td} />
          ))}
        </div>
      ))}
    </div>
  );
};
