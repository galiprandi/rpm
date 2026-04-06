/*
  Warnings:

  - You are about to drop the `DirectSale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DirectSaleItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DirectSalePayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentMethod` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DirectSale" DROP CONSTRAINT "DirectSale_customerId_fkey";

-- DropForeignKey
ALTER TABLE "DirectSaleItem" DROP CONSTRAINT "DirectSaleItem_directSaleId_fkey";

-- DropForeignKey
ALTER TABLE "DirectSaleItem" DROP CONSTRAINT "DirectSaleItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "DirectSaleItem" DROP CONSTRAINT "DirectSaleItem_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "DirectSalePayment" DROP CONSTRAINT "DirectSalePayment_directSaleId_fkey";

-- DropForeignKey
ALTER TABLE "DirectSalePayment" DROP CONSTRAINT "DirectSalePayment_paymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_paymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_workOrderId_fkey";

-- DropTable
DROP TABLE "DirectSale";

-- DropTable
DROP TABLE "DirectSaleItem";

-- DropTable
DROP TABLE "DirectSalePayment";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "PaymentMethod";

-- CreateTable
CREATE TABLE "payment_method" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_sale" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "direct_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_sale_item" (
    "id" TEXT NOT NULL,
    "directSaleId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "direct_sale_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_sale_payment" (
    "id" TEXT NOT NULL,
    "directSaleId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "direct_sale_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "cash_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "afipData" JSONB,
    "status" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_name_key" ON "payment_method"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_code_key" ON "payment_method"("code");

-- CreateIndex
CREATE INDEX "payment_method_isActive_idx" ON "payment_method"("isActive");

-- CreateIndex
CREATE INDEX "payment_method_sortOrder_idx" ON "payment_method"("sortOrder");

-- CreateIndex
CREATE INDEX "payment_workOrderId_idx" ON "payment"("workOrderId");

-- CreateIndex
CREATE INDEX "payment_paymentMethodId_idx" ON "payment"("paymentMethodId");

-- CreateIndex
CREATE INDEX "direct_sale_customerId_idx" ON "direct_sale"("customerId");

-- CreateIndex
CREATE INDEX "direct_sale_createdAt_idx" ON "direct_sale"("createdAt");

-- CreateIndex
CREATE INDEX "direct_sale_item_directSaleId_idx" ON "direct_sale_item"("directSaleId");

-- CreateIndex
CREATE INDEX "direct_sale_item_productId_idx" ON "direct_sale_item"("productId");

-- CreateIndex
CREATE INDEX "direct_sale_item_serviceId_idx" ON "direct_sale_item"("serviceId");

-- CreateIndex
CREATE INDEX "direct_sale_payment_directSaleId_idx" ON "direct_sale_payment"("directSaleId");

-- CreateIndex
CREATE INDEX "direct_sale_payment_paymentMethodId_idx" ON "direct_sale_payment"("paymentMethodId");

-- CreateIndex
CREATE INDEX "cash_movement_type_idx" ON "cash_movement"("type");

-- CreateIndex
CREATE INDEX "cash_movement_createdAt_idx" ON "cash_movement"("createdAt");

-- CreateIndex
CREATE INDEX "cash_movement_referenceId_idx" ON "cash_movement"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_number_key" ON "invoice"("number");

-- CreateIndex
CREATE INDEX "invoice_number_idx" ON "invoice"("number");

-- CreateIndex
CREATE INDEX "invoice_referenceId_idx" ON "invoice"("referenceId");

-- CreateIndex
CREATE INDEX "invoice_status_idx" ON "invoice"("status");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_sale" ADD CONSTRAINT "direct_sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_sale_item" ADD CONSTRAINT "direct_sale_item_directSaleId_fkey" FOREIGN KEY ("directSaleId") REFERENCES "direct_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_sale_item" ADD CONSTRAINT "direct_sale_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_sale_item" ADD CONSTRAINT "direct_sale_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_sale_payment" ADD CONSTRAINT "direct_sale_payment_directSaleId_fkey" FOREIGN KEY ("directSaleId") REFERENCES "direct_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_sale_payment" ADD CONSTRAINT "direct_sale_payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
