// src/app/(auth)/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import styles from './Login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card hoverable={false} glass={true}>
      <CardHeader className={styles.header}>
        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Sign in to track your onboarding progress</p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@tcs-selects.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <div className={styles.passwordContainer}>
            <div className={styles.passwordLabelRow}>
              <label className={styles.passwordLabel}>Password</label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" isLoading={isLoading} className={styles.submitBtn}>
            Sign In
          </Button>
        </form>
        <div className={styles.footerLink}>
          New candidate?{' '}
          <Link href="/register" className={styles.claimLink}>
            Claim Your ID
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card hoverable={false} glass={true}>
        <CardContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        </CardContent>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
