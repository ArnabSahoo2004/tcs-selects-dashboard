import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DashboardForm from '../DashboardForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Update Status - TCS Selects',
};

export default async function UpdateStatusPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidate: true }
  });

  if (!user?.candidate) {
    return (
      <div style={{ padding: '2rem', background: 'var(--tcs-card)', borderRadius: '12px' }}>
        <h2>No Candidate Profile Found</h2>
        <p>Your account is not linked to a candidate ID. Please contact support.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard" style={{ color: '#477AC6', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          &larr; Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--tcs-text)' }}>Update Your Details</h1>
        <p style={{ color: 'var(--tcs-text-secondary)' }}>Fill out or modify your current TCS selection timeline below.</p>
      </div>

      <DashboardForm candidate={user.candidate} />
    </div>
  );
}
