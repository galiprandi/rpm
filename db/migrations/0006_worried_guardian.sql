CREATE TABLE "afip_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoiceId" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"direction" text NOT NULL,
	"method" text NOT NULL,
	"payload" jsonb,
	"response" jsonb,
	"resultCode" text,
	"errorCode" text,
	"errorMessage" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "afip_log" ADD CONSTRAINT "afip_log_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "afip_log_invoiceId_idx" ON "afip_log" USING btree ("invoiceId" text_ops);--> statement-breakpoint
CREATE INDEX "afip_log_createdAt_idx" ON "afip_log" USING btree ("createdAt" timestamp_ops);