-- Add inventory count tables and product.lastCountedAt

-- Add lastCountedAt to product
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "lastCountedAt" TIMESTAMP(3);

-- Create inventory_count_operative table
CREATE TABLE IF NOT EXISTS "inventory_count_operative" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "itemCount" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "inventory_count_operative_pkey" PRIMARY KEY ("id")
);

-- Create indexes for inventory_count_operative
CREATE INDEX IF NOT EXISTS "inventory_count_operative_status_idx" ON "inventory_count_operative"("status");
CREATE INDEX IF NOT EXISTS "inventory_count_operative_createdAt_idx" ON "inventory_count_operative"("createdAt");

-- Create inventory_count_item table
CREATE TABLE IF NOT EXISTS "inventory_count_item" (
    "id" TEXT NOT NULL,
    "operativeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "theoreticalStock" INTEGER NOT NULL,
    "countedStock" INTEGER,
    "previousLocation" TEXT,
    "newLocation" TEXT,
    "isFound" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMP(3),
    "reportedBy" TEXT,

    CONSTRAINT "inventory_count_item_pkey" PRIMARY KEY ("id")
);

-- Create indexes for inventory_count_item
CREATE INDEX IF NOT EXISTS "inventory_count_item_operativeId_idx" ON "inventory_count_item"("operativeId");
CREATE INDEX IF NOT EXISTS "inventory_count_item_productId_idx" ON "inventory_count_item"("productId");

-- Add foreign key constraints (idempotent using DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_count_item_operativeId_fkey'
    ) THEN
        ALTER TABLE "inventory_count_item" ADD CONSTRAINT "inventory_count_item_operativeId_fkey"
            FOREIGN KEY ("operativeId") REFERENCES "inventory_count_operative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_count_item_productId_fkey'
    ) THEN
        ALTER TABLE "inventory_count_item" ADD CONSTRAINT "inventory_count_item_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
