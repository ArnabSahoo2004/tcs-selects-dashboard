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

      <footer className={styles.footer}>
        <div className={styles.disclaimer}>
          <strong>Disclaimer:</strong> This website is an independent student-made project created for educational and tracking purposes only. It is <strong>not affiliated with, endorsed by, authorized by, or in any way officially connected with Tata Consultancy Services (TCS)</strong>, or any of its subsidiaries or its affiliates. The use of the name "TCS" or any related names, marks, emblems, and images is purely for descriptive and identification purposes. No copyright or trademark infringement is intended. All candidate data is self-reported and not officially verified by the company.
        </div>
      </footer>
    </div>
  );
}
