// src/app/api/milestones/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MilestoneStatus } from '@prisma/client';

// GET: Retrieve all milestone definitions ordered by displayOrder
export async function GET() {
  try {
    const definitions = await prisma.milestoneDefinition.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: definitions,
    });
  } catch (error: unknown) {
    console.error('Error fetching milestone definitions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update candidate stage from Kanban board (drag-and-drop)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Only coordinators and admins can modify candidate stages.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { candidateId, stage } = body;

    if (!candidateId || !stage) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID and Target Stage are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch Candidate and target Milestone Definition
    const [candidate, targetDef] = await Promise.all([
      prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          milestones: {
            include: {
              milestone: true,
            },
          },
        },
      }),
      prisma.milestoneDefinition.findUnique({
        where: { stage },
      }),
    ]);

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not found.' },
        { status: 404 }
      );
    }

    if (!targetDef) {
      return NextResponse.json(
        { success: false, error: `Invalid milestone stage: ${stage}` },
        { status: 400 }
      );
    }

    const previousStage = candidate.currentStage;

    // 2. Perform updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update candidate's current stage
      const updatedCandidate = await tx.candidate.update({
        where: { id: candidateId },
        data: {
          currentStage: stage,
        },
      });

      // Gather audit notes
      const auditDetails = {
        previousStage,
        newStage: stage,
        updates: [] as Array<{ milestone: string; oldStatus: string; newStatus: string }>,
      };

      // Loop through candidate milestones and advance statuses as needed
      for (const cm of candidate.milestones) {
        const order = cm.milestone.displayOrder;
        let nextStatus: MilestoneStatus | null = null;

        if (order < targetDef.displayOrder) {
          // Preceding milestones should be marked completed
          if (['PENDING', 'IN_PROGRESS'].includes(cm.status)) {
            nextStatus = MilestoneStatus.COMPLETED;
          }
        } else if (order === targetDef.displayOrder) {
          // Target milestone should be marked in progress if pending
          if (cm.status === MilestoneStatus.PENDING) {
            nextStatus = MilestoneStatus.IN_PROGRESS;
          }
        }

        if (nextStatus && nextStatus !== cm.status) {
          const isFinished = ['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(nextStatus);
          
          await tx.candidateMilestone.update({
            where: { id: cm.id },
            data: {
              status: nextStatus,
              completedAt: isFinished ? new Date() : null,
              updatedBy: session.user.id,
            },
          });

          await tx.milestoneHistory.create({
            data: {
              candidateMilestoneId: cm.id,
              previousStatus: cm.status,
              newStatus: nextStatus,
              notes: 'Auto-updated via Kanban board stage movement.',
              changedBy: session.user.id,
            },
          });

          auditDetails.updates.push({
            milestone: cm.milestone.name,
            oldStatus: cm.status,
            newStatus: nextStatus,
          });
        }
      }

      // Record in system audit logs
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'KANBAN_STAGE_MOVED',
          entityType: 'Candidate',
          entityId: candidateId,
          details: JSON.stringify(auditDetails),
        },
      });

      // Send in-app notification if claimed
      if (candidate.userId) {
        await tx.notification.create({
          data: {
            userId: candidate.userId,
            title: 'Onboarding Stage Shifted',
            message: `Your current onboarding phase was moved from "${previousStage?.replace(/_/g, ' ')}" to "${stage.replace(/_/g, ' ')}".`,
            type: 'MILESTONE_UPDATE',
            actionUrl: '/milestones',
          },
        });
      }

      return updatedCandidate;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Error moving candidate kanban stage:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
