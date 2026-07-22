/*
  Warnings:

  - Made the column `paymentMethodId` on table `direct_sale_payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "direct_sale_payment" DROP CONSTRAINT "direct_sale_payment_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "direct_sale_payment" ALTER COLUMN "paymentMethodId" SET NOT NULL;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "imageBranch" TEXT DEFAULT 'main',
ADD COLUMN     "imageCommit" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "product_imageUrl_idx" ON "product"("imageUrl");

-- AddForeignKey
ALTER TABLE "direct_sale_payment" ADD CONSTRAINT "direct_sale_payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
