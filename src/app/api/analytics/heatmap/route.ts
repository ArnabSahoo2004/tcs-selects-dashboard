// src/app/api/analytics/heatmap/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CandidateStatus } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 403 }
    );
  }

  try {
    // 1. Fetch milestone definitions
    const definitions = await prisma.milestoneDefinition.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // 2. Fetch all active candidates and their milestone status rows
    const candidates = await prisma.candidate.findMany({
      where: {
        overallStatus: {
          not: CandidateStatus.WITHDRAWN,
        },
      },
      select: {
        id: true,
        referenceId: true,
        name: true,
        selectedRole: true,
        currentStage: true,
        milestones: {
          select: {
            milestoneId: true,
            status: true,
            notes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        definitions,
        candidates,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching progress heatmap grid:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
