/*
  Warnings:

  - You are about to drop the column `supplier` on the `product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_categoryId_fkey";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "supplier",
ADD COLUMN     "supplierId" TEXT;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "user_role" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_role_email_key" ON "user_role"("email");

-- CreateIndex
CREATE INDEX "user_role_email_idx" ON "user_role"("email");

-- CreateIndex
CREATE INDEX "user_role_role_idx" ON "user_role"("role");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_name_key" ON "supplier"("name");

-- CreateIndex
CREATE INDEX "supplier_name_idx" ON "supplier"("name");

-- CreateIndex
CREATE INDEX "supplier_isActive_idx" ON "supplier"("isActive");

-- CreateIndex
CREATE INDEX "product_supplierId_idx" ON "product"("supplierId");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "session_token_idx" RENAME TO "session_token_key";

-- RenameIndex
ALTER INDEX "user_email_idx" RENAME TO "user_email_key";
