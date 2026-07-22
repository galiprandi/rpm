-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "customer_balance_idx" ON "customer"("balance");
