// src/components/layout/PageHeader/PageHeader.tsx
import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './PageHeader.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
            <ol className={styles.breadcrumbList}>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={index} className={styles.breadcrumbItem}>
                    {item.href && !isLast ? (
                      <Link href={item.href} className={styles.breadcrumbLink}>
                        {item.label}
                      </Link>
                    ) : (
                      <span className={styles.breadcrumbCurrent}>{item.label}</span>
                    )}
                    {!isLast && (
                      <ChevronRight size={12} className={styles.breadcrumbSeparator} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
};
