-- CreateTable
CREATE TABLE "DirectSale" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "DirectSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectSaleItem" (
    "id" TEXT NOT NULL,
    "directSaleId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DirectSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectSalePayment" (
    "id" TEXT NOT NULL,
    "directSaleId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "DirectSalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectSale_customerId_idx" ON "DirectSale"("customerId");

-- CreateIndex
CREATE INDEX "DirectSale_createdAt_idx" ON "DirectSale"("createdAt");

-- CreateIndex
CREATE INDEX "DirectSaleItem_directSaleId_idx" ON "DirectSaleItem"("directSaleId");

-- CreateIndex
CREATE INDEX "DirectSaleItem_productId_idx" ON "DirectSaleItem"("productId");

-- CreateIndex
CREATE INDEX "DirectSaleItem_serviceId_idx" ON "DirectSaleItem"("serviceId");

-- CreateIndex
CREATE INDEX "DirectSalePayment_directSaleId_idx" ON "DirectSalePayment"("directSaleId");

-- CreateIndex
CREATE INDEX "DirectSalePayment_paymentMethodId_idx" ON "DirectSalePayment"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "DirectSale" ADD CONSTRAINT "DirectSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSaleItem" ADD CONSTRAINT "DirectSaleItem_directSaleId_fkey" FOREIGN KEY ("directSaleId") REFERENCES "DirectSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSaleItem" ADD CONSTRAINT "DirectSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSaleItem" ADD CONSTRAINT "DirectSaleItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSalePayment" ADD CONSTRAINT "DirectSalePayment_directSaleId_fkey" FOREIGN KEY ("directSaleId") REFERENCES "DirectSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSalePayment" ADD CONSTRAINT "DirectSalePayment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
