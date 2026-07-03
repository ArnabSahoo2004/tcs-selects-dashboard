import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import Topbar from '@/components/layout/Topbar/Topbar';
import styles from './layout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className={styles.layoutContainer}>
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>
      <div className={styles.mainWrapper}>
        <Topbar />
        <main className={styles.content}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
