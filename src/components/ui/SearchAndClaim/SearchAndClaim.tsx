'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';
import { signIn } from 'next-auth/react';

type CandidateResult = {
  id: string;
  referenceId: string;
  name: string;
  selectedRole: string;
  isClaimed: boolean;
  maskedEmail: string | null;
};

export default function SearchAndClaim() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOffCampusModalOpen, setIsOffCampusModalOpen] = useState(false);

  // Claim/Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Off-Campus form
  const [ocName, setOcName] = useState('');
  const [ocRefId, setOcRefId] = useState('');
  const [ocRole, setOcRole] = useState('NINJA');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setError('');
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/candidates/claim?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.candidates);
      } else {
        setResults([]);
        setError(data.error || 'No candidates found.');
      }
    } catch {
      setResults([]);
      setError('An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      performSearch(query);
    }
  };

  const openClaimModal = (candidate: CandidateResult) => {
    setSelectedCandidate(candidate);
    setEmail('');
    setPassword('');
    setFormError('');
    setFormSuccess('');
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setEmail('');
    setPassword('');
    setFormError('');
  };

  const openOffCampusModal = () => {
    setIsOffCampusModalOpen(true);
    setEmail('');
    setPassword('');
    setOcName('');
    setOcRefId('');
    setOcRole('NINJA');
    setFormError('');
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setFormLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/candidates/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: selectedCandidate.referenceId,
          email,
          password
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess('Account successfully claimed! Logging you in...');
        
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.error) {
          setFormError('Claimed, but auto-login failed. Please login manually.');
        } else {
          router.push('/dashboard');
        }
      } else {
        setFormError(data.error || 'Failed to claim account.');
      }
    } catch {
      setFormError('An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOffCampusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/candidates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ocName,
          referenceId: ocRefId,
          selectedRole: ocRole,
          email,
          password
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess('Off-Campus profile created! Logging you in...');
        
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.error) {
          setFormError('Created, but auto-login failed. Please login manually.');
        } else {
          router.push('/dashboard');
        }
      } else {
        setFormError(data.error || 'Failed to create profile.');
      }
    } catch {
      setFormError('An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setFormError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setFormError('An error occurred during login.');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModals = () => {
    setSelectedCandidate(null);
    setIsLoginModalOpen(false);
    setIsOffCampusModalOpen(false);
  };

  return (
    <>

      <div className={styles.hero} style={{ marginTop: '3rem' }}>
        <h2>Find or Add your Offer</h2>
        <p>Search by your Name or CT/DT ID to claim your profile.</p>
      </div>

      <form className={styles.searchContainer} onSubmit={handleSearch}>
        <input 
          type="text" 
          className={styles.searchInput} 
          placeholder="Search name, CT/DT ID..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          onClick={openOffCampusModal}
          style={{ background: 'none', border: 'none', color: '#477AC6', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Are you an off-campus hire? Click here to add your profile.
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', marginTop: '1rem' }}>Searching...</p>}
      {error && <p className={styles.error} style={{ textAlign: 'center', marginTop: '1rem' }}>{error}</p>}

      {results.length > 0 && (
        <div className={styles.results} style={{ maxWidth: '600px', margin: '2rem auto' }}>
          {results.map((candidate) => (
            <div 
              key={candidate.id} 
              className={styles.resultItem}
              onClick={() => openClaimModal(candidate)}
            >
              <div>
                <div className={styles.resultName}>{candidate.name}</div>
                <div className={styles.resultId}>{candidate.referenceId} &middot; {candidate.selectedRole}</div>
              </div>
              <div>
                {candidate.isClaimed ? (
                  <span className={`${styles.badge} ${styles.badgeClaimed}`}>Claimed</span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeUnclaimed}`}>Available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim / Dispute Modal */}
      {selectedCandidate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={closeModals}>&times;</button>
            <h3 className={styles.modalTitle}>{selectedCandidate.name}</h3>
            <p className={styles.modalDesc}>{selectedCandidate.referenceId} &middot; {selectedCandidate.selectedRole}</p>

            {selectedCandidate.isClaimed ? (
              <div>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  This ID has already been claimed by <strong>{selectedCandidate.maskedEmail}</strong>.
                </p>
                <button 
                  className={styles.submitBtn}
                  onClick={() => {
                    closeModals();
                    router.push('/login');
                  }}
                >
                  Login to this account
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  Set an email and password to claim this profile and update your statuses.
                </p>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Create Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? 'Claiming...' : 'Claim Profile'}
                </button>
                {formError && <div className={styles.error}>{formError}</div>}
                {formSuccess && <div className={styles.success}>{formSuccess}</div>}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Off-Campus Modal */}
      {isOffCampusModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={closeModals}>&times;</button>
            <h3 className={styles.modalTitle}>Add Off-Campus Profile</h3>
            <p className={styles.modalDesc}>Create your profile to start tracking your offer.</p>

            <form onSubmit={handleOffCampusSubmit}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={ocName}
                  onChange={(e) => setOcName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Reference ID (CT/DT ID)</label>
                <input 
                  type="text" 
                  required 
                  value={ocRefId}
                  onChange={(e) => setOcRefId(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Selected Role</label>
                <select value={ocRole} onChange={(e) => setOcRole(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value="NINJA">Ninja</option>
                  <option value="DIGITAL">Digital</option>
                  <option value="PRIME">Prime</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Create Password</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Profile'}
              </button>
              {formError && <div className={styles.error}>{formError}</div>}
              {formSuccess && <div className={styles.success}>{formSuccess}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={closeModals}>&times;</button>
            <h3 className={styles.modalTitle}>Login</h3>
            <p className={styles.modalDesc}>Login to update your offer statuses.</p>

            <form onSubmit={handleLoginSubmit}>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                {formLoading ? 'Logging in...' : 'Login'}
              </button>
              {formError && <div className={styles.error}>{formError}</div>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
