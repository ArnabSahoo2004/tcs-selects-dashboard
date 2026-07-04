import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
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
            
            <footer className={styles.footer}>
              <div className={styles.disclaimer}>
                <strong>Disclaimer:</strong> This website is an independent student-made project created for educational and tracking purposes only. It is <strong>not affiliated with, endorsed by, authorized by, or in any way officially connected with Tata Consultancy Services (TCS)</strong>, or any of its subsidiaries or its affiliates. The use of the name &quot;TCS&quot; or any related names, marks, emblems, and images is purely for descriptive and identification purposes. No copyright or trademark infringement is intended. All candidate data is self-reported and not officially verified by the company.
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
