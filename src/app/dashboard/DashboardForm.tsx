'use client';

import { useState } from 'react';
import { updateCandidateDetails } from './actions';

import { useRouter } from 'next/navigation';

export default function DashboardForm({ candidate }: { candidate: Record<string, unknown> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const [joiningDate, setJoiningDate] = useState(formatDate(candidate.joiningDate as Date));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      await updateCandidateDetails(formData);
      setMessage('Details updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch {
      setMessage('Failed to update details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--tcs-card)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.5rem', color: 'var(--tcs-text)' }}>Update Your Offer Status</h2>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: message.includes('success') ? '#dcfce7' : '#fee2e2', color: message.includes('success') ? '#166534' : '#991b1b' }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>Campus Type</label>
        <select name="campusType" defaultValue={(candidate.campusType as string) || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }}>
          <option value="">Select Option</option>
          <option value="On Campus">On Campus</option>
          <option value="Off Campus">Off Campus</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>Date of Offer Letter</label>
        <input type="date" name="offerLetterDate" defaultValue={formatDate(candidate.offerLetterDate as Date)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>Date of JRS</label>
        <input type="date" name="jrsDate" defaultValue={formatDate(candidate.jrsDate as Date)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>Date of Joining Letter</label>
        <input 
          type="date" 
          name="joiningDate" 
          value={joiningDate}
          onChange={(e) => setJoiningDate(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} 
        />
      </div>

      {joiningDate && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderLeft: '4px solid #477AC6', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>Assigned Location</label>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>Since you have received your joining letter, please mention the location you were assigned to.</p>
          <input type="text" name="assignedLocation" placeholder="e.g. Pune, Mumbai, Bangalore" defaultValue={candidate.assignedLocation as string || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--tcs-text)', marginBottom: '1rem' }}>Location Preferences</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Enter the 3 location preferences you provided during the selection process.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>Preference 1</label>
            <input type="text" name="prefLocation1" defaultValue={candidate.prefLocation1 as string || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>Preference 2</label>
            <input type="text" name="prefLocation2" defaultValue={candidate.prefLocation2 as string || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)', fontSize: '0.9rem' }}>Preference 3</label>
            <input type="text" name="prefLocation3" defaultValue={candidate.prefLocation3 as string || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>ILP Attempted (Count)</label>
        <input type="number" name="ilpAttempted" defaultValue={candidate.ilpAttempted as number} min="0" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: 'var(--tcs-text)', background: 'var(--tcs-card)' }} />
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" name="bgcStarted" id="bgcStarted" defaultChecked={candidate.bgcStarted as boolean} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
        <label htmlFor="bgcStarted" style={{ fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>BGC Started?</label>
      </div>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: '#f97316', color: 'var(--tcs-card)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Saving...' : 'Submit / Update'}
      </button>
    </form>
  );
}
