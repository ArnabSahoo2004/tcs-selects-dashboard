// src/app/(auth)/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Search, ShieldAlert, ArrowLeft, CheckCircle2, Ticket } from 'lucide-react';
import styles from './Register.module.css';

type RegisterStep = 'SEARCH' | 'VERIFY_AND_CLAIM' | 'ALREADY_CLAIMED' | 'DISPUTE' | 'SUCCESS';

interface CandidateInfo {
  id: string;
  referenceId: string;
  name: string;
  qualification?: string;
  specialization?: string;
  selectedRole?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<RegisterStep>('SEARCH');
  const [searchId, setSearchId] = useState('');
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  
  // Registration form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Dispute form state
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Search Reference ID
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/candidates/claim?referenceId=${encodeURIComponent(searchId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to find Reference ID');
      }

      setCandidate(data.candidate);

      if (data.claimed) {
        setMaskedEmail(data.maskedEmail);
        setStep('ALREADY_CLAIMED');
      } else {
        setStep('VERIFY_AND_CLAIM');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Claim & Register Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/candidates/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: candidate.referenceId,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg('Account registered successfully! You can now sign in to your dashboard.');
      setStep('SUCCESS');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Raise a Dispute
  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/candidates/claim/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          claimantName,
          claimantEmail,
          reason: disputeReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Dispute ticket creation failed');
      }

      setSuccessMsg('Dispute ticket raised! Administrators will review your request and get back to you within 24 hours.');
      setStep('SUCCESS');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('SEARCH');
    setSearchId('');
    setCandidate(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setClaimantName('');
    setClaimantEmail('');
    setDisputeReason('');
    setError(null);
  };

  return (
    <Card hoverable={false} glass={true}>
      {/* HEADER RENDERING */}
      {step === 'SEARCH' && (
        <CardHeader className={styles.header}>
          <h2 className={styles.title}>Find My Offer</h2>
          <p className={styles.subtitle}>Enter your CT/DT Reference ID to claim your profile</p>
        </CardHeader>
      )}

      {step === 'VERIFY_AND_CLAIM' && (
        <CardHeader className={styles.headerRow}>
          <button className={styles.backBtn} onClick={() => setStep('SEARCH')}>
            <ArrowLeft size={16} />
          </button>
          <div className={styles.headerDetails}>
            <h2 className={styles.title}>Verify & Register</h2>
            <p className={styles.subtitle}>Step 2 of 2: Create your account</p>
          </div>
        </CardHeader>
      )}

      {step === 'ALREADY_CLAIMED' && (
        <CardHeader className={styles.headerRow}>
          <button className={styles.backBtn} onClick={resetForm}>
            <ArrowLeft size={16} />
          </button>
          <div className={styles.headerDetails}>
            <h2 className={styles.title}>ID Already Claimed</h2>
            <p className={styles.subtitle}>This profile is linked to an account</p>
          </div>
        </CardHeader>
      )}

      {step === 'DISPUTE' && (
        <CardHeader className={styles.headerRow}>
          <button className={styles.backBtn} onClick={() => setStep('ALREADY_CLAIMED')}>
            <ArrowLeft size={16} />
          </button>
          <div className={styles.headerDetails}>
            <h2 className={styles.title}>Raise Claim Dispute</h2>
            <p className={styles.subtitle}>Request administrators to audit this ID claim</p>
          </div>
        </CardHeader>
      )}

      {/* CONTENT RENDERING */}
      <CardContent>
        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        {/* STEP 1: SEARCH */}
        {step === 'SEARCH' && (
          <form onSubmit={handleSearch} className={styles.form}>
            <Input
              label="TCS Reference ID"
              placeholder="e.g. DT2023XXXXXXXX or CT2025XXXXXXXX"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" isLoading={isLoading} className={styles.submitBtn}>
              <Search size={16} style={{ marginRight: '8px' }} />
              Find Profile
            </Button>
            <div className={styles.footerLink}>
              Already claimed?{' '}
              <Link href="/login" className={styles.loginLink}>
                Sign In
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY AND CLAIM */}
        {step === 'VERIFY_AND_CLAIM' && candidate && (
          <div className={styles.wizard}>
            {/* Identity details validation block */}
            <div className={styles.identityCard}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Name:</span>
                <span className={styles.metaValue}>{candidate.name}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>ID:</span>
                <span className={styles.metaValue}>{candidate.referenceId}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Offer:</span>
                <span className={styles.metaValueRole}>{candidate.selectedRole}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Branch:</span>
                <span className={styles.metaValue}>{candidate.specialization}</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className={styles.form}>
              <Input
                label="Create Email Username"
                type="email"
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                helperText="This email will be used for dashboard login credentials."
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button type="submit" isLoading={isLoading} className={styles.submitBtn}>
                Claim Profile & Register
              </Button>
            </form>
          </div>
        )}

        {/* STEP 3: ALREADY CLAIMED */}
        {step === 'ALREADY_CLAIMED' && candidate && (
          <div className={styles.wizard}>
            <div className={styles.infoBox}>
              <ShieldAlert className={styles.warningIcon} size={28} />
              <div className={styles.infoText}>
                The candidate profile for <strong>{candidate.name}</strong> ({candidate.referenceId}) is already linked to:
                <div className={styles.maskedEmailBlock}>{maskedEmail}</div>
              </div>
            </div>

            <div className={styles.actionColumn}>
              <Link href={`/forgot-password?email=${encodeURIComponent(maskedEmail)}`} className={styles.btnLinkSecondary}>
                That is my email, reset password
              </Link>
              <div className={styles.dividerRow}>
                <span>OR</span>
              </div>
              <Button variant="secondary" onClick={() => setStep('DISPUTE')} className={styles.disputeBtn}>
                <Ticket size={16} style={{ marginRight: '8px' }} />
                This is not my email — Dispute Claim
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: DISPUTE FORM */}
        {step === 'DISPUTE' && candidate && (
          <form onSubmit={handleDispute} className={styles.form}>
            <div className={styles.miniLabel}>
              Disputing ID Claim for: <strong>{candidate.name} ({candidate.referenceId})</strong>
            </div>
            <Input
              label="Your Real Name"
              placeholder="e.g. John Doe"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              label="Contact Email Address"
              type="email"
              placeholder="your.email@domain.com"
              value={claimantEmail}
              onChange={(e) => setClaimantEmail(e.target.value)}
              required
              disabled={isLoading}
              helperText="Coordination team will reach out to this email."
            />
            <div className={styles.textareaWrapper}>
              <label className={styles.textareaLabel}>Reason for Dispute / Proof details</label>
              <textarea
                className={styles.textarea}
                placeholder="Please state how this ID belongs to you (e.g. upload link of your selection mail, details of college registration number, etc.)"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                required
                disabled={isLoading}
                rows={4}
              />
            </div>
            <Button type="submit" variant="danger" isLoading={isLoading} className={styles.submitBtn}>
              Submit Dispute Ticket
            </Button>
          </form>
        )}

        {/* STEP 5: SUCCESS STATE */}
        {step === 'SUCCESS' && (
          <div className={styles.successScreen}>
            <CheckCircle2 className={styles.successIcon} size={48} />
            <h3 className={styles.successHeading}>Operation Successful</h3>
            <p className={styles.successMessage}>{successMsg}</p>
            <Button onClick={() => router.push('/login')} className={styles.backToLoginBtn}>
              Back to Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
