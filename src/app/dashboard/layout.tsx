import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f9fa', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Offer Tracker Dashboard</div>
        <a href="/api/auth/signout" style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 600 }}>Sign Out</a>
      </header>
      <main style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
