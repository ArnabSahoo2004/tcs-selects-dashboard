// src/app/api/checklist/[candidateId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Update a candidate's document checklist item status
export async function PUT(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  const session = await getServerSession(authOptions);
  const candidateId = params.candidateId;

  // Auth check: Coordinator or Admin only (Candidates can self-update in v1 if allowed, but coordinator check is safer)
  // Let's allow Candidate role to self-update their checklists to "SUBMITTED" as per PRD:
  // "Candidate: can self-update document submission status (marks submitted)"
  // Admins & Coordinators can update to anything (including VERIFIED_BY_TCS)
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { type, status, notes } = body;

    if (!type || !status) {
      return NextResponse.json(
        { success: false, error: 'Document type and status are required.' },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not found.' },
        { status: 404 }
      );
    }

    // Role specific restrictions
    if (session.user.role === 'CANDIDATE') {
      // Candidates can only update their own checklist
      if (session.user.candidateId !== candidate.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden. You can only update your own checklist.' },
          { status: 403 }
        );
      }
      // Candidates can only mark as NOT_SUBMITTED or SUBMITTED, NOT VERIFIED_BY_TCS
      if (status === 'VERIFIED_BY_TCS') {
        return NextResponse.json(
          { success: false, error: 'Forbidden. Candidates cannot self-verify documents.' },
          { status: 403 }
        );
      }
    }

    // Perform update
    const updatedChecklist = await prisma.$transaction(async (tx) => {
      const checklistItem = await tx.documentChecklist.update({
        where: {
          candidateId_type: {
            candidateId,
            type,
          },
        },
        data: {
          status,
          notes: notes !== undefined ? notes.trim() : undefined,
          updatedBy: session.user.id,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CHECKLIST_UPDATED',
          entityType: 'Candidate',
          entityId: candidateId,
          details: JSON.stringify({ type, status, notes }),
        },
      });

      // Create Notification for Candidate if updated by Admin/Coordinator and candidate is claimed (has userId)
      if (candidate.userId && (session.user.role === 'ADMIN' || session.user.role === 'COORDINATOR')) {
        const readableType = type.toLowerCase().replace(/_/g, ' ');
        const readableStatus = status.replace(/_/g, ' ');
        await tx.notification.create({
          data: {
            userId: candidate.userId,
            title: status === 'VERIFIED_BY_TCS' ? 'Document Verified' : 'Document Checklist Updated',
            message: `Your document "${readableType}" status is now "${readableStatus}".`,
            type: 'CHECKLIST_UPDATE',
            actionUrl: '/checklist',
          },
        });
      }

      return checklistItem;
    });

    return NextResponse.json({
      success: true,
      data: updatedChecklist,
    });
  } catch (error: unknown) {
    console.error('Error updating document checklist:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
