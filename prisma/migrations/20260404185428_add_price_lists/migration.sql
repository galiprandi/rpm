-- AlterTable
ALTER TABLE "product" ADD COLUMN     "replacementCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "baseMarginPercentage" DECIMAL(5,2) NOT NULL,
    "roundingRule" TEXT NOT NULL DEFAULT 'SMART_HUNDREDS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_item" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT,
    "overrideMarginPercentage" DECIMAL(5,2),
    "fixedPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "setting_key_key" ON "setting"("key");

-- CreateIndex
CREATE INDEX "price_list_isActive_idx" ON "price_list"("isActive");

-- CreateIndex
CREATE INDEX "price_list_isPublic_idx" ON "price_list"("isPublic");

-- CreateIndex
CREATE INDEX "price_list_item_priceListId_idx" ON "price_list_item"("priceListId");

-- CreateIndex
CREATE INDEX "price_list_item_productId_idx" ON "price_list_item"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_item_priceListId_productId_key" ON "price_list_item"("priceListId", "productId");

-- AddForeignKey
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
