// src/components/ui/Table/Table.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Table.module.css';

export const TableContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn(styles.container, className)} ref={ref} {...props}>
      {children}
    </div>
  )
);
TableContainer.displayName = 'TableContainer';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => (
    <table className={cn(styles.table, className)} ref={ref} {...props}>
      {children}
    </table>
  )
);
Table.displayName = 'Table';

export const THead = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead className={cn(styles.thead, className)} ref={ref} {...props}>
      {children}
    </thead>
  )
);
THead.displayName = 'THead';

export const TBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody className={cn(styles.tbody, className)} ref={ref} {...props}>
      {children}
    </tbody>
  )
);
TBody.displayName = 'TBody';

export const TR = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => (
    <tr className={cn(styles.tr, className)} ref={ref} {...props}>
      {children}
    </tr>
  )
);
TR.displayName = 'TR';

export const TH = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <th className={cn(styles.th, className)} ref={ref} {...props}>
      {children}
    </th>
  )
);
TH.displayName = 'TH';

export const TD = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <td className={cn(styles.td, className)} ref={ref} {...props}>
      {children}
    </td>
  )
);
TD.displayName = 'TD';
