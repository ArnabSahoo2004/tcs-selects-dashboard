// src/app/api/candidates/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, SelectedRole, ClaimStatus, CandidateStatus, IpaStatus } from '@prisma/client';

// GET: Paginated and filtered candidates list
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const skip = (page - 1) * pageSize;

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  // Filters
  const search = searchParams.get('search')?.trim();
  const role = searchParams.get('role');
  const claimStatus = searchParams.get('claimStatus');
  const overallStatus = searchParams.get('status');
  const ipaStatus = searchParams.get('ipaStatus');

  try {
    // Build Prisma filter conditions
    const where: Prisma.CandidateWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { referenceId: { contains: search } },
      ];
    }

    if (role && role !== 'ALL') {
      where.selectedRole = role as SelectedRole;
    }

    if (claimStatus && claimStatus !== 'ALL') {
      where.claimStatus = claimStatus as ClaimStatus;
    }

    if (overallStatus && overallStatus !== 'ALL') {
      where.overallStatus = overallStatus as CandidateStatus;
    }

    if (ipaStatus && ipaStatus !== 'ALL') {
      where.ipaStatus = ipaStatus as IpaStatus;
    }

    // Query DB
    const [total, candidates] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          milestones: {
            include: {
              milestone: true,
            },
          },
        },
      }),
    ]);

    // Map to compute daysInStage and isAtRisk dynamically
    const mappedCandidates = candidates.map((cand) => {
      const currentMs = cand.milestones.find((m) => m.milestone.stage === cand.currentStage);
      let daysInStage = 0;
      let isAtRisk = false;

      if (currentMs) {
        const lastUpdated = currentMs.updatedAt || currentMs.createdAt;
        daysInStage = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        const deadline = currentMs.milestone.deadlineDays ?? 14;
        isAtRisk = daysInStage > deadline && !['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(currentMs.status);
      }

      return {
        ...cand,
        daysInStage,
        isAtRisk,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: mappedCandidates,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching candidates API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Manually create a single candidate
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Only coordinators and admins can create candidates.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { referenceId, name, qualification, specialization, selectedRole } = body;

    if (!referenceId || !name || !selectedRole) {
      return NextResponse.json(
        { success: false, error: 'Reference ID, Name, and Role are required fields.' },
        { status: 400 }
      );
    }

    const upperRefId = referenceId.trim().toUpperCase();

    // Validate Reference ID format (must start with CT or DT)
    if (!upperRefId.startsWith('CT') && !upperRefId.startsWith('DT')) {
      return NextResponse.json(
        { success: false, error: 'Reference ID must start with "CT" or "DT".' },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await prisma.candidate.findUnique({
      where: { referenceId: upperRefId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Candidate with Reference ID ${upperRefId} already exists.` },
        { status: 400 }
      );
    }

    // Create Candidate, checklists, and milestones in transaction
    const newCandidate = await prisma.$transaction(async (tx) => {
      // 1. Fetch milestone definitions
      const milestones = await tx.milestoneDefinition.findMany({
        orderBy: { displayOrder: 'asc' },
      });

      // 2. Create Candidate
      const candidate = await tx.candidate.create({
        data: {
          referenceId: upperRefId,
          name: name.trim(),
          qualification: qualification?.trim() || 'Unknown',
          specialization: specialization?.trim() || 'Unknown',
          selectedRole,
          claimStatus: 'UNCLAIMED',
          currentStage: milestones[0]?.stage || 'SELECTION_CONFIRMATION',
          overallStatus: 'ACTIVE',
        },
      });

      // 3. Create Document Checklist entries
      const documentTypes: Array<'MARKSHEET_10TH' | 'MARKSHEET_12TH' | 'DEGREE_CERTIFICATE' | 'PROVISIONAL_CERTIFICATE' | 'PASSPORT_PHOTO' | 'OFFER_LETTER_ACKNOWLEDGMENT' | 'MEDICAL_CERTIFICATE' | 'OTHER'> = [
        'MARKSHEET_10TH',
        'MARKSHEET_12TH',
        'DEGREE_CERTIFICATE',
        'PROVISIONAL_CERTIFICATE',
        'PASSPORT_PHOTO',
        'OFFER_LETTER_ACKNOWLEDGMENT',
        'MEDICAL_CERTIFICATE',
        'OTHER',
      ];

      await tx.documentChecklist.createMany({
        data: documentTypes.map((docType) => ({
          candidateId: candidate.id,
          type: docType,
          status: 'NOT_SUBMITTED',
        })),
      });

      // 4. Create milestones entries
      if (milestones.length > 0) {
        await tx.candidateMilestone.createMany({
          data: milestones.map((ms) => ({
            candidateId: candidate.id,
            milestoneId: ms.id,
            status: 'PENDING',
          })),
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CANDIDATE_CREATED',
          entityType: 'Candidate',
          entityId: candidate.id,
          details: JSON.stringify({ referenceId: upperRefId, name: candidate.name }),
        },
      });

      return candidate;
    });

    return NextResponse.json({
      success: true,
      data: newCandidate,
    });
  } catch (error: unknown) {
    console.error('Error creating candidate manually:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
