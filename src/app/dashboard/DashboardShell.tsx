'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
import styles from './layout.module.css';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openMenu = useCallback(() => setIsMobileOpen(true), []);
  const closeMenu = useCallback(() => setIsMobileOpen(false), []);

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile overlay — tapping it closes the sidebar */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={closeMenu} aria-hidden="true" />
      )}

      <div className={`${styles.sidebarWrapper} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <Sidebar />
      </div>

      <div className={styles.mainWrapper}>
        <Topbar onMenuClick={openMenu} />
        <main className={styles.content}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
