// src/app/api/analytics/pipeline/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CandidateStatus } from '@prisma/client';

// GET: Retrieve pipeline funnel analytics data
export async function GET() {
  const session = await getServerSession(authOptions);

  // Auth check: Admin or Coordinator only
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 403 }
    );
  }

  try {
    // 1. Fetch milestone definitions and active candidates
    const [definitions, candidates] = await Promise.all([
      prisma.milestoneDefinition.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.candidate.findMany({
        where: {
          overallStatus: {
            not: CandidateStatus.WITHDRAWN,
          },
        },
        select: {
          id: true,
          currentStage: true,
        },
      }),
    ]);

    const totalActive = candidates.length;

    if (definitions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalActive,
          funnel: [],
        },
      });
    }

    // Map stages to display order for quick lookup
    const orderMap = new Map<string, number>();
    definitions.forEach((d) => {
      orderMap.set(d.stage, d.displayOrder);
    });

    // Map candidate counts at each stage (cumulative)
    // A candidate has reached stage S if the displayOrder of their currentStage is >= displayOrder of S
    const stageCounts = definitions.map((def) => {
      const targetOrder = def.displayOrder;
      
      const count = candidates.filter((cand) => {
        const candStage = cand.currentStage || 'SELECTION_CONFIRMATION';
        const candOrder = orderMap.get(candStage) || 1;
        return candOrder >= targetOrder;
      }).length;

      return {
        stage: def.stage,
        name: def.name,
        displayOrder: def.displayOrder,
        count,
      };
    });

    // Compute conversion metrics
    const startCount = stageCounts[0]?.count || 0;

    const funnelData = stageCounts.map((item, index) => {
      const count = item.count;
      const prevItem = index > 0 ? stageCounts[index - 1] : null;
      const prevCount = prevItem ? prevItem.count : count;

      const conversionRate = startCount > 0 ? Math.round((count / startCount) * 1000) / 10 : 0;
      const transitionRate = prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : 100;
      const dropoffCount = prevCount - count;
      const dropoffRate = prevCount > 0 ? Math.round((dropoffCount / prevCount) * 1000) / 10 : 0;

      return {
        stage: item.stage,
        name: item.name,
        displayOrder: item.displayOrder,
        count,
        conversionRate, // % of initial selection
        transitionRate, // % of previous stage
        dropoffCount,
        dropoffRate,    // % dropoff from previous stage
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalActive,
        funnel: funnelData,
      },
    });
  } catch (error: unknown) {
    console.error('Error computing pipeline analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
