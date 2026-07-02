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

// GET: Search for a candidate Reference ID to claim
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const referenceId = searchParams.get('referenceId')?.trim().toUpperCase();

  if (!referenceId) {
    return NextResponse.json(
      { success: false, error: 'Reference ID is required' },
      { status: 400 }
    );
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { referenceId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        {
          success: false,
          error: 'No candidate found with this Reference ID. Please contact your administrator or verify your ID.',
        },
        { status: 404 }
      );
    }

    if (candidate.claimStatus === 'CLAIMED' || candidate.userId) {
      const maskedEmail = candidate.user?.email ? maskEmail(candidate.user.email) : 'another account';
      return NextResponse.json({
        success: true,
        claimed: true,
        candidate: {
          id: candidate.id,
          referenceId: candidate.referenceId,
          name: candidate.name,
        },
        maskedEmail,
      });
    }

    return NextResponse.json({
      success: true,
      claimed: false,
      candidate: {
        id: candidate.id,
        referenceId: candidate.referenceId,
        name: candidate.name,
        qualification: candidate.qualification,
        specialization: candidate.specialization,
        selectedRole: candidate.selectedRole,
      },
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

    // 3. Hash password and create User (as candidate role)
    const passwordHash = await bcrypt.hash(password, 12);
    
    // We run in a transaction to ensure both user creation and candidate updating succeed
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: trimmedEmail,
          passwordHash,
          name: candidate.name,
          role: 'CANDIDATE',
          isActive: true,
        },
      });

      const updatedCandidate = await tx.candidate.update({
        where: { id: candidate.id },
        data: {
          userId: user.id,
          claimStatus: 'CLAIMED',
        },
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CANDIDATE_CLAIMED',
          entityType: 'Candidate',
          entityId: candidate.id,
          details: JSON.stringify({ referenceId: upperRefId, email: trimmedEmail }),
        },
      });

      // Create initial notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Account Registered',
          message: 'Welcome! Your candidate ID has been claimed successfully. You can now track your onboarding progress.',
          type: 'SYSTEM',
          actionUrl: '/overview',
        },
      });

      return { user, candidate: updatedCandidate };
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
