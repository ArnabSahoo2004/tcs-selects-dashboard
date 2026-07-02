// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import AuthContext from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: 'TCS Selects — Candidate Master Dashboard',
  description: 'Manage and track TCS selected candidates milestones, background checks, and onboarding verification.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthContext>
              {children}
            </AuthContext>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
