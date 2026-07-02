// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AnnouncementPriority } from '@prisma/client';

// GET: List all announcements
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 401 }
    );
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (error: unknown) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new announcement (Admin/Coordinator only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Only coordinators and admins can create announcements.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, priority, targetRoles } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and Content are required.' },
        { status: 400 }
      );
    }

    const newAnnouncement = await prisma.$transaction(async (tx) => {
      // 1. Create Announcement
      const ann = await tx.announcement.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          priority: (priority as AnnouncementPriority) || AnnouncementPriority.NORMAL,
          targetRoles: targetRoles || null,
          authorId: session.user.id,
        },
      });

      // 2. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ANNOUNCEMENT_CREATED',
          entityType: 'Announcement',
          entityId: ann.id,
          details: JSON.stringify({ title: ann.title, priority: ann.priority }),
        },
      });

      // 3. Create notifications for all candidates if targeted
      if (!targetRoles || targetRoles === 'CANDIDATE') {
        const candidates = await tx.candidate.findMany({
          where: {
            userId: { not: null },
            overallStatus: { not: 'WITHDRAWN' },
          },
          select: {
            userId: true,
          },
        });

        // Batch insert notifications
        const notificationPromises = candidates.map((cand) => {
          if (cand.userId) {
            return tx.notification.create({
              data: {
                userId: cand.userId,
                title: 'New Announcement',
                message: `An announcement has been published: "${ann.title}"`,
                type: 'ANNOUNCEMENT',
                actionUrl: '/overview',
              },
            });
          }
          return Promise.resolve(null);
        });

        await Promise.all(notificationPromises);
      }

      return ann;
    });

    return NextResponse.json({
      success: true,
      data: newAnnouncement,
    });
  } catch (error: unknown) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
