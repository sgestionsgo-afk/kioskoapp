-- AddCashRegisterModule: CreateTable CashRegister and CashMovement
-- Revenue tracking with multi-tenant isolation
-- Run: npx prisma migrate deploy

-- CreateEnum (if they don't exist yet)
DO $$ BEGIN
  CREATE TYPE "CashMovementType" AS ENUM ('SALE', 'INCOME', 'EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CHECK', 'CRYPTO', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable CashRegister
CREATE TABLE "CashRegister" (
    "id"               TEXT NOT NULL,
    "tenantId"         TEXT NOT NULL,
    "openedByUserId"   TEXT NOT NULL,
    "closedByUserId"   TEXT,
    "status"           TEXT NOT NULL DEFAULT 'OPEN',
    "openingAmount"    DOUBLE PRECISION NOT NULL,
    "closingAmount"    DOUBLE PRECISION,
    "expectedAmount"   DOUBLE PRECISION,
    "difference"       DOUBLE PRECISION,
    "openedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt"         TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable CashMovement
CREATE TABLE "CashMovement" (
    "id"               TEXT NOT NULL,
    "tenantId"         TEXT NOT NULL,
    "cashRegisterId"   TEXT NOT NULL,
    "type"             "CashMovementType" NOT NULL,
    "paymentMethod"    "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "amount"           DOUBLE PRECISION NOT NULL,
    "referenceId"      TEXT,
    "referenceType"    TEXT,
    "description"      TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex CashRegister
CREATE INDEX "CashRegister_tenantId_idx"        ON "CashRegister"("tenantId");
CREATE INDEX "CashRegister_status_idx"           ON "CashRegister"("status");
CREATE INDEX "CashRegister_openedByUserId_idx"   ON "CashRegister"("openedByUserId");
CREATE INDEX "CashRegister_closedByUserId_idx"   ON "CashRegister"("closedByUserId");
CREATE INDEX "CashRegister_openedAt_idx"         ON "CashRegister"("openedAt");

-- CreateIndex CashMovement
CREATE INDEX "CashMovement_tenantId_idx"         ON "CashMovement"("tenantId");
CREATE INDEX "CashMovement_cashRegisterId_idx"   ON "CashMovement"("cashRegisterId");
CREATE INDEX "CashMovement_type_idx"             ON "CashMovement"("type");
CREATE INDEX "CashMovement_paymentMethod_idx"    ON "CashMovement"("paymentMethod");
CREATE INDEX "CashMovement_referenceId_idx"      ON "CashMovement"("referenceId");

-- AddForeignKey CashRegister -> Tenant
ALTER TABLE "CashRegister"
  ADD CONSTRAINT "CashRegister_tenantId_fkey"
  FOREIGN KEY ("tenantId")
  REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CashRegister -> User (openedBy)
ALTER TABLE "CashRegister"
  ADD CONSTRAINT "CashRegister_openedByUserId_fkey"
  FOREIGN KEY ("openedByUserId")
  REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey CashRegister -> User (closedBy)
ALTER TABLE "CashRegister"
  ADD CONSTRAINT "CashRegister_closedByUserId_fkey"
  FOREIGN KEY ("closedByUserId")
  REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey CashMovement -> Tenant
ALTER TABLE "CashMovement"
  ADD CONSTRAINT "CashMovement_tenantId_fkey"
  FOREIGN KEY ("tenantId")
  REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CashMovement -> CashRegister
ALTER TABLE "CashMovement"
  ADD CONSTRAINT "CashMovement_cashRegisterId_fkey"
  FOREIGN KEY ("cashRegisterId")
  REFERENCES "CashRegister"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
