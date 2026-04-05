-- AlterTable
ALTER TABLE "work_order_item" ADD COLUMN     "isManualPrice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceListId" TEXT;
