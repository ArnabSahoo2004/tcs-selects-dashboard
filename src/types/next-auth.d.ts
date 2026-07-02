// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      candidateId: string | null;
      referenceId: string | null;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string;
    candidateId: string | null;
    referenceId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    candidateId: string | null;
    referenceId: string | null;
  }
}
