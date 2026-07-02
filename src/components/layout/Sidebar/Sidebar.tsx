// src/components/layout/Sidebar/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileCheck,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = session?.user?.role || 'CANDIDATE';

  const menuItems = [
    {
      label: 'Overview',
      href: '/overview',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'COORDINATOR', 'CANDIDATE'],
    },
    {
      label: 'Candidates',
      href: '/candidates',
      icon: Users,
      roles: ['ADMIN', 'COORDINATOR'],
    },
    {
      label: 'Milestones',
      href: '/milestones',
      icon: Kanban,
      roles: ['ADMIN', 'COORDINATOR', 'CANDIDATE'],
    },
    {
      label: 'Checklist',
      href: '/checklist',
      icon: FileCheck,
      roles: ['ADMIN', 'COORDINATOR', 'CANDIDATE'],
    },
    {
      label: 'Announcements',
      href: '/announcements',
      icon: Megaphone,
      roles: ['ADMIN', 'COORDINATOR', 'CANDIDATE'],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['ADMIN', 'COORDINATOR'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'COORDINATOR', 'CANDIDATE'],
    },
  ];

  // Filter items by role
  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={cn(styles.sidebar, isCollapsed && styles.collapsed)}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <span className={styles.logoIcon}>T</span>
          <span className={cn(styles.logoText, isCollapsed && styles.hidden)}>
            TCS Selects
          </span>
        </div>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.list}>
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(styles.link, isActive && styles.active)}
                >
                  <Icon size={20} className={styles.icon} />
                  <span className={cn(styles.label, isCollapsed && styles.hidden)}>
                    {item.label}
                  </span>
                  {isActive && <div className={styles.activeIndicator} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <UserIcon size={18} />
          </div>
          <div className={cn(styles.profileDetails, isCollapsed && styles.hidden)}>
            <div className={styles.profileName}>{session?.user?.name || 'Guest'}</div>
            <div className={styles.profileRole}>{role.toLowerCase()}</div>
          </div>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Logout"
        >
          <LogOut size={20} />
          <span className={cn(styles.logoutLabel, isCollapsed && styles.hidden)}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
};
