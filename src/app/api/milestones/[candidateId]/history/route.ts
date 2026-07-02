// src/app/api/milestones/[candidateId]/history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Retrieve audit trail history for candidate milestones
export async function GET(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions);
  const candidateId = params.candidateId;

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized session.' },
      { status: 401 }
    );
  }

  // Auth check: Candidate can only view their own history
  if (session.user.role === 'CANDIDATE' && session.user.candidateId !== candidateId) {
    return NextResponse.json(
      { success: false, error: 'Access denied. You can only view your own milestone history.' },
      { status: 403 }
    );
  }

  try {
    const history = await prisma.milestoneHistory.findMany({
      where: {
        candidateMilestone: {
          candidateId,
        },
      },
      include: {
        candidateMilestone: {
          include: {
            milestone: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });

    // Fetch user details for each history record
    // Since MilestoneHistory changedBy stores user ID, let's fetch names in memory or query them.
    const userIds = Array.from(new Set(history.map((h) => h.changedBy)));
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedHistory = history.map((h) => {
      const changer = userMap.get(h.changedBy);
      return {
        id: h.id,
        milestoneName: h.candidateMilestone.milestone.name,
        milestoneStage: h.candidateMilestone.milestone.stage,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        notes: h.notes,
        changedAt: h.changedAt,
        changedBy: changer
          ? {
              name: changer.name,
              role: changer.role,
            }
          : {
              name: 'System / Candidate',
              role: 'SYSTEM',
            },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedHistory,
    });
  } catch (error: unknown) {
    console.error('Error fetching milestone history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
