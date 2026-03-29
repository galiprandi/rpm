-- Create Category table
CREATE TABLE IF NOT EXISTS "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- Create unique index on category name
CREATE UNIQUE INDEX IF NOT EXISTS "category_name_key" ON "category"("name");

-- Create index on sortOrder
CREATE INDEX IF NOT EXISTS "category_sortOrder_idx" ON "category"("sortOrder");

-- Create Product table
CREATE TABLE IF NOT EXISTS "product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "barcode" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- Create unique index on product SKU
CREATE UNIQUE INDEX IF NOT EXISTS "product_sku_key" ON "product"("sku");

-- Create indexes on product
CREATE INDEX IF NOT EXISTS "product_categoryId_idx" ON "product"("categoryId");
CREATE INDEX IF NOT EXISTS "product_sku_idx" ON "product"("sku");
CREATE INDEX IF NOT EXISTS "product_name_idx" ON "product"("name");
CREATE INDEX IF NOT EXISTS "product_isActive_idx" ON "product"("isActive");
CREATE INDEX IF NOT EXISTS "product_stock_minStock_idx" ON "product"("stock", "minStock");

-- Add foreign key constraint (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_categoryId_fkey'
    ) THEN
        ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey"
            FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
