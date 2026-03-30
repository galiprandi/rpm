/*
  Warnings:

  - You are about to drop the column `documentNumber` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `customer` table. All the data in the column will be lost.
  - Added the required column `name` to the `customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customer_documentNumber_idx";

-- DropIndex
DROP INDEX "customer_fullName_idx";

-- AlterTable
ALTER TABLE "customer" DROP COLUMN "documentNumber",
DROP COLUMN "documentType",
DROP COLUMN "fullName",
ADD COLUMN     "billingData" JSONB,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "work_order" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'IN_PERSON';

-- CreateIndex
CREATE INDEX "customer_name_idx" ON "customer"("name");
