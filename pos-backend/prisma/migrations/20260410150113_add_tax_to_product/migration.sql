-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isWeighable" BOOLEAN NOT NULL DEFAULT false,
    "pricePerKg" REAL,
    "price" REAL,
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "taxId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "isWeighable", "name", "price", "pricePerKg", "stock") SELECT "createdAt", "description", "id", "isWeighable", "name", "price", "pricePerKg", "stock" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
