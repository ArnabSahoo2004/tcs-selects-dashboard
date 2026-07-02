// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing database entries (to ensure clean slate on re-run)
  console.log('🧹 Clearing existing database data...');
  await prisma.milestoneHistory.deleteMany();
  await prisma.candidateMilestone.deleteMany();
  await prisma.documentChecklist.deleteMany();
  await prisma.disputeTicket.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.milestoneDefinition.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Default Admin User
  console.log('👤 Seeding default admin user...');
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tcs-selects.local',
      passwordHash: adminPasswordHash,
      name: 'Super Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Seeded admin user: ${adminUser.email}`);

  // 3. Seed Default Milestones
  console.log('🏁 Seeding milestone definitions...');
  const milestoneSpecs = [
    { stage: 'SELECTION_CONFIRMATION', name: 'Selection Confirmation', description: 'Offer letter received & acknowledged', displayOrder: 1, deadlineDays: 7 },
    { stage: 'DOCUMENT_SUBMISSION', name: 'Document Submission', description: 'Academic docs, ID proofs, photos submitted', displayOrder: 2, deadlineDays: 14 },
    { stage: 'BACKGROUND_VERIFICATION', name: 'Background Verification (BGV)', description: 'BGV initiated and cleared by TCS', displayOrder: 3, deadlineDays: 30 },
    { stage: 'MEDICAL_FITNESS', name: 'Medical Fitness', description: 'Medical fitness test completed and approved', displayOrder: 4, deadlineDays: 30 },
    { stage: 'ILP_ALLOCATION', name: 'ILP Allocation', description: 'Initial Learning Program dates assigned', displayOrder: 5, deadlineDays: 45 },
    { stage: 'JOINING_DATE_CONFIRMATION', name: 'Joining Date Confirmation', description: 'Official joining date communicated', displayOrder: 6, deadlineDays: 60 },
    { stage: 'ONBOARDING_KIT', name: 'Onboarding Kit', description: 'Laptop, credentials, and access cards issued', displayOrder: 7, deadlineDays: 75 },
    { stage: 'DAY_1_JOINING', name: 'Day-1 Joining', description: 'Candidate physically/virtually joined TCS', displayOrder: 8, deadlineDays: 90 },
  ];

  const milestones = [];
  for (const spec of milestoneSpecs) {
    const ms = await prisma.milestoneDefinition.create({
      data: spec,
    });
    milestones.push(ms);
  }
  console.log(`✅ Seeded ${milestones.length} milestone definitions.`);

  // 4. Read & Parse Candidates from CSV
  console.log('📄 Parsing candidate CSV data...');
  const csvFilePath = path.join(process.cwd(), 'data.csv');
  const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');

  interface CSVRow {
    'Reference ID': string;
    Name: string;
    Qualification: string;
    Specialization: string;
    'Approved Offer': string;
  }

  const parseResult = Papa.parse<CSVRow>(csvFileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length > 0) {
    console.warn('⚠️ CSV parsing warnings/errors:', parseResult.errors);
  }

  const rows = parseResult.data;
  console.log(`Parsed ${rows.length} candidate rows from CSV.`);

  // 5. Seed Candidates and associated items
  console.log('💾 Seeding candidate database records...');
  
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

  let successCount = 0;
  for (const row of rows) {
    const referenceId = row['Reference ID']?.trim();
    const name = row['Name']?.trim();
    const qualification = row['Qualification']?.trim();
    const specialization = row['Specialization']?.trim();
    const offerStr = row['Approved Offer']?.trim().toLowerCase();

    if (!referenceId || !name) {
      console.warn('⚠️ Skipping invalid row:', row);
      continue;
    }

    // Map approved offer to SelectedRole enum
    let selectedRole: 'PRIME' | 'DIGITAL' | 'NINJA' | 'OTHER' = 'OTHER';
    if (offerStr === 'prime') {
      selectedRole = 'PRIME';
    } else if (offerStr === 'digital') {
      selectedRole = 'DIGITAL';
    } else if (offerStr === 'ninja') {
      selectedRole = 'NINJA';
    }

    try {
      // Create candidate
      const candidate = await prisma.candidate.create({
        data: {
          referenceId,
          name,
          qualification: qualification || 'Unknown',
          specialization: specialization || 'Unknown',
          selectedRole,
          claimStatus: 'UNCLAIMED',
          currentStage: 'SELECTION_CONFIRMATION', // Initial stage
          overallStatus: 'ACTIVE',
        },
      });

      // Create Document Checklist entries
      await prisma.documentChecklist.createMany({
        data: documentTypes.map((docType) => ({
          candidateId: candidate.id,
          type: docType,
          status: 'NOT_SUBMITTED',
        })),
      });

      // Create CandidateMilestones
      await prisma.candidateMilestone.createMany({
        data: milestones.map((ms) => {
          // Set selection confirmation to pending or we can set it default
          return {
            candidateId: candidate.id,
            milestoneId: ms.id,
            status: 'PENDING',
          };
        }),
      });

      successCount++;
    } catch (err) {
      console.error(`❌ Error seeding candidate ${referenceId}:`, err);
    }
  }

  console.log(`✅ Successfully seeded ${successCount} candidates.`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Critical seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
