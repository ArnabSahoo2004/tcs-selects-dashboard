'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle/ThemeToggle';
import styles from './HomeHeader.module.css';

export default function HomeHeader() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.actions}>
      <ThemeToggle />

      {status === 'loading' ? (
        <div className={styles.skeleton} />
      ) : session ? (
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button
            className={styles.profileBtn}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Open profile menu"
            aria-expanded={isOpen}
          >
            <div className={styles.avatar}>
              <User size={16} />
            </div>
            <span className={styles.profileName}>{session.user?.name || 'Candidate'}</span>
            <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
          </button>

          {isOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownName}>{session.user?.name || 'Candidate'}</div>
                <div className={styles.dropdownEmail}>{session.user?.email}</div>
              </div>
              <div className={styles.dropdownDivider} />
              <Link
                href="/dashboard"
                className={styles.dropdownItem}
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={15} />
                View Profile
              </Link>
              <button
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className={styles.loginBtn}>
          Login
        </Link>
      )}
    </div>
  );
}
