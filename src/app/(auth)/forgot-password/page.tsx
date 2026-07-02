// src/app/(auth)/forgot-password/page.tsx
'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import styles from './ForgotPassword.module.css';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Pre-fill email from query param if available
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    setIsSent(true);
  };

  return (
    <Card hoverable={false} glass={true}>
      <CardHeader className={styles.headerRow}>
        <Link href="/login" className={styles.backBtn} aria-label="Back to login">
          <ArrowLeft size={16} />
        </Link>
        <div className={styles.headerDetails}>
          <h2 className={styles.title}>Reset Password</h2>
          <p className={styles.subtitle}>Recover your account access credentials</p>
        </div>
      </CardHeader>

      <CardContent>
        {!isSent ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.infoText}>
              Enter your registered email address below, and we will send you instructions to reset your password.
            </p>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" isLoading={isLoading} className={styles.submitBtn}>
              <Mail size={16} style={{ marginRight: '8px' }} />
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className={styles.successScreen}>
            <CheckCircle2 className={styles.successIcon} size={48} />
            <h3 className={styles.successHeading}>Check Your Email</h3>
            <p className={styles.successMessage}>
              If an account with email <strong>{email}</strong> exists, you will receive a password reset link shortly.
            </p>
            <Link href="/login" style={{ width: '100%' }}>
              <Button className={styles.submitBtn}>
                Back to Login
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <Card hoverable={false} glass={true}>
        <CardContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        </CardContent>
      </Card>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
