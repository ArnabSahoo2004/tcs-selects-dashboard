import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import styles from '@/components/ui/Table/Table.module.css';

export const metadata = {
  title: 'Admin - All Claims | TCS Selects Dashboard',
};

export default async function AdminClaimsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.isAdmin) {
    redirect('/dashboard');
  }

  // Fetch all claimed or disputed candidates
  const candidates = await prisma.candidate.findMany({
    where: { 
      claimStatus: { not: 'UNCLAIMED' }
    },
    include: {
      user: true
    },
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>All Claimed Profiles</h1>
      <p style={{ color: 'var(--tcs-text-secondary)', marginBottom: '2rem' }}>
        A global view of every CT/DT ID that has been claimed by a user.
      </p>

      {candidates.length === 0 ? (
        <p style={{ color: 'var(--tcs-text-secondary)' }}>No profiles have been claimed yet.</p>
      ) : (
        <div className={styles.container}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr className={styles.tr}>
                <th className={styles.th}>Candidate ID</th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Claimed By (Email)</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className={styles.tr}>
                  <td className={styles.td}><strong>{candidate.referenceId}</strong></td>
                  <td className={styles.td}>{candidate.name}</td>
                  <td className={styles.td}>{candidate.selectedRole}</td>
                  <td className={styles.td} style={{ color: candidate.user?.email ? 'inherit' : 'var(--tcs-text-secondary)' }}>
                    {candidate.user?.email || 'N/A (Unlinked)'}
                  </td>
                  <td className={styles.td}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: candidate.claimStatus === 'DISPUTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(71, 122, 198, 0.1)',
                        color: candidate.claimStatus === 'DISPUTED' ? '#EF4444' : '#477AC6'
                      }}
                    >
                      {candidate.claimStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
