-- AlterTable: add share token + signature fields used by the contract signing flow
ALTER TABLE "Contract" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "Contract" ADD COLUMN "sharedAt" DATETIME;
ALTER TABLE "Contract" ADD COLUMN "signatureData" TEXT;

-- Indexes (unique on shareToken + lookup index)
CREATE UNIQUE INDEX "Contract_shareToken_key" ON "Contract"("shareToken");
CREATE INDEX "Contract_shareToken_idx" ON "Contract"("shareToken");
