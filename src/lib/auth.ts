// src/lib/auth.ts
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { candidate: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error('No account found with this email');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Incorrect password');
        }

        const isAdmin = user.email.toLowerCase() === 'arnabsahoo27@gmail.com';

        return {
          id: user.id,
          email: user.email,
          name: user.candidate?.name || 'Candidate',
          candidateId: user.candidate?.id || null,
          referenceId: user.candidate?.referenceId || null,
          isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.candidateId = user.candidateId;
        token.referenceId = user.referenceId;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          candidateId: token.candidateId,
          referenceId: token.referenceId,
          isAdmin: token.isAdmin,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'tcs-selects-super-secret-key-12345',
};
