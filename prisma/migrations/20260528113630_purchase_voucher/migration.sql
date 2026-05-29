/*
  Warnings:

  - You are about to drop the column `refundMethodCode` on the `credit_note` table. All the data in the column will be lost.

*/
-- DropIndex (idempotent: index may not exist in prod if previous migration was rolled back)
DROP INDEX IF EXISTS "credit_note_createdAt_idx";

-- AlterTable (idempotent: column may not exist in prod if previous migration was rolled back)
ALTER TABLE "credit_note" DROP COLUMN IF EXISTS "refundMethodCode";

-- AlterTable
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "cuit" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "purchase_voucher" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentMethodId" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "purchase_voucher_item" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_voucher_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_voucher_status_idx" ON "purchase_voucher"("status");

-- CreateIndex
CREATE INDEX "purchase_voucher_supplierId_idx" ON "purchase_voucher"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_voucher_createdAt_idx" ON "purchase_voucher"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_voucher_supplierId_letter_number_key" ON "purchase_voucher"("supplierId", "letter", "number");

-- CreateIndex
CREATE INDEX "purchase_voucher_item_voucherId_idx" ON "purchase_voucher_item"("voucherId");

-- CreateIndex
CREATE INDEX "purchase_voucher_item_productId_idx" ON "purchase_voucher_item"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_voucher_item_voucherId_productId_key" ON "purchase_voucher_item"("voucherId", "productId");

-- AddForeignKey
ALTER TABLE "purchase_voucher" ADD CONSTRAINT "purchase_voucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_voucher" ADD CONSTRAINT "purchase_voucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_voucher_item" ADD CONSTRAINT "purchase_voucher_item_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "purchase_voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_voucher_item" ADD CONSTRAINT "purchase_voucher_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
