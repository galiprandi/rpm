-- Add name and isManualName columns to work_order_item
-- name: stores custom service description (e.g. "Reparacion de esterio Pionner")
-- isManualName: flag indicating the name was manually edited (anti-fraud trace)

ALTER TABLE "work_order_item" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "work_order_item" ADD COLUMN IF NOT EXISTS "isManualName" BOOLEAN NOT NULL DEFAULT false;
