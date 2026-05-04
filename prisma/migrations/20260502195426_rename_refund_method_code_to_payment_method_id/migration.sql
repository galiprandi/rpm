/*
  Warnings:

  - You are about to drop the column `refundMethodCode` on the `credit_note` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "credit_note_createdAt_idx";

-- AlterTable
ALTER TABLE "credit_note" DROP COLUMN "refundMethodCode",
ADD COLUMN     "paymentMethodId" TEXT;

-- CreateIndex
CREATE INDEX "credit_note_invoiceId_idx" ON "credit_note"("invoiceId");
