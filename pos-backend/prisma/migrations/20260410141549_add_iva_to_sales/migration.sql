-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN "defaultIvaTaxId" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "sellerName" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "paymentBreakdown" TEXT,
    "ivaTaxId" INTEGER,
    "taxAmount" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_ivaTaxId_fkey" FOREIGN KEY ("ivaTaxId") REFERENCES "Tax" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("clientId", "createdAt", "id", "paymentBreakdown", "paymentMethod", "sellerName", "tenantId", "total") SELECT "clientId", "createdAt", "id", "paymentBreakdown", "paymentMethod", "sellerName", "tenantId", "total" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
