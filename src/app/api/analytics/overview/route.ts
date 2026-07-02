// src/app/api/analytics/overview/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CandidateStatus } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized session.' },
      { status: 401 }
    );
  }

  try {
    // If Candidate role, return candidate specific overview data
    if (session.user.role === 'CANDIDATE') {
      const candidate = await prisma.candidate.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          checklistItems: {
            orderBy: {
              type: 'asc',
            },
          },
          milestones: {
            include: {
              milestone: true,
            },
            orderBy: {
              milestone: {
                displayOrder: 'asc',
              },
            },
          },
        },
      });

      if (!candidate) {
        return NextResponse.json(
          { success: false, error: 'Candidate profile not found.' },
          { status: 404 }
        );
      }

      // Fetch announcements
      const announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { targetRoles: null },
            { targetRoles: { contains: 'CANDIDATE' } },
          ],
        },
        orderBy: [
          { isPinned: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: 5,
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
      });

      // Compute dynamic at-risk property
      const currentMs = candidate.milestones.find((m) => m.milestone.stage === candidate.currentStage);
      let daysInStage = 0;
      let isAtRisk = false;

      if (currentMs) {
        const lastUpdated = currentMs.updatedAt || currentMs.createdAt;
        daysInStage = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        const deadline = currentMs.milestone.deadlineDays ?? 14;
        isAtRisk = daysInStage > deadline && !['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(currentMs.status);
      }

      return NextResponse.json({
        success: true,
        isCandidate: true,
        data: {
          candidate: {
            ...candidate,
            daysInStage,
            isAtRisk,
          },
          announcements,
        },
      });
    }

    // 1. Fetch Candidate counts by Status
    const statusCounts = await prisma.candidate.groupBy({
      by: ['overallStatus'],
      _count: { id: true },
    });

    const statusMap = {
      ACTIVE: 0,
      DEFERRED: 0,
      WITHDRAWN: 0,
      JOINED: 0,
      NO_SHOW: 0,
    };

    statusCounts.forEach((c) => {
      statusMap[c.overallStatus] = c._count.id;
    });

    // 2. Fetch Claim status counts
    const claimCounts = await prisma.candidate.groupBy({
      by: ['claimStatus'],
      _count: { id: true },
    });

    const claimMap = {
      UNCLAIMED: 0,
      CLAIMED: 0,
      DISPUTED: 0,
    };

    claimCounts.forEach((c) => {
      claimMap[c.claimStatus] = c._count.id;
    });

    // 3. Fetch Selected offer roles distribution
    const roleCounts = await prisma.candidate.groupBy({
      by: ['selectedRole'],
      _count: { id: true },
    });

    const roleMap = {
      NINJA: 0,
      DIGITAL: 0,
      PRIME: 0,
      OTHER: 0,
    };

    roleCounts.forEach((c) => {
      roleMap[c.selectedRole] = c._count.id;
    });

    // 4. Fetch Candidates count grouped by current stage
    const stageCounts = await prisma.candidate.groupBy({
      by: ['currentStage'],
      _count: { id: true },
      where: {
        overallStatus: {
          not: CandidateStatus.WITHDRAWN,
        },
      },
    });

    const stageMap: Record<string, number> = {};
    stageCounts.forEach((c) => {
      if (c.currentStage) {
        stageMap[c.currentStage] = c._count.id;
      }
    });

    // 5. Fetch all active candidates with milestones to dynamically calculate at-risk count
    const activeCandidates = await prisma.candidate.findMany({
      where: {
        overallStatus: {
          not: CandidateStatus.WITHDRAWN,
        },
      },
      include: {
        milestones: {
          include: {
            milestone: true,
          },
        },
      },
    });

    let atRiskCount = 0;
    activeCandidates.forEach((cand) => {
      const currentMs = cand.milestones.find((m) => m.milestone.stage === cand.currentStage);
      if (currentMs) {
        const lastUpdated = currentMs.updatedAt || currentMs.createdAt;
        const daysInStage = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        const deadline = currentMs.milestone.deadlineDays ?? 14;
        const isAtRisk = daysInStage > deadline && !['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(currentMs.status);
        if (isAtRisk) {
          atRiskCount++;
        }
      }
    });

    // 6. Fetch active dispute tickets count
    const openDisputes = await prisma.disputeTicket.count({
      where: {
        status: 'OPEN',
      },
    });

    // 7. Fetch recent audit logs (last 6 items)
    const recentLogs = await prisma.auditLog.findMany({
      take: 6,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // 8. Fetch upcoming joining dates for charts
    const joiningDates = await prisma.candidate.findMany({
      where: {
        joiningDate: {
          not: null,
        },
        overallStatus: {
          not: CandidateStatus.WITHDRAWN,
        },
      },
      select: {
        joiningDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        status: statusMap,
        claims: claimMap,
        roles: roleMap,
        stages: stageMap,
        atRiskCount,
        openDisputes,
        recentLogs,
        joiningDates,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard overview stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
