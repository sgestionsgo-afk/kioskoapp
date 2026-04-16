-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storeName" TEXT NOT NULL DEFAULT 'Mi Tienda',
    "storeEmail" TEXT,
    "storePhone" TEXT,
    "storeAddress" TEXT,
    "storeCity" TEXT,
    "storeProvince" TEXT,
    "storePostalCode" TEXT,
    "storeCountry" TEXT NOT NULL DEFAULT 'Argentina',
    "cuit" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'FC',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "logo" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tax" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IVA',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BranchSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "manager" TEXT,
    "isMainBranch" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PromotionSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" REAL NOT NULL,
    "conditions" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
