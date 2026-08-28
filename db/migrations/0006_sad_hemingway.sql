ALTER TABLE "credit_note" DROP CONSTRAINT "credit_note_customerId_fkey";
--> statement-breakpoint
ALTER TABLE "credit_note" ALTER COLUMN "customerId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE cascade;