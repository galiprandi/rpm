-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneAlt" TEXT,
    "email" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_make" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_model" (
    "id" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "years" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "makeId" TEXT,
    "modelId" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "equipmentName" TEXT,
    "equipmentType" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseCost" DECIMAL(10,2) NOT NULL,
    "timeMinutes" INTEGER NOT NULL DEFAULT 60,
    "vehicleFactor" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "technicianId" TEXT,
    "entryChecklist" JSONB,
    "exitChecklist" JSONB,
    "entryPhotos" TEXT[],
    "exitPhotos" TEXT[],
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentNotes" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "totalProducts" DECIMAL(10,2) NOT NULL,
    "totalServices" DECIMAL(10,2) NOT NULL,
    "invoiceId" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_item" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "work_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_phone_idx" ON "customer"("phone");

-- CreateIndex
CREATE INDEX "customer_documentNumber_idx" ON "customer"("documentNumber");

-- CreateIndex
CREATE INDEX "customer_fullName_idx" ON "customer"("fullName");

-- CreateIndex
CREATE INDEX "vehicle_make_normalizedName_idx" ON "vehicle_make"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_make_normalizedName_key" ON "vehicle_make"("normalizedName");

-- CreateIndex
CREATE INDEX "vehicle_model_makeId_idx" ON "vehicle_model"("makeId");

-- CreateIndex
CREATE INDEX "vehicle_model_normalizedName_idx" ON "vehicle_model"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_model_makeId_normalizedName_key" ON "vehicle_model"("makeId", "normalizedName");

-- CreateIndex
CREATE INDEX "vehicle_customerId_idx" ON "vehicle"("customerId");

-- CreateIndex
CREATE INDEX "vehicle_identifier_idx" ON "vehicle"("identifier");

-- CreateIndex
CREATE INDEX "vehicle_category_idx" ON "vehicle"("category");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_identifier_customerId_key" ON "vehicle"("identifier", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "service_name_key" ON "service"("name");

-- CreateIndex
CREATE INDEX "service_isActive_idx" ON "service"("isActive");

-- CreateIndex
CREATE INDEX "work_order_customerId_idx" ON "work_order"("customerId");

-- CreateIndex
CREATE INDEX "work_order_vehicleId_idx" ON "work_order"("vehicleId");

-- CreateIndex
CREATE INDEX "work_order_technicianId_idx" ON "work_order"("technicianId");

-- CreateIndex
CREATE INDEX "work_order_status_idx" ON "work_order"("status");

-- CreateIndex
CREATE INDEX "work_order_scheduledDate_idx" ON "work_order"("scheduledDate");

-- CreateIndex
CREATE INDEX "work_order_createdAt_idx" ON "work_order"("createdAt");

-- CreateIndex
CREATE INDEX "work_order_item_workOrderId_idx" ON "work_order_item"("workOrderId");

-- CreateIndex
CREATE INDEX "work_order_item_productId_idx" ON "work_order_item"("productId");

-- CreateIndex
CREATE INDEX "work_order_item_serviceId_idx" ON "work_order_item"("serviceId");

-- CreateIndex
CREATE INDEX "photo_workOrderId_idx" ON "photo"("workOrderId");

-- CreateIndex
CREATE INDEX "photo_type_idx" ON "photo"("type");

-- AddForeignKey
ALTER TABLE "vehicle_model" ADD CONSTRAINT "vehicle_model_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "vehicle_make"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "vehicle_make"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
