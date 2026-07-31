ALTER TABLE "price_list" ADD COLUMN "basePriceListId" text;--> statement-breakpoint
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_basePriceListId_fkey" FOREIGN KEY ("basePriceListId") REFERENCES "public"."price_list"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "price_list_basePriceListId_idx" ON "price_list" USING btree ("basePriceListId" text_ops);