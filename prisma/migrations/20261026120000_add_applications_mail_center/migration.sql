-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceHash" TEXT,
    "applicationType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "school" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "givenCommittee" TEXT,
    "allocation" TEXT,
    "notes" TEXT,
    "answers" JSONB,
    "appliedAt" TIMESTAMP(3),
    "lastEmailSentAt" TIMESTAMP(3),
    "lastEmailStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "statusKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEmailLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateKey" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "resendId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_sourceKey_key" ON "Application"("sourceKey");

-- CreateIndex
CREATE INDEX "Application_applicationType_status_idx" ON "Application"("applicationType", "status");

-- CreateIndex
CREATE INDEX "Application_status_appliedAt_idx" ON "Application"("status", "appliedAt");

-- CreateIndex
CREATE INDEX "Application_email_idx" ON "Application"("email");

-- CreateIndex
CREATE INDEX "Application_appliedAt_idx" ON "Application"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_statusKey_key" ON "EmailTemplate"("statusKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationEmailLog_resendId_key" ON "ApplicationEmailLog"("resendId");

-- CreateIndex
CREATE INDEX "ApplicationEmailLog_applicationId_sentAt_idx" ON "ApplicationEmailLog"("applicationId", "sentAt");

-- CreateIndex
CREATE INDEX "ApplicationEmailLog_sentAt_idx" ON "ApplicationEmailLog"("sentAt");

-- AddForeignKey
ALTER TABLE "ApplicationEmailLog" ADD CONSTRAINT "ApplicationEmailLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Privacy hardening: these tables are only accessed through the app's owner connection.
-- RLS without policies blocks accidental PostgREST/anon exposure.
ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationEmailLog" ENABLE ROW LEVEL SECURITY;
