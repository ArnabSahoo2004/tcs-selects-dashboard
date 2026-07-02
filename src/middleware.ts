// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If not logged in, withAuth handles redirect to signIn page
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role;

    // Admin-only subroutes (e.g. settings/users or settings/milestones)
    if (path.startsWith('/settings/users') || path.startsWith('/settings/milestones')) {
      if (role !== 'ADMIN') {
        return NextResponse.rewrite(new URL('/403', req.url)); // Forbidden page
      }
    }

    // Admin and Coordinator-only pages
    if (path.startsWith('/candidates/import')) {
      if (role !== 'ADMIN' && role !== 'COORDINATOR') {
        return NextResponse.redirect(new URL('/overview', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Match all dashboard frontend routes
export const config = {
  matcher: [
    '/overview/:path*',
    '/candidates/:path*',
    '/milestones/:path*',
    '/checklist/:path*',
    '/announcements/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/notifications/:path*',
  ],
};
