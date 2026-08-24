-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PoolBuild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT,
    "poolLength" REAL NOT NULL,
    "poolWidth" REAL NOT NULL,
    "deckLength" REAL NOT NULL,
    "deckWidth" REAL NOT NULL,
    "hasSpa" BOOLEAN NOT NULL DEFAULT false,
    "hasHeat" BOOLEAN NOT NULL DEFAULT false,
    "hasAutomation" BOOLEAN NOT NULL DEFAULT false,
    "isSalt" BOOLEAN NOT NULL DEFAULT false,
    "hasCage" BOOLEAN NOT NULL DEFAULT false,
    "hasWaterfall" BOOLEAN NOT NULL DEFAULT false,
    "hasSod" BOOLEAN NOT NULL DEFAULT false,
    "hasTreeRemoval" BOOLEAN NOT NULL DEFAULT false,
    "hasFireFeatures" BOOLEAN NOT NULL DEFAULT false,
    "hasInteriorUpgrade" BOOLEAN NOT NULL DEFAULT false,
    "deckMaterial" TEXT NOT NULL DEFAULT 'PAVER',
    "equipment" TEXT NOT NULL DEFAULT 'BASE',
    "spaCost" REAL NOT NULL DEFAULT 0,
    "heatCost" REAL NOT NULL DEFAULT 0,
    "sodCost" REAL NOT NULL DEFAULT 0,
    "cageCost" REAL NOT NULL DEFAULT 0,
    "waterfallCost" REAL NOT NULL DEFAULT 0,
    "treeRemovalCost" REAL NOT NULL DEFAULT 0,
    "fireFeaturesCost" REAL NOT NULL DEFAULT 0,
    "interiorUpgradeCost" REAL NOT NULL DEFAULT 0,
    "totalCOGS" REAL NOT NULL DEFAULT 0,
    "salePrice" REAL NOT NULL DEFAULT 0,
    "grossProfit" REAL NOT NULL DEFAULT 0,
    "marginPct" REAL NOT NULL DEFAULT 0,
    "notes" TEXT
);
INSERT INTO "new_PoolBuild" ("cageCost", "clientId", "createdAt", "deckLength", "deckMaterial", "deckWidth", "equipment", "grossProfit", "hasAutomation", "hasCage", "hasHeat", "hasSod", "hasSpa", "hasWaterfall", "heatCost", "id", "isSalt", "marginPct", "name", "notes", "poolLength", "poolWidth", "salePrice", "sodCost", "spaCost", "status", "totalCOGS", "updatedAt", "waterfallCost") SELECT "cageCost", "clientId", "createdAt", "deckLength", "deckMaterial", "deckWidth", "equipment", "grossProfit", "hasAutomation", "hasCage", "hasHeat", "hasSod", "hasSpa", "hasWaterfall", "heatCost", "id", "isSalt", "marginPct", "name", "notes", "poolLength", "poolWidth", "salePrice", "sodCost", "spaCost", "status", "totalCOGS", "updatedAt", "waterfallCost" FROM "PoolBuild";
DROP TABLE "PoolBuild";
ALTER TABLE "new_PoolBuild" RENAME TO "PoolBuild";
CREATE INDEX "PoolBuild_status_idx" ON "PoolBuild"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
