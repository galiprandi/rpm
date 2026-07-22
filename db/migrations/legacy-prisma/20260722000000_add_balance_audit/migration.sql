-- CreateTable
CREATE TABLE IF NOT EXISTS "balance_audit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "oldBalance" DECIMAL(10,2) NOT NULL,
    "newBalance" DECIMAL(10,2) NOT NULL,
    "driftAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "balance_audit_customerId_idx" ON "balance_audit"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "balance_audit_createdAt_idx" ON "balance_audit"("createdAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'balance_audit_customerId_fkey') THEN
    ALTER TABLE "balance_audit" ADD CONSTRAINT "balance_audit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
