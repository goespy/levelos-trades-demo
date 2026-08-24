-- CreateTable
CREATE TABLE "PoolTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bestFor" TEXT NOT NULL,
    "shape" TEXT,
    "features" TEXT
);

-- CreateTable
CREATE TABLE "PoolBuild" (
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
    "deckMaterial" TEXT NOT NULL DEFAULT 'PAVER',
    "equipment" TEXT NOT NULL DEFAULT 'BASE',
    "cageCost" REAL NOT NULL DEFAULT 0,
    "waterfallCost" REAL NOT NULL DEFAULT 0,
    "totalCOGS" REAL NOT NULL DEFAULT 0,
    "salePrice" REAL NOT NULL DEFAULT 0,
    "grossProfit" REAL NOT NULL DEFAULT 0,
    "marginPct" REAL NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "BuildLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" REAL NOT NULL,
    "total" REAL NOT NULL,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BuildLineItem_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "PoolBuild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "poolStyle" TEXT,
    "poolFeatures" TEXT,
    "poolLength" REAL,
    "poolWidth" REAL,
    "deckMaterial" TEXT,
    "lineItems" TEXT,
    "timeline" TEXT,
    "exclusions" TEXT,
    "notes" TEXT,
    "renderImages" TEXT
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "proposalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contractData" TEXT,
    "signedDate" DATETIME,
    "signedByClient" TEXT,
    "signedByOwner" TEXT,
    CONSTRAINT "Contract_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PoolBuild_status_idx" ON "PoolBuild"("status");

-- CreateIndex
CREATE INDEX "BuildLineItem_buildId_idx" ON "BuildLineItem"("buildId");

-- CreateIndex
CREATE INDEX "Proposal_clientId_idx" ON "Proposal"("clientId");

-- CreateIndex
CREATE INDEX "Proposal_buildId_idx" ON "Proposal"("buildId");

-- CreateIndex
CREATE INDEX "Contract_proposalId_idx" ON "Contract"("proposalId");
