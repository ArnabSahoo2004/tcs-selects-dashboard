'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateCandidateDetails(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidate: true }
  });

  if (!user?.candidate) {
    throw new Error('No candidate profile found');
  }

  const campusType = formData.get('campusType') as string;
  const offerLetterDateStr = formData.get('offerLetterDate') as string;
  const jrsDateStr = formData.get('jrsDate') as string;
  const joiningDateStr = formData.get('joiningDate') as string;
  const ilpAttempted = parseInt(formData.get('ilpAttempted') as string) || 0;
  const bgcStarted = formData.get('bgcStarted') === 'on';
  const prefLocation1 = formData.get('prefLocation1') as string;
  const prefLocation2 = formData.get('prefLocation2') as string;
  const prefLocation3 = formData.get('prefLocation3') as string;
  const assignedLocation = formData.get('assignedLocation') as string;

  const parseDate = (d: string) => d ? new Date(d) : null;

  await prisma.candidate.update({
    where: { id: user.candidate.id },
    data: {
      campusType,
      offerLetterDate: parseDate(offerLetterDateStr),
      jrsDate: parseDate(jrsDateStr),
      joiningDate: parseDate(joiningDateStr),
      ilpAttempted,
      bgcStarted,
      prefLocation1,
      prefLocation2,
      prefLocation3,
      assignedLocation
    }
  });

  revalidatePath('/dashboard');
}
