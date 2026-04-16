/*
  Warnings:

  - You are about to drop the column `type` on the `Client` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "cuit" TEXT,
    "ivaCategory" TEXT NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "lastPurchaseDate" DATETIME
);
INSERT INTO "new_Client" ("address", "createdAt", "email", "id", "lastPurchaseDate", "name", "phone", "purchaseCount", "totalSpent", "updatedAt") SELECT "address", "createdAt", "email", "id", "lastPurchaseDate", "name", "phone", "purchaseCount", "totalSpent", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
