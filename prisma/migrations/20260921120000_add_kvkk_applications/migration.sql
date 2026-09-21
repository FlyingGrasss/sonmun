-- CreateTable
CREATE TABLE "KvkkApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "requestDetails" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KvkkApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KvkkApplication_email_createdAt_idx" ON "KvkkApplication"("email", "createdAt");
