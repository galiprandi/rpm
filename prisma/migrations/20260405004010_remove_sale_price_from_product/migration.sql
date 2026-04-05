/*
  Warnings:

  - You are about to drop the column `salePrice` on the `product` table. All the data in the column will be lost.
  - Made the column `replacementCost` on table `product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "salePrice",
ALTER COLUMN "replacementCost" SET NOT NULL;
