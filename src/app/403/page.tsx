// src/app/403/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Denied (403) — TCS Selects',
  description: 'You do not have permission to access this resource.',
};

export default function Forbidden() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      textAlign: 'center',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--color-error)', fontFamily: 'var(--font-heading)' }}>403</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Access Denied</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '30px', maxWidth: '400px' }}>
        You do not have the necessary permissions to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <Link href="/overview" style={{
        padding: '12px 24px',
        backgroundColor: 'var(--color-primary-500)',
        color: '#ffffff',
        borderRadius: 'var(--radius-md)',
        fontWeight: '600',
        transition: 'var(--transition-fast)',
      }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
