import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST: Create a new off-campus candidate and link a user account instantly
export async function POST(request: Request) {
  try {
    const { name, referenceId, selectedRole, email, password } = await request.json();

    if (!name || !referenceId || !selectedRole || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists. Try logging in.' },
        { status: 400 }
      );
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { referenceId },
    });

    if (existingCandidate) {
      return NextResponse.json(
        { success: false, error: 'Reference ID already exists in the database. Please search for it instead to claim it.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Run in transaction: create User and Candidate simultaneously
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      // 2. Create the candidate and link it to the user
      const candidate = await tx.candidate.create({
        data: {
          name,
          referenceId,
          selectedRole,
          campusType: 'Off Campus', // Force as off-campus
          claimStatus: 'CLAIMED',   // Immediately claimed since they just created it
          userId: user.id,          // Link directly to user
          ilpAttempted: 0,
          bgcStarted: false,
        },
      });

      return { user, candidate };
    });

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error('Error creating off-campus candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
