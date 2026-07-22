-- Migration: Add auto-update trigger for updatedAt columns
--
-- In Prisma, @updatedAt automatically set the timestamp on every INSERT and UPDATE.
-- With Drizzle, there's no equivalent — DEFAULT CURRENT_TIMESTAMP covers INSERTs
-- but not UPDATEs. This trigger replicates Prisma's behavior at the DB level.
--
-- The trigger fires BEFORE UPDATE on each table and sets updatedAt = NOW().
-- If the application code explicitly sets updatedAt, the trigger overrides it
-- (same behavior as Prisma's @updatedAt).

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
--> statement-breakpoint

CREATE TRIGGER update_account_updatedAt BEFORE UPDATE ON "account" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_category_updatedAt BEFORE UPDATE ON "category" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_customer_updatedAt BEFORE UPDATE ON "customer" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_inventory_count_operative_updatedAt BEFORE UPDATE ON "inventory_count_operative" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_payment_method_updatedAt BEFORE UPDATE ON "payment_method" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_price_list_updatedAt BEFORE UPDATE ON "price_list" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_price_list_item_updatedAt BEFORE UPDATE ON "price_list_item" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_product_updatedAt BEFORE UPDATE ON "product" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_purchase_voucher_updatedAt BEFORE UPDATE ON "purchase_voucher" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_purchase_voucher_item_updatedAt BEFORE UPDATE ON "purchase_voucher_item" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_service_updatedAt BEFORE UPDATE ON "service" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_session_updatedAt BEFORE UPDATE ON "session" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_setting_updatedAt BEFORE UPDATE ON "setting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_supplier_updatedAt BEFORE UPDATE ON "supplier" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_user_updatedAt BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_user_role_updatedAt BEFORE UPDATE ON "user_role" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_vehicle_updatedAt BEFORE UPDATE ON "vehicle" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_verification_updatedAt BEFORE UPDATE ON "verification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_work_order_updatedAt BEFORE UPDATE ON "work_order" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
