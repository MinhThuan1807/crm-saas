/*
  Warnings:

  - Added the required column `jobId` to the `AiSuggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `AiSuggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiSuggestion" ADD COLUMN     "jobId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AiSuggestion_tenantId_idx" ON "AiSuggestion"("tenantId");

-- CreateIndex
CREATE INDEX "AiSuggestion_tenantId_dealId_idx" ON "AiSuggestion"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "AiSuggestion_tenantId_jobId_idx" ON "AiSuggestion"("tenantId", "jobId");

-- CreateIndex
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");

-- CreateIndex
CREATE INDEX "Task_tenantId_dealId_idx" ON "Task"("tenantId", "dealId");
