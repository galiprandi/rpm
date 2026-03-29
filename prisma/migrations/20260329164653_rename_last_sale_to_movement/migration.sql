/*
  Warnings:

  - You are about to drop the column `lastSaleAt` on the `product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "product_lastSaleAt_idx";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "lastSaleAt",
ADD COLUMN     "lastMovementAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "product_lastMovementAt_idx" ON "product"("lastMovementAt");
