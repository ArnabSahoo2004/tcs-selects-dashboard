// src/components/layout/Topbar/Topbar.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, User, CheckCheck, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle/ThemeToggle';
import styles from './Topbar.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

interface TopbarProps {
  onMenuClick?: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsDropdownOpen((prev) => !prev);
    if (!isDropdownOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    // Navigate if actionUrl provided
    if (notif.actionUrl) {
      setIsDropdownOpen(false);
      router.push(notif.actionUrl);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className={styles.greeting}>
          <span className={styles.hello}>Hello,</span>{' '}
          <strong className={styles.name}>{session?.user?.name || 'Guest'}</strong>
        </div>
      </div>

      <div className={styles.right}>
        {/* THEME SWITCHER */}
        <ThemeToggle />

        {/* NOTIFICATION BELL & DROPDOWN */}
        <div className={styles.notifWrapper} ref={dropdownRef}>
          <button
            className={`${styles.iconBtn} ${unreadCount > 0 ? styles.bellPulse : ''}`}
            aria-label="View notifications"
            onClick={handleBellClick}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className={styles.dropdownBody}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notif) => (
                    <button
                      key={notif.id}
                      className={`${styles.notifItem} ${!notif.isRead ? styles.notifUnread : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className={styles.notifDot} />
                      <div className={styles.notifContent}>
                        <span className={styles.notifTitle}>{notif.title}</span>
                        <span className={styles.notifMessage}>{notif.message}</span>
                        <span className={styles.notifTime}>{timeAgo(notif.createdAt)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={styles.notifEmpty}>No notifications yet.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.divider} />
        <div className={styles.userInfo}>
          <div className={styles.userMeta}>
            <div className={styles.userName}>{session?.user?.name || 'Guest'}</div>
            <div className={styles.userRole}>
              Candidate
            </div>
          </div>
          <div className={styles.avatar}>
            <User size={16} />
          </div>
        </div>
        <button
          className={styles.iconBtn}
          aria-label="Sign out"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
