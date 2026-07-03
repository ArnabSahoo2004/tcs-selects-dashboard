import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardOverviewPage() {
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
      <div style={{ padding: '2rem', background: 'var(--tcs-card)', borderRadius: '12px' }}>
        <h2>No Candidate Profile Found</h2>
        <p>Your account is not linked to a candidate ID. Please contact support.</p>
      </div>
    );
  }

  const c = user.candidate;

  // SMART CONDITIONAL REDIRECT
  // If they have never filled out their form, force them to do so.
  if (!c.campusType) {
    redirect('/dashboard/update');
  }

  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Pending';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--tcs-text)' }}>Welcome, {c.name}</h1>
          <p style={{ color: 'var(--tcs-text-secondary)' }}>{c.referenceId} &middot; {c.selectedRole}</p>
        </div>
        <Link href="/dashboard/update" style={{ background: '#477AC6', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
          Update Status
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'var(--tcs-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--tcs-border)' }}>
          <h3 style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Campus Type</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tcs-text)' }}>{c.campusType}</div>
        </div>
        <div style={{ background: 'var(--tcs-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--tcs-border)' }}>
          <h3 style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Location Assigned</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tcs-text)' }}>{c.assignedLocation || 'Pending'}</div>
        </div>
        <div style={{ background: 'var(--tcs-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--tcs-border)' }}>
          <h3 style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>ILP Attempts</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tcs-text)' }}>{c.ilpAttempted}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--tcs-text)' }}>Your Progress Journey</h2>
      
      <div style={{ background: 'var(--tcs-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--tcs-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.offerLetterDate ? '#4ade80' : 'var(--tcs-border)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--tcs-text)', fontSize: '1.1rem' }}>Offer Letter Issued</h4>
            <p style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>{formatDate(c.offerLetterDate)}</p>
          </div>
        </div>

        <div style={{ width: '4px', height: '30px', background: 'var(--tcs-border)', marginLeft: '10px' }} />

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.jrsDate ? '#4ade80' : 'var(--tcs-border)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--tcs-text)', fontSize: '1.1rem' }}>JRS Session</h4>
            <p style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>{formatDate(c.jrsDate)}</p>
          </div>
        </div>

        <div style={{ width: '4px', height: '30px', background: 'var(--tcs-border)', marginLeft: '10px' }} />

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.bgcStarted ? '#4ade80' : 'var(--tcs-border)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--tcs-text)', fontSize: '1.1rem' }}>Background Check (BGC)</h4>
            <p style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>{c.bgcStarted ? 'Started' : 'Pending'}</p>
          </div>
        </div>

        <div style={{ width: '4px', height: '30px', background: 'var(--tcs-border)', marginLeft: '10px' }} />

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.joiningDate ? '#477AC6' : 'var(--tcs-border)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--tcs-text)', fontSize: '1.1rem' }}>Joining Letter & Location</h4>
            <p style={{ color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>{formatDate(c.joiningDate)}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
