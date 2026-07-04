const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
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

  if (candidate) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { claimStatus: 'DISPUTED' }
    });

    const ticket = await prisma.disputeTicket.create({
      data: {
        candidateId: candidate.id,
        claimantEmail: 'real_owner123@gmail.com',
        reason: 'Hello Admin! This is a dummy dispute. I believe this CT/DT ID belongs to me but someone else has claimed it. Please help!',
        status: 'OPEN',
      },
    });

    console.log('Dummy dispute created!', ticket);
  } else {
    console.log('No candidates found in the database to attach a dispute to.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
