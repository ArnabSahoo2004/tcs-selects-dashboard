// src/app/api/candidates/claim/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper to mask emails (e.g., john.doe@gmail.com -> j***e@gmail.com)
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local.charAt(0)}***@${domain}`;
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}

// GET: Search for a candidate Reference ID or Name to claim
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim().toUpperCase();

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    // Search by exact CT/DT ID or partial Name match
    const candidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { referenceId: { equals: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: 10 // limit results
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No candidate found. Please verify your ID or Name.',
        },
        { status: 404 }
      );
    }

    // Since they can search by name, return a list
    const results = candidates.map(candidate => {
      const isClaimed = candidate.claimStatus === 'CLAIMED' || candidate.userId;
      return {
        id: candidate.id,
        referenceId: candidate.referenceId,
        name: candidate.name,
        selectedRole: candidate.selectedRole,
        isClaimed: isClaimed,
        maskedEmail: isClaimed && candidate.user?.email ? maskEmail(candidate.user.email) : null
      };
    });

    return NextResponse.json({
      success: true,
      candidates: results,
    });
  } catch (error: unknown) {
    console.error('Error fetching candidate for claim:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Register user and claim Candidate ID
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referenceId, email, password } = body;

    if (!referenceId || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const upperRefId = referenceId.trim().toUpperCase();

    // 1. Verify candidate exists and is unclaimed
    const candidate = await prisma.candidate.findUnique({
      where: { referenceId: upperRefId },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    if (candidate.claimStatus === 'CLAIMED' || candidate.userId) {
      return NextResponse.json(
        { success: false, error: 'This candidate ID has already been claimed.' },
        { status: 400 }
      );
    }

    // 2. Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // 3. Hash password and create User
    const passwordHash = await bcrypt.hash(password, 12);
    
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: trimmedEmail,
          passwordHash,
        },
      });

      await tx.candidate.update({
        where: { id: candidate.id },
        data: {
          userId: user.id,
          claimStatus: 'CLAIMED',
        },
      });

      return { user };
    });

    return NextResponse.json({
      success: true,
      message: 'Account claimed and registered successfully.',
    });
  } catch (error: unknown) {
    console.error('Error claiming candidate ID:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
