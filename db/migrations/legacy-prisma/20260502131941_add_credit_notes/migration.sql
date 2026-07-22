-- CreateTable
CREATE TABLE "credit_note" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "originalSaleId" TEXT NOT NULL,
    "originalSaleType" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "refundMethod" TEXT NOT NULL,
    "cashAmount" DECIMAL(10,2),
    "accountCreditAmount" DECIMAL(10,2),
    "refundMethodCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "credit_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_note_item" (
    "id" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "credit_note_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_note_invoiceId_key" ON "credit_note"("invoiceId");

-- CreateIndex
CREATE INDEX "credit_note_customerId_idx" ON "credit_note"("customerId");

-- CreateIndex
CREATE INDEX "credit_note_originalSaleId_originalSaleType_idx" ON "credit_note"("originalSaleId", "originalSaleType");

-- CreateIndex
CREATE INDEX "credit_note_createdAt_idx" ON "credit_note"("createdAt");

-- CreateIndex
CREATE INDEX "credit_note_status_idx" ON "credit_note"("status");

-- CreateIndex
CREATE INDEX "credit_note_item_creditNoteId_idx" ON "credit_note_item"("creditNoteId");

-- CreateIndex
CREATE INDEX "credit_note_item_productId_idx" ON "credit_note_item"("productId");

-- CreateIndex
CREATE INDEX "credit_note_item_serviceId_idx" ON "credit_note_item"("serviceId");

-- AddForeignKey
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_item" ADD CONSTRAINT "credit_note_item_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "credit_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_item" ADD CONSTRAINT "credit_note_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_item" ADD CONSTRAINT "credit_note_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
