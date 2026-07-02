// src/app/api/candidates/claim/dispute/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, claimantName, claimantEmail, reason } = body;

    if (!candidateId || !claimantName || !claimantEmail || !reason) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = claimantEmail.trim().toLowerCase();

    // 1. Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    // 2. Create dispute ticket and update candidate claim status to DISPUTED in a transaction
    await prisma.$transaction(async (tx) => {
      const ticket = await tx.disputeTicket.create({
        data: {
          candidateId,
          claimantName: claimantName.trim(),
          claimantEmail: trimmedEmail,
          reason: reason.trim(),
          status: 'OPEN',
        },
      });

      await tx.candidate.update({
        where: { id: candidateId },
        data: {
          claimStatus: 'DISPUTED',
        },
      });

      // Find all Admins to notify
      const admins = await tx.user.findMany({
        where: { role: 'ADMIN' },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: 'New Dispute Raised',
            message: `Claim conflict: ${claimantName} raised a dispute for Reference ID ${candidate.referenceId}.`,
            type: 'SYSTEM',
            actionUrl: `/settings/disputes`,
          })),
        });
      }

      return ticket;
    });

    return NextResponse.json({
      success: true,
      message: 'Dispute ticket raised successfully. Administrators will review your request.',
    });
  } catch (error: unknown) {
    console.error('Error raising dispute ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
