// src/app/api/candidates/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, SelectedRole, CandidateStatus, IpaStatus } from '@prisma/client';

// GET: Fetch single candidate profile details (with milestones, checklists, and user details)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized session.' },
      { status: 401 }
    );
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            role: true,
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

    // Auth check: Candidates can only access their own profiles
    if (session.user.role === 'CANDIDATE' && session.user.candidateId !== candidate.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You can only view your own candidate profile.' },
        { status: 403 }
      );
    }

    // Fetch audit logs or history
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Candidate',
        entityId: candidate.id,
      },
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
      data: {
        ...candidate,
        daysInStage,
        isAtRisk,
        auditLogs,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching candidate details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update candidate profile details
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Only coordinators and admins can update candidate profiles.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, qualification, specialization, selectedRole, joiningDate, remarks, overallStatus, ipaStatus, ipaAttempts, ipaScore } = body;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found.' },
        { status: 404 }
      );
    }

    // Check updates
    const updateData: Prisma.CandidateUpdateInput = {};
    if (name) updateData.name = name.trim();
    if (qualification) updateData.qualification = qualification.trim();
    if (specialization) updateData.specialization = specialization.trim();
    if (selectedRole) updateData.selectedRole = selectedRole as SelectedRole;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (overallStatus) updateData.overallStatus = overallStatus as CandidateStatus;

    if (ipaStatus) updateData.ipaStatus = ipaStatus as IpaStatus;
    if (ipaAttempts !== undefined) {
      updateData.ipaAttempts = typeof ipaAttempts === 'number' ? ipaAttempts : parseInt(ipaAttempts, 10) || 0;
    }
    if (ipaScore !== undefined) {
      updateData.ipaScore = ipaScore !== null && ipaScore !== '' ? (typeof ipaScore === 'number' ? ipaScore : parseFloat(ipaScore) || null) : null;
    }

    if (joiningDate) {
      updateData.joiningDate = new Date(joiningDate);
    } else if (joiningDate === null) {
      updateData.joiningDate = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.candidate.update({
        where: { id },
        data: updateData,
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CANDIDATE_UPDATED',
          entityType: 'Candidate',
          entityId: id,
          details: JSON.stringify(updateData),
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete candidate by changing overallStatus to WITHDRAWN
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  // Auth check: Admin only
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Only admins can soft-delete candidates.' },
      { status: 403 }
    );
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not found.' },
        { status: 404 }
      );
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.candidate.update({
        where: { id },
        data: {
          overallStatus: 'WITHDRAWN',
        },
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CANDIDATE_WITHDRAWN',
          entityType: 'Candidate',
          entityId: id,
          details: JSON.stringify({ oldStatus: candidate.overallStatus, newStatus: 'WITHDRAWN' }),
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate soft-deleted (status marked as WITHDRAWN).',
      data: deleted,
    });
  } catch (error: unknown) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
