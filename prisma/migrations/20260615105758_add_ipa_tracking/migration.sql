-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "referenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "selectedRole" TEXT NOT NULL,
    "claimStatus" TEXT NOT NULL DEFAULT 'UNCLAIMED',
    "currentStage" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joiningDate" DATETIME,
    "remarks" TEXT,
    "batchId" TEXT,
    "ipaStatus" TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
    "ipaAttempts" INTEGER NOT NULL DEFAULT 0,
    "ipaScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Candidate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("batchId", "claimStatus", "createdAt", "currentStage", "id", "joiningDate", "name", "overallStatus", "qualification", "referenceId", "remarks", "selectedRole", "specialization", "updatedAt", "userId") SELECT "batchId", "claimStatus", "createdAt", "currentStage", "id", "joiningDate", "name", "overallStatus", "qualification", "referenceId", "remarks", "selectedRole", "specialization", "updatedAt", "userId" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
CREATE UNIQUE INDEX "Candidate_userId_key" ON "Candidate"("userId");
CREATE UNIQUE INDEX "Candidate_referenceId_key" ON "Candidate"("referenceId");
CREATE INDEX "Candidate_referenceId_idx" ON "Candidate"("referenceId");
CREATE INDEX "Candidate_name_idx" ON "Candidate"("name");
CREATE INDEX "Candidate_selectedRole_idx" ON "Candidate"("selectedRole");
CREATE INDEX "Candidate_claimStatus_idx" ON "Candidate"("claimStatus");
CREATE INDEX "Candidate_overallStatus_idx" ON "Candidate"("overallStatus");
CREATE INDEX "Candidate_batchId_idx" ON "Candidate"("batchId");
CREATE INDEX "Candidate_ipaStatus_idx" ON "Candidate"("ipaStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
