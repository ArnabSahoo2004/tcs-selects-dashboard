import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminDisputesClient from './AdminDisputesClient';

export const metadata = {
  title: 'Admin - Disputes | TCS Selects Dashboard',
};

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.isAdmin) {
    redirect('/dashboard');
  }

  const tickets = await prisma.disputeTicket.findMany({
    where: { status: 'OPEN' },
    orderBy: { id: 'desc' }, // newest first
  });

  const candidateIds = tickets.map((t) => t.candidateId);

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, referenceId: true, name: true },
  });

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  const initialDisputes = tickets.map((ticket) => {
    const c = candidateMap.get(ticket.candidateId);
    return {
      id: ticket.id,
      candidateId: ticket.candidateId,
      claimantEmail: ticket.claimantEmail,
      reason: ticket.reason,
      status: ticket.status,
      candidateRefId: c?.referenceId || 'Unknown',
      candidateName: c?.name || 'Unknown',
    };
  });

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Disputes</h1>
      <p style={{ color: 'var(--tcs-text-secondary)', marginBottom: '2rem' }}>
        Review and resolve claims where a candidate ID was falsely claimed.
      </p>

      <AdminDisputesClient initialDisputes={initialDisputes} />
    </div>
  );
}
