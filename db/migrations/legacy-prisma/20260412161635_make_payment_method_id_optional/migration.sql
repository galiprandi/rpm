-- DropForeignKey
ALTER TABLE "direct_sale_payment" DROP CONSTRAINT "direct_sale_payment_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "direct_sale_payment" ALTER COLUMN "paymentMethodId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "direct_sale_payment" ADD CONSTRAINT "direct_sale_payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;
