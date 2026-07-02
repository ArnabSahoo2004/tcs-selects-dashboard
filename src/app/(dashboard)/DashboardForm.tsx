'use client';

import { useState } from 'react';
import { updateCandidateDetails } from './actions';

export default function DashboardForm({ candidate }: { candidate: Record<string, unknown> }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      await updateCandidateDetails(formData);
      setMessage('Details updated successfully!');
    } catch {
      setMessage('Failed to update details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.5rem', color: '#111' }}>Update Your Offer Status</h2>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: message.includes('success') ? '#dcfce7' : '#fee2e2', color: message.includes('success') ? '#166534' : '#991b1b' }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>Campus Type</label>
        <select name="campusType" defaultValue={candidate.campusType || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: '#111', background: '#fff' }}>
          <option value="">Select Option</option>
          <option value="On Campus">On Campus</option>
          <option value="Off Campus">Off Campus</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>Date of Offer Letter</label>
        <input type="date" name="offerLetterDate" defaultValue={formatDate(candidate.offerLetterDate as Date)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: '#111', background: '#fff' }} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>Date of JRS</label>
        <input type="date" name="jrsDate" defaultValue={formatDate(candidate.jrsDate as Date)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: '#111', background: '#fff' }} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>Date of Joining Letter</label>
        <input type="date" name="joiningDate" defaultValue={formatDate(candidate.joiningDate as Date)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: '#111', background: '#fff' }} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>ILP Attempted (Count)</label>
        <input type="number" name="ilpAttempted" defaultValue={candidate.ilpAttempted as number} min="0" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', color: '#111', background: '#fff' }} />
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" name="bgcStarted" id="bgcStarted" defaultChecked={candidate.bgcStarted as boolean} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
        <label htmlFor="bgcStarted" style={{ fontWeight: 600, color: '#333' }}>BGC Started?</label>
      </div>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Saving...' : 'Submit / Update'}
      </button>
    </form>
  );
}
