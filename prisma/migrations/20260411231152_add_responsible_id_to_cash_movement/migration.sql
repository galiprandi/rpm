-- AlterTable
ALTER TABLE "cash_movement" ADD COLUMN     "responsibleId" TEXT;

-- CreateIndex
CREATE INDEX "cash_movement_responsibleId_idx" ON "cash_movement"("responsibleId");
