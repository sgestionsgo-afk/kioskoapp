-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isWeighable" BOOLEAN NOT NULL DEFAULT false,
    "pricePerKg" REAL,
    "price" REAL,
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "lastPurchaseDate" DATETIME
);

-- CreateTable
CREATE TABLE "ClientPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'DEBT_PAYMENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientPayment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "paymentBreakdown" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL DEFAULT 0,
    "price" REAL NOT NULL,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
