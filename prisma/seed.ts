// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing database entries
  console.log('🧹 Clearing existing database data...');
  await prisma.disputeTicket.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Candidates
  console.log('💾 Seeding test candidates...');
  
  await prisma.candidate.create({
    data: {
      referenceId: 'CT20261234567',
      name: 'John Doe',
      selectedRole: 'DIGITAL',
      claimStatus: 'UNCLAIMED',
    },
  });

  await prisma.candidate.create({
    data: {
      referenceId: 'DT20267654321',
      name: 'Jane Smith',
      selectedRole: 'PRIME',
      claimStatus: 'UNCLAIMED',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('Test IDs: CT20261234567 (John Doe), DT20267654321 (Jane Smith)');
}

main()
  .catch((e) => {
    console.error('❌ Critical seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
