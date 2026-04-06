-- CreateTable
CREATE TABLE "work_order_audit_log" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "work_order_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_audit_log_workOrderId_idx" ON "work_order_audit_log"("workOrderId");

-- CreateIndex
CREATE INDEX "work_order_audit_log_changedAt_idx" ON "work_order_audit_log"("changedAt");

-- CreateIndex
CREATE INDEX "work_order_audit_log_fieldName_idx" ON "work_order_audit_log"("fieldName");

-- CreateIndex
CREATE INDEX "work_order_audit_log_changedBy_idx" ON "work_order_audit_log"("changedBy");

-- AddForeignKey
ALTER TABLE "work_order_audit_log" ADD CONSTRAINT "work_order_audit_log_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
