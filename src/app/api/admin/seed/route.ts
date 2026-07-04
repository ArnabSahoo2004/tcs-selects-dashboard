import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Find a candidate
    let candidate = await prisma.candidate.findFirst({
      where: { claimStatus: 'CLAIMED' }
    });

    if (!candidate) {
      candidate = await prisma.candidate.findFirst();
      if (candidate) {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { claimStatus: 'CLAIMED' }
        });
      }
    }

    if (!candidate) {
      return NextResponse.json({ success: false, message: 'No candidates found to attach dispute.' });
    }

    // 2. Set claimStatus to DISPUTED
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { claimStatus: 'DISPUTED' }
    });

    // 3. Create the ticket
    const ticket = await prisma.disputeTicket.create({
      data: {
        candidateId: candidate.id,
        claimantEmail: 'demo_user_123@gmail.com',
        reason: 'This is a demo dispute. Someone else claimed my ID and I am unable to access my profile. Please verify.',
        status: 'OPEN',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demo dispute created successfully! Check your Admin Panel.',
      ticket
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
