'use client';

import { useState } from 'react';
import { updateCandidateDetails } from './actions';
import { useRouter } from 'next/navigation';

// Official TCS posting locations
const TCS_LOCATIONS = [
  'Ahmedabad',
  'Bangalore',
  'Bhubaneswar',
  'Chennai',
  'Coimbatore',
  'Delhi NCR',
  'Gandhinagar',
  'Gurgaon',
  'Hyderabad',
  'Indore',
  'Jaipur',
  'Kochi',
  'Kolkata',
  'Lucknow',
  'Mumbai',
  'Mysore',
  'Nagpur',
  'Noida',
  'Pune',
  'Thiruvananthapuram',
  'Vadodara',
  'Visakhapatnam',
];

const selectStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--tcs-border)',
  color: 'var(--tcs-text)',
  background: 'var(--tcs-card)',
  fontSize: '0.95rem',
};

const dateStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--tcs-border)',
  color: 'var(--tcs-text)',
  background: 'var(--tcs-card)',
  marginTop: '0.5rem',
  fontSize: '0.95rem',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: 600 as const,
  color: 'var(--tcs-text-secondary)',
};

const fieldStyle = { marginBottom: '1.5rem' };

const hintStyle = {
  fontSize: '0.8rem',
  color: 'var(--tcs-text-secondary)',
  marginTop: '0.35rem',
};

// Reusable Received/Not Received field
function ReceivedField({
  label,
  name,
  hasValue,
  defaultDate,
  hint,
  yesLabel,
  noLabel,
  dateLabel,
  onChange,
}: {
  label: string;
  name: string;
  hasValue: boolean;
  defaultDate: string;
  hint?: string;
  yesLabel?: string;
  noLabel?: string;
  dateLabel?: string;
  onChange?: (received: boolean) => void;
}) {
  const [received, setReceived] = useState(hasValue);

  const handleChange = (val: string) => {
    const isReceived = val === 'yes';
    setReceived(isReceived);
    onChange?.(isReceived);
  };

  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <select
        style={selectStyle}
        value={received ? 'yes' : 'no'}
        onChange={(e) => handleChange(e.target.value)}
        name={`${name}_status`}
      >
        <option value="no">{noLabel || 'Not Received'}</option>
        <option value="yes">{yesLabel || 'Received'}</option>
      </select>
      {hint && <p style={hintStyle}>{hint}</p>}
      {/* Hidden date — sent to server; pre-filled if already set or set to today when toggled on */}
      <input
        type="hidden"
        name={name}
        value={received ? (defaultDate || new Date().toISOString().split('T')[0]) : ''}
      />
    </div>
  );
}

export default function DashboardForm({ candidate }: { candidate: Record<string, unknown> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const [joiningReceived, setJoiningReceived] = useState(!!candidate.joiningDate);

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

      {/* Campus Type */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Campus Type</label>
        <select name="campusType" defaultValue={(candidate.campusType as string) || ''} style={selectStyle}>
          <option value="">Select Option</option>
          <option value="On Campus">On Campus</option>
          <option value="Off Campus">Off Campus</option>
        </select>
      </div>

      {/* Offer Letter */}
      <ReceivedField
        label="Offer Letter"
        name="offerLetterDate"
        hasValue={!!candidate.offerLetterDate}
        defaultDate={formatDate(candidate.offerLetterDate as Date)}
        hint="Have you received your Offer Letter from TCS?"
      />

      {/* JRS Form */}
      <ReceivedField
        label="JRS Form Submitted"
        name="jrsDate"
        hasValue={!!candidate.jrsDate}
        defaultDate={formatDate(candidate.jrsDate as Date)}
        hint="Have you submitted your JRS (Job Readiness Survey) form?"
        yesLabel="Submitted"
        noLabel="Not Submitted"
        dateLabel="Date submitted (optional)"
      />

      {/* Joining Letter */}
      <ReceivedField
        label="Joining Letter"
        name="joiningDate"
        hasValue={!!candidate.joiningDate}
        defaultDate={formatDate(candidate.joiningDate as Date)}
        hint="Have you received your Joining Letter from TCS?"
        onChange={(received) => setJoiningReceived(received)}
      />

      {/* Assigned Location — shown only when joining letter received */}
      {joiningReceived && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(71,122,198,0.06)', borderLeft: '4px solid #477AC6', borderRadius: '4px' }}>
          <label style={labelStyle}>Assigned Location</label>
          <p style={hintStyle}>Since you have received your joining letter, please mention the location you were assigned to.</p>
          <select
            name="assignedLocation"
            defaultValue={(candidate.assignedLocation as string) || ''}
            style={{ ...selectStyle, marginTop: '0.75rem' }}
          >
            <option value="">— Select Assigned City —</option>
            {TCS_LOCATIONS.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      )}

      {/* Location Preferences */}
      <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--tcs-border)', paddingTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--tcs-text)', marginBottom: '0.5rem' }}>Location Preferences</h3>
        <p style={{ ...hintStyle, marginBottom: '1rem' }}>Select the 3 location preferences you provided during the selection process (in order of priority).</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <label style={{ ...labelStyle, fontSize: '0.9rem' }}>Preference {n}</label>
              <select
                name={`prefLocation${n}`}
                defaultValue={(candidate[`prefLocation${n}`] as string) || ''}
                style={selectStyle}
              >
                <option value="">— Select City —</option>
                {TCS_LOCATIONS.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ILP */}
      <div style={fieldStyle}>
        <label style={labelStyle}>ILP Attempted (Count)</label>
        <input
          type="number"
          name="ilpAttempted"
          defaultValue={candidate.ilpAttempted as number}
          min="0"
          style={selectStyle}
        />
      </div>

      {/* BGC */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input
          type="checkbox"
          name="bgcStarted"
          id="bgcStarted"
          defaultChecked={candidate.bgcStarted as boolean}
          style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: '#477AC6' }}
        />
        <label htmlFor="bgcStarted" style={{ fontWeight: 600, color: 'var(--tcs-text-secondary)' }}>BGC Started?</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: '1rem', background: '#477AC6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
      >
        {loading ? 'Saving...' : 'Submit / Update'}
      </button>
    </form>
  );
}
