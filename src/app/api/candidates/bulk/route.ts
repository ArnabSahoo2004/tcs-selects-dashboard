// src/app/api/candidates/bulk/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, CandidateStatus } from '@prisma/client';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { ids, action, value } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json(
        { success: false, error: 'Candidate IDs array and action are required.' },
        { status: 400 }
      );
    }

    const updateData: Prisma.CandidateUpdateManyMutationInput = {};

    if (action === 'withdraw') {
      // Deleting candidates (Admin only check is recommended, but PRD allows Coordinator batch oversight)
      updateData.overallStatus = 'WITHDRAWN';
    } else if (action === 'status-update') {
      if (!value) {
        return NextResponse.json(
          { success: false, error: 'Status value is required for status-update action.' },
          { status: 400 }
        );
      }
      updateData.overallStatus = value as CandidateStatus;
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported bulk action: ${action}` },
        { status: 400 }
      );
    }

    // Execute bulk update in transaction
    const count = await prisma.$transaction(async (tx) => {
      const result = await tx.candidate.updateMany({
        where: {
          id: { in: ids },
        },
        data: updateData,
      });

      // Create bulk audit logs
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: `BULK_${action.toUpperCase()}`,
          entityType: 'Candidate',
          entityId: 'BULK_ACTION',
          details: JSON.stringify({ count: result.count, ids, updateData }),
        },
      });

      return result.count;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${count} candidates.`,
    });
  } catch (error: unknown) {
    console.error('Error performing bulk candidates action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
