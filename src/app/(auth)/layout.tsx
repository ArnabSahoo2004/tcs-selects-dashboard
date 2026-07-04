// src/app/(auth)/layout.tsx
import React from 'react';
import { Metadata } from 'next';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Authentication — TCS Selects',
  description: 'Access the TCS Selects Tracker Dashboard, register your ID, or claim your post-selection candidate account.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authContainer}>
      <div className={styles.radialGlowBlue} />
      <div className={styles.radialGlowMagenta} />
      
      <div className={styles.cardWrapper}>
        <div className={styles.logoBadge}>
          <span>TCS Selects</span>
        </div>
        {children}
      </div>
    </div>
  );
}
