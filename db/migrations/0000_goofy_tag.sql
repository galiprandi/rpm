CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "balance_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"customerId" text NOT NULL,
	"oldBalance" numeric(10, 2) NOT NULL,
	"newBalance" numeric(10, 2) NOT NULL,
	"driftAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"source" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_movement" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text NOT NULL,
	"referenceId" text,
	"referenceType" text,
	"reason" text,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" text NOT NULL,
	"responsibleId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"defaultMarginPercent" double precision DEFAULT 40 NOT NULL,
	"color" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_update_batch" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"userName" text,
	"filtersApplied" jsonb NOT NULL,
	"adjustmentType" text NOT NULL,
	"adjustmentValue" numeric(10, 2) NOT NULL,
	"itemsAffected" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_note" (
	"id" text PRIMARY KEY NOT NULL,
	"invoiceId" text,
	"originalSaleId" text NOT NULL,
	"originalSaleType" text NOT NULL,
	"customerId" text NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"refundMethod" text NOT NULL,
	"cashAmount" numeric(10, 2),
	"accountCreditAmount" numeric(10, 2),
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" text NOT NULL,
	"paymentMethodId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_note_item" (
	"id" text PRIMARY KEY NOT NULL,
	"creditNoteId" text NOT NULL,
	"productId" text,
	"serviceId" text,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" numeric(10, 2) NOT NULL,
	"totalPrice" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text,
	"phoneAlt" text,
	"email" text,
	"address" text,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"billingData" jsonb,
	"name" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "direct_sale" (
	"id" text PRIMARY KEY NOT NULL,
	"customerId" text,
	"customerName" text NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "direct_sale_item" (
	"id" text PRIMARY KEY NOT NULL,
	"directSaleId" text NOT NULL,
	"productId" text,
	"serviceId" text,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" numeric(10, 2) NOT NULL,
	"totalPrice" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "direct_sale_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"directSaleId" text NOT NULL,
	"paymentMethodId" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_count_item" (
	"id" text PRIMARY KEY NOT NULL,
	"operativeId" text NOT NULL,
	"productId" text NOT NULL,
	"theoreticalStock" integer NOT NULL,
	"countedStock" integer,
	"previousLocation" text,
	"newLocation" text,
	"isFound" boolean DEFAULT false NOT NULL,
	"reportedAt" timestamp(3),
	"reportedBy" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_count_operative" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"itemCount" integer NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"finishedAt" timestamp(3),
	"approvedAt" timestamp(3),
	"approvedBy" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"type" text NOT NULL,
	"referenceId" text NOT NULL,
	"referenceType" text NOT NULL,
	"customerId" text,
	"customerName" text NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2),
	"total" numeric(10, 2) NOT NULL,
	"afipData" jsonb,
	"status" text NOT NULL,
	"issuedAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" text NOT NULL,
	"customerDoc" text,
	"customerDocType" text,
	"iva21" numeric(10, 2),
	"iva105" numeric(10, 2),
	"exemptions" jsonb,
	"perceptions" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"workOrderId" text NOT NULL,
	"paymentMethodId" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_method" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "photo" (
	"id" text PRIMARY KEY NOT NULL,
	"workOrderId" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_list" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"startDate" timestamp(3),
	"endDate" timestamp(3),
	"baseMarginPercentage" numeric(5, 2) NOT NULL,
	"roundingRule" text DEFAULT 'SMART_HUNDREDS' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_list_item" (
	"id" text PRIMARY KEY NOT NULL,
	"priceListId" text NOT NULL,
	"productId" text,
	"overrideMarginPercentage" numeric(5, 2),
	"fixedPrice" numeric(10, 2),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"description" text,
	"costPrice" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"minStock" integer DEFAULT 0 NOT NULL,
	"barcode" text,
	"location" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"categoryId" text NOT NULL,
	"supplierId" text,
	"lastMovementAt" timestamp(3),
	"replacementCost" numeric(10, 2) NOT NULL,
	"imageBranch" text DEFAULT 'main',
	"imageCommit" text,
	"imageUrl" text,
	"lastCountedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_voucher" (
	"id" text PRIMARY KEY NOT NULL,
	"supplierId" text NOT NULL,
	"letter" text NOT NULL,
	"number" text NOT NULL,
	"date" timestamp(3) NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"paymentMethodId" text,
	"notes" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"finalizedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_voucher_item" (
	"id" text PRIMARY KEY NOT NULL,
	"voucherId" text NOT NULL,
	"productId" text NOT NULL,
	"productName" text NOT NULL,
	"quantity" integer NOT NULL,
	"unitCost" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"priceListData" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"baseCost" numeric(10, 2) NOT NULL,
	"timeMinutes" integer DEFAULT 60 NOT NULL,
	"vehicleFactor" numeric(3, 2) DEFAULT '1.0' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_movement" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"userId" text,
	"userName" text,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previousStock" integer NOT NULL,
	"newStock" integer NOT NULL,
	"reason" text NOT NULL,
	"reasonDetails" text,
	"salePrice" numeric(10, 2),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contactName" text,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"cuit" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_role" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"name" text,
	"notes" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"lastLogin" timestamp(3),
	"image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"category" text NOT NULL,
	"makeId" text,
	"modelId" text,
	"year" integer,
	"color" text,
	"equipmentName" text,
	"equipmentType" text,
	"description" text,
	"notes" text,
	"customerId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_make" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalizedName" text NOT NULL,
	"category" text[],
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_model" (
	"id" text PRIMARY KEY NOT NULL,
	"makeId" text NOT NULL,
	"name" text NOT NULL,
	"normalizedName" text NOT NULL,
	"years" integer[],
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"customerId" text NOT NULL,
	"vehicleId" text NOT NULL,
	"technicianId" text,
	"entryChecklist" jsonb,
	"exitChecklist" jsonb,
	"entryPhotos" text[],
	"exitPhotos" text[],
	"scheduledDate" timestamp(3),
	"startedAt" timestamp(3),
	"completedAt" timestamp(3),
	"deliveredAt" timestamp(3),
	"paymentMethod" text,
	"paymentNotes" text,
	"total" numeric(10, 2) NOT NULL,
	"totalProducts" numeric(10, 2) NOT NULL,
	"totalServices" numeric(10, 2) NOT NULL,
	"invoiceId" text,
	"notes" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"source" text DEFAULT 'IN_PERSON' NOT NULL,
	"fuelLevel" integer,
	"odometerValue" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_audit_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workOrderId" text NOT NULL,
	"fieldName" text NOT NULL,
	"oldValue" text,
	"newValue" text,
	"changedBy" text NOT NULL,
	"changedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ipAddress" text,
	"userAgent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"workOrderId" text NOT NULL,
	"type" text NOT NULL,
	"productId" text,
	"serviceId" text,
	"quantity" integer NOT NULL,
	"unitPrice" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"isManualPrice" boolean DEFAULT false NOT NULL,
	"priceListId" text,
	"name" text,
	"isManualName" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "balance_audit" ADD CONSTRAINT "balance_audit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_note_item" ADD CONSTRAINT "credit_note_item_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "public"."credit_note"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_note_item" ADD CONSTRAINT "credit_note_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_note_item" ADD CONSTRAINT "credit_note_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "direct_sale" ADD CONSTRAINT "direct_sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "direct_sale_item" ADD CONSTRAINT "direct_sale_item_directSaleId_fkey" FOREIGN KEY ("directSaleId") REFERENCES "public"."direct_sale"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "direct_sale_item" ADD CONSTRAINT "direct_sale_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "direct_sale_item" ADD CONSTRAINT "direct_sale_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "direct_sale_payment" ADD CONSTRAINT "direct_sale_payment_directSaleId_fkey" FOREIGN KEY ("directSaleId") REFERENCES "public"."direct_sale"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "direct_sale_payment" ADD CONSTRAINT "direct_sale_payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inventory_count_item" ADD CONSTRAINT "inventory_count_item_operativeId_fkey" FOREIGN KEY ("operativeId") REFERENCES "public"."inventory_count_operative"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inventory_count_item" ADD CONSTRAINT "inventory_count_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."work_order"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "photo" ADD CONSTRAINT "photo_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."work_order"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "public"."price_list"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."supplier"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "purchase_voucher" ADD CONSTRAINT "purchase_voucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "purchase_voucher" ADD CONSTRAINT "purchase_voucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."supplier"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "purchase_voucher_item" ADD CONSTRAINT "purchase_voucher_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "purchase_voucher_item" ADD CONSTRAINT "purchase_voucher_item_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."purchase_voucher"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."vehicle_make"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."vehicle_model"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vehicle_model" ADD CONSTRAINT "vehicle_model_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."vehicle_make"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_order_audit_log" ADD CONSTRAINT "work_order_audit_log_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."work_order"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."work_order"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "balance_audit_createdAt_idx" ON "balance_audit" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "balance_audit_customerId_idx" ON "balance_audit" USING btree ("customerId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cash_movement_createdAt_idx" ON "cash_movement" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cash_movement_referenceId_idx" ON "cash_movement" USING btree ("referenceId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cash_movement_responsibleId_idx" ON "cash_movement" USING btree ("responsibleId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cash_movement_type_idx" ON "cash_movement" USING btree ("type" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "category_name_key" ON "category" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_sortOrder_idx" ON "category" USING btree ("sortOrder" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_update_batch_createdAt_idx" ON "cost_update_batch" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_update_batch_userId_idx" ON "cost_update_batch" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_customerId_idx" ON "credit_note" USING btree ("customerId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_invoiceId_idx" ON "credit_note" USING btree ("invoiceId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_note_invoiceId_key" ON "credit_note" USING btree ("invoiceId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_originalSaleId_originalSaleType_idx" ON "credit_note" USING btree ("originalSaleId" text_ops,"originalSaleType" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_status_idx" ON "credit_note" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_item_creditNoteId_idx" ON "credit_note_item" USING btree ("creditNoteId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_item_productId_idx" ON "credit_note_item" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_note_item_serviceId_idx" ON "credit_note_item" USING btree ("serviceId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_balance_idx" ON "customer" USING btree ("balance" numeric_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_name_idx" ON "customer" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_phone_idx" ON "customer" USING btree ("phone" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_createdAt_idx" ON "direct_sale" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_customerId_idx" ON "direct_sale" USING btree ("customerId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_item_directSaleId_idx" ON "direct_sale_item" USING btree ("directSaleId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_item_productId_idx" ON "direct_sale_item" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_item_serviceId_idx" ON "direct_sale_item" USING btree ("serviceId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_payment_directSaleId_idx" ON "direct_sale_payment" USING btree ("directSaleId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "direct_sale_payment_paymentMethodId_idx" ON "direct_sale_payment" USING btree ("paymentMethodId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_count_item_operativeId_idx" ON "inventory_count_item" USING btree ("operativeId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_count_item_productId_idx" ON "inventory_count_item" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_count_operative_createdAt_idx" ON "inventory_count_operative" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_count_operative_status_idx" ON "inventory_count_operative" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_issuedAt_idx" ON "invoice" USING btree ("issuedAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_number_idx" ON "invoice" USING btree ("number" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_number_key" ON "invoice" USING btree ("number" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_referenceId_idx" ON "invoice" USING btree ("referenceId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_status_idx" ON "invoice" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_type_idx" ON "invoice" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_paymentMethodId_idx" ON "payment" USING btree ("paymentMethodId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_workOrderId_idx" ON "payment" USING btree ("workOrderId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_method_code_key" ON "payment_method" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_method_isActive_idx" ON "payment_method" USING btree ("isActive" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_method_name_key" ON "payment_method" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_method_sortOrder_idx" ON "payment_method" USING btree ("sortOrder" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "photo_type_idx" ON "photo" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "photo_workOrderId_idx" ON "photo" USING btree ("workOrderId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_list_isActive_idx" ON "price_list" USING btree ("isActive" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_list_isPublic_idx" ON "price_list" USING btree ("isPublic" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_list_item_priceListId_idx" ON "price_list_item" USING btree ("priceListId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "price_list_item_priceListId_productId_key" ON "price_list_item" USING btree ("priceListId" text_ops,"productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_list_item_productId_idx" ON "price_list_item" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_categoryId_idx" ON "product" USING btree ("categoryId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_imageUrl_idx" ON "product" USING btree ("imageUrl" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_isActive_idx" ON "product" USING btree ("isActive" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_lastMovementAt_idx" ON "product" USING btree ("lastMovementAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_name_idx" ON "product" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sku_idx" ON "product" USING btree ("sku" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_sku_key" ON "product" USING btree ("sku" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_stock_minStock_idx" ON "product" USING btree ("stock" int4_ops,"minStock" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_supplierId_idx" ON "product" USING btree ("supplierId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_voucher_createdAt_idx" ON "purchase_voucher" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_voucher_status_idx" ON "purchase_voucher" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_voucher_supplierId_idx" ON "purchase_voucher" USING btree ("supplierId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_voucher_supplierId_letter_number_key" ON "purchase_voucher" USING btree ("supplierId" text_ops,"letter" text_ops,"number" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_voucher_item_productId_idx" ON "purchase_voucher_item" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_voucher_item_voucherId_idx" ON "purchase_voucher_item" USING btree ("voucherId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_voucher_item_voucherId_productId_key" ON "purchase_voucher_item" USING btree ("voucherId" text_ops,"productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_isActive_idx" ON "service" USING btree ("isActive" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_name_key" ON "service" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "setting_key_key" ON "setting" USING btree ("key" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movement_createdAt_idx" ON "stock_movement" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movement_productId_idx" ON "stock_movement" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movement_type_idx" ON "stock_movement" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_isActive_idx" ON "supplier" USING btree ("isActive" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_name_idx" ON "supplier" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_name_key" ON "supplier" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_email_idx" ON "user_role" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_role_email_key" ON "user_role" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_role_idx" ON "user_role" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_category_idx" ON "vehicle" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_customerId_idx" ON "vehicle" USING btree ("customerId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_identifier_customerId_key" ON "vehicle" USING btree ("identifier" text_ops,"customerId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_identifier_idx" ON "vehicle" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_make_normalizedName_idx" ON "vehicle_make" USING btree ("normalizedName" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_make_normalizedName_key" ON "vehicle_make" USING btree ("normalizedName" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_model_makeId_idx" ON "vehicle_model" USING btree ("makeId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_model_makeId_normalizedName_key" ON "vehicle_model" USING btree ("makeId" text_ops,"normalizedName" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_model_normalizedName_idx" ON "vehicle_model" USING btree ("normalizedName" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_createdAt_idx" ON "work_order" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_customerId_idx" ON "work_order" USING btree ("customerId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_scheduledDate_idx" ON "work_order" USING btree ("scheduledDate" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_status_idx" ON "work_order" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_technicianId_idx" ON "work_order" USING btree ("technicianId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_vehicleId_idx" ON "work_order" USING btree ("vehicleId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_audit_log_changedAt_idx" ON "work_order_audit_log" USING btree ("changedAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_audit_log_changedBy_idx" ON "work_order_audit_log" USING btree ("changedBy" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_audit_log_fieldName_idx" ON "work_order_audit_log" USING btree ("fieldName" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_audit_log_workOrderId_idx" ON "work_order_audit_log" USING btree ("workOrderId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_item_productId_idx" ON "work_order_item" USING btree ("productId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_item_serviceId_idx" ON "work_order_item" USING btree ("serviceId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_item_workOrderId_idx" ON "work_order_item" USING btree ("workOrderId" text_ops);