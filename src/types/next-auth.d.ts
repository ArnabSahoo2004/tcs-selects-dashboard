// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      candidateId: string | null;
      referenceId: string | null;
      isAdmin?: boolean;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    candidateId: string | null;
    referenceId: string | null;
    isAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    candidateId: string | null;
    referenceId: string | null;
    isAdmin?: boolean;
  }
}
