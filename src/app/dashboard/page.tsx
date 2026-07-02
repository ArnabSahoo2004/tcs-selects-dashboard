import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DashboardForm from './DashboardForm';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidate: true }
  });

  if (!user?.candidate) {
    return (
      <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px' }}>
        <h2>No Candidate Profile Found</h2>
        <p>Your account is not linked to a candidate ID. Please contact support.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>Welcome, {user.candidate.name}</h1>
        <p style={{ color: '#666' }}>{user.candidate.referenceId} &middot; {user.candidate.selectedRole}</p>
      </div>

      <DashboardForm candidate={user.candidate} />
    </div>
  );
}
