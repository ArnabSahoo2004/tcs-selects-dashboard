// src/app/api/candidates/export/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, SelectedRole, ClaimStatus, CandidateStatus } from '@prisma/client';
import Papa from 'papaparse';

// GET: Export filtered candidates list to CSV format
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  // Filters
  const search = searchParams.get('search')?.trim();
  const role = searchParams.get('role');
  const claimStatus = searchParams.get('claimStatus');
  const overallStatus = searchParams.get('status');

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

    // Query DB (all matches, no pagination limit)
    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    // Map candidates to CSV format columns
    const csvData = candidates.map((cand) => ({
      'Reference ID': cand.referenceId,
      Name: cand.name,
      Qualification: cand.qualification,
      Specialization: cand.specialization,
      'Approved Offer': cand.selectedRole,
      'Claim Status': cand.claimStatus,
      'Current Milestone': cand.currentStage || '-',
      'Overall Status': cand.overallStatus,
      'Joining Date': cand.joiningDate ? cand.joiningDate.toISOString().split('T')[0] : '-',
    }));

    // Convert to CSV string using PapaParse
    const csvString = Papa.unparse(csvData);

    // Set response headers for download
    const responseHeaders = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=tcs_selects_candidates_${new Date().toISOString().split('T')[0]}.csv`,
    });

    return new NextResponse(csvString, {
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Error exporting candidates CSV:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
