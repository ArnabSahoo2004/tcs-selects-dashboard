import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketId, action } = body;

    if (!ticketId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Find the ticket
    const ticket = await prisma.disputeTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Dispute ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: 'Dispute ticket is already resolved or rejected' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        // Approve: Remove current claim and set to UNCLAIMED
        await tx.candidate.update({
          where: { id: ticket.candidateId },
          data: {
            claimStatus: 'UNCLAIMED',
            userId: null,
          },
        });

        await tx.disputeTicket.update({
          where: { id: ticketId },
          data: { status: 'RESOLVED' },
        });
      } else if (action === 'REJECT') {
        // Reject: Revert candidate to CLAIMED
        await tx.candidate.update({
          where: { id: ticket.candidateId },
          data: {
            claimStatus: 'CLAIMED',
          },
        });

        await tx.disputeTicket.update({
          where: { id: ticketId },
          data: { status: 'REJECTED' },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Dispute ticket ${action.toLowerCase()}ed successfully.`,
    });
  } catch (error: unknown) {
    console.error('Error resolving dispute ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
