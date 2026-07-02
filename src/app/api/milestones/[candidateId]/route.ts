// src/app/api/milestones/[candidateId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Update a specific milestone status for a candidate
export async function PUT(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions);
  const candidateId = params.candidateId;

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Only coordinators and admins can modify candidate milestones.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { milestoneId, status, notes } = body;

    if (!milestoneId || !status) {
      return NextResponse.json(
        { success: false, error: 'Milestone ID and Status are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch the candidate and the current candidate milestone
    const [candidate, candMilestone] = await Promise.all([
      prisma.candidate.findUnique({
        where: { id: candidateId },
      }),
      prisma.candidateMilestone.findUnique({
        where: {
          candidateId_milestoneId: {
            candidateId,
            milestoneId,
          },
        },
        include: {
          milestone: true,
        },
      }),
    ]);

    if (!candidate || !candMilestone) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile or milestone record not found.' },
        { status: 404 }
      );
    }

    const previousStatus = candMilestone.status;

    // 2. Perform updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const isFinished = ['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(status);
      
      // Update CandidateMilestone status
      const updatedMs = await tx.candidateMilestone.update({
        where: { id: candMilestone.id },
        data: {
          status,
          notes: notes !== undefined ? notes.trim() : null,
          completedAt: isFinished ? new Date() : null,
          updatedBy: session.user.id,
        },
      });

      // Create Milestone History audit record
      await tx.milestoneHistory.create({
        data: {
          candidateMilestoneId: candMilestone.id,
          previousStatus,
          newStatus: status,
          notes: notes !== undefined ? notes.trim() : null,
          changedBy: session.user.id,
        },
      });

      // Determine new current stage of candidate
      let newCurrentStage = candidate.currentStage;

      if (isFinished) {
        // Find the next milestone definition in sequence
        const nextMilestone = await tx.milestoneDefinition.findFirst({
          where: {
            displayOrder: {
              gt: candMilestone.milestone.displayOrder,
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        });

        // If candidate's current stage was this one, auto-advance
        if (candidate.currentStage === candMilestone.milestone.stage && nextMilestone) {
          newCurrentStage = nextMilestone.stage;
        }
      } else {
        // If status went back to pending/in-progress, candidate is now at this stage
        newCurrentStage = candMilestone.milestone.stage;
      }

      // Update Candidate overall stage
      await tx.candidate.update({
        where: { id: candidateId },
        data: {
          currentStage: newCurrentStage,
        },
      });

      // Audit Log for overall candidate update
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'MILESTONE_UPDATED',
          entityType: 'Candidate',
          entityId: candidateId,
          details: JSON.stringify({
            milestoneName: candMilestone.milestone.name,
            oldStatus: previousStatus,
            newStatus: status,
            notes,
            newStage: newCurrentStage,
          }),
        },
      });

      // Notify candidate in-app if their account is claimed
      if (candidate.userId) {
        await tx.notification.create({
          data: {
            userId: candidate.userId,
            title: 'Milestone Updated',
            message: `Your onboarding milestone "${candMilestone.milestone.name}" has been updated from ${previousStatus.toLowerCase().replace(/_/g, ' ')} to ${status.toLowerCase().replace(/_/g, ' ')}.`,
            type: 'MILESTONE_UPDATE',
            actionUrl: '/milestones',
          },
        });
      }

      return updatedMs;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Error updating candidate milestone status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
