-- Add missing columns to invoice table
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "customerDoc" TEXT;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "customerDocType" TEXT;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "iva21" DECIMAL(10,2);
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "iva105" DECIMAL(10,2);
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "exemptions" JSONB;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "perceptions" JSONB;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "invoice_type_idx" ON "invoice"("type");
CREATE INDEX IF NOT EXISTS "invoice_issuedAt_idx" ON "invoice"("issuedAt");
