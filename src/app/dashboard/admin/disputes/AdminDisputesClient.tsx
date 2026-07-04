'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/components/ui/Table/Table.module.css';
import pageStyles from '@/app/page.module.css';

type DisputeWithCandidate = {
  id: string;
  candidateId: string;
  claimantEmail: string;
  reason: string;
  status: string;
  candidateRefId: string;
  candidateName: string;
};

export default function AdminDisputesClient({ initialDisputes }: { initialDisputes: DisputeWithCandidate[] }) {
  const router = useRouter();
  const [disputes, setDisputes] = useState(initialDisputes);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResolve = async (ticketId: string, action: 'APPROVE' | 'REJECT') => {
    setLoadingId(ticketId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Dispute ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        setDisputes(disputes.filter((d) => d.id !== ticketId));
        router.refresh();
      } else {
        setError(data.error || 'Failed to resolve dispute.');
      }
    } catch {
      setError('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}

      {disputes.length === 0 ? (
        <p style={{ color: 'var(--tcs-text-secondary)' }}>No open disputes found.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Name</th>
                <th>Claimant Email</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td>{dispute.candidateRefId}</td>
                  <td>{dispute.candidateName}</td>
                  <td>{dispute.claimantEmail}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {dispute.reason}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleResolve(dispute.id, 'APPROVE')}
                        disabled={loadingId === dispute.id}
                        className={pageStyles.submitBtn}
                        style={{ padding: '0.5rem', marginTop: 0, width: 'auto' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolve(dispute.id, 'REJECT')}
                        disabled={loadingId === dispute.id}
                        style={{
                          background: 'none',
                          border: '1px solid var(--tcs-border)',
                          color: 'var(--tcs-text)',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
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
