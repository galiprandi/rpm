-- AlterTable
ALTER TABLE "purchase_voucher_item" ADD COLUMN IF NOT EXISTS "priceListData" JSONB;
