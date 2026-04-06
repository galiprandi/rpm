-- CreateTable
CREATE TABLE "cost_update_batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "filtersApplied" JSONB NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "adjustmentValue" DECIMAL(10,2) NOT NULL,
    "itemsAffected" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_update_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cost_update_batch_createdAt_idx" ON "cost_update_batch"("createdAt");

-- CreateIndex
CREATE INDEX "cost_update_batch_userId_idx" ON "cost_update_batch"("userId");
