-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "source" TEXT,
    "trelloCardId" TEXT,
    "jotFormData" JSONB,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "timeline" TEXT,
    "budget" TEXT,
    "financingInterested" BOOLEAN NOT NULL DEFAULT false,
    "hasSpecificFeatures" BOOLEAN NOT NULL DEFAULT false,
    "homeownerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "inServiceArea" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "prepToken" TEXT,
    "prepTokenSent" DATETIME,
    "prepCompleted" DATETIME
);

-- CreateTable
CREATE TABLE "DesignProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING_INFO',
    "templateUsed" TEXT,
    "lotWidth" REAL,
    "lotDepth" REAL,
    "setbackFront" REAL,
    "setbackSide" REAL,
    "setbackRear" REAL,
    "poolStyle" TEXT,
    "poolFeatures" JSONB,
    "estimatedSize" TEXT,
    "zoning" TEXT,
    "obstacles" TEXT,
    "surveyReceived" BOOLEAN NOT NULL DEFAULT false,
    "photosReceived" BOOLEAN NOT NULL DEFAULT false,
    "surveyDate" DATETIME,
    "photosDate" DATETIME,
    "designStarted" DATETIME,
    "designCompleted" DATETIME,
    "rendersCompleted" DATETIME,
    "notes" TEXT,
    CONSTRAINT "DesignProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "designProjectId" TEXT,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "angle" TEXT,
    CONSTRAINT "ClientFile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientFile_designProjectId_fkey" FOREIGN KEY ("designProjectId") REFERENCES "DesignProject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "designProjectId" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "sourceScreenshotId" TEXT,
    "timeOfDay" TEXT,
    "cameraAngle" TEXT,
    "rating" INTEGER,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "RenderJob_designProjectId_fkey" FOREIGN KEY ("designProjectId") REFERENCES "DesignProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RenderJob_sourceScreenshotId_fkey" FOREIGN KEY ("sourceScreenshotId") REFERENCES "ClientFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "newLeads" INTEGER NOT NULL DEFAULT 0,
    "formsCompleted" INTEGER NOT NULL DEFAULT 0,
    "qualifyingCalls" INTEGER NOT NULL DEFAULT 0,
    "designsStarted" INTEGER NOT NULL DEFAULT 0,
    "appointmentsSet" INTEGER NOT NULL DEFAULT 0,
    "proposalsSent" INTEGER NOT NULL DEFAULT 0,
    "dealsClosed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_RenderOutputs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RenderOutputs_A_fkey" FOREIGN KEY ("A") REFERENCES "ClientFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RenderOutputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RenderJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_prepToken_key" ON "Client"("prepToken");

-- CreateIndex
CREATE INDEX "Client_leadScore_idx" ON "Client"("leadScore");

-- CreateIndex
CREATE INDEX "Client_prepToken_idx" ON "Client"("prepToken");

-- CreateIndex
CREATE UNIQUE INDEX "DesignProject_clientId_key" ON "DesignProject"("clientId");

-- CreateIndex
CREATE INDEX "ClientFile_clientId_idx" ON "ClientFile"("clientId");

-- CreateIndex
CREATE INDEX "ClientFile_designProjectId_idx" ON "ClientFile"("designProjectId");

-- CreateIndex
CREATE INDEX "ClientFile_category_idx" ON "ClientFile"("category");

-- CreateIndex
CREATE INDEX "RenderJob_designProjectId_idx" ON "RenderJob"("designProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMetric_weekStartDate_key" ON "WeeklyMetric"("weekStartDate");

-- CreateIndex
CREATE INDEX "PromptTemplate_category_idx" ON "PromptTemplate"("category");

-- CreateIndex
CREATE UNIQUE INDEX "_RenderOutputs_AB_unique" ON "_RenderOutputs"("A", "B");

-- CreateIndex
CREATE INDEX "_RenderOutputs_B_index" ON "_RenderOutputs"("B");
