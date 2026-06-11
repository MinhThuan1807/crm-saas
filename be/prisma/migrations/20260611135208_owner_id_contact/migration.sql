/*
  Warnings:

  - Added the required column `ownerId` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add column as nullable to handle existing rows
ALTER TABLE "Contact" ADD COLUMN "ownerId" TEXT;

-- Step 2: Backfill existing rows with the first user in the same tenant
UPDATE "Contact" c
SET "ownerId" = (
  SELECT u."id"
  FROM "User" u
  WHERE u."tenantId" = c."tenantId"
  ORDER BY u."createdAt" ASC
  LIMIT 1
);

-- Step 3: Set NOT NULL constraint after backfill
ALTER TABLE "Contact" ALTER COLUMN "ownerId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Contact_tenantId_ownerId_idx" ON "Contact"("tenantId", "ownerId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
