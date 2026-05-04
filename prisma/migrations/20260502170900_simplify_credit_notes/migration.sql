-- Simplify credit_note: remove invoice link, cashAmount, accountCreditAmount; change status default; add FK to payment_method

-- Drop existing indexes/constraints related to removed columns
DROP INDEX IF EXISTS "credit_note_invoiceId_idx";
DROP INDEX IF EXISTS "credit_note_invoiceId_key";

-- Drop legacy columns
ALTER TABLE "credit_note" DROP COLUMN IF EXISTS "invoiceId";
ALTER TABLE "credit_note" DROP COLUMN IF EXISTS "cashAmount";
ALTER TABLE "credit_note" DROP COLUMN IF EXISTS "accountCreditAmount";

-- Change status default to ISSUED (no more DRAFT state)
ALTER TABLE "credit_note" ALTER COLUMN "status" SET DEFAULT 'ISSUED';

-- Add foreign key constraint for paymentMethodId -> payment_method
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on paymentMethodId
CREATE INDEX "credit_note_paymentMethodId_idx" ON "credit_note"("paymentMethodId");
