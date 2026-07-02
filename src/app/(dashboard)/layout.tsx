// src/app/(dashboard)/layout.tsx
'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
import { cn } from '@/lib/utils';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar Wrapper */}
      <div className={cn(styles.sidebarWrapper, isMobileMenuOpen && styles.mobileOpen)}>
        <Sidebar />
      </div>

      {/* Overlay to close mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className={styles.content}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
