-- CreateEnum
CREATE TYPE "QualificationCategory" AS ENUM ('SCHOOL', 'PRE_UNIVERSITY', 'SKILLS_CERT', 'DIPLOMA', 'DEGREE');

-- CreateEnum
CREATE TYPE "AwardingBodyType" AS ENUM ('MOE', 'MOHE', 'DSD', 'INSTITUTION', 'FOREIGN');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('PUBLIC_UNI', 'PRIVATE_UNI', 'POLYTECHNIC', 'COMMUNITY_COLLEGE', 'ILP', 'TECHNICAL_INSTITUTE', 'FOREIGN');

-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('FULL', 'PROVISIONAL', 'NOT_IN_REGISTER', 'PRE_1997', 'FAILED_ACCREDITATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('DIRECT_ENTRY', 'CREDIT_TRANSFER', 'CREDIT_EXEMPTION', 'APEL_C', 'APEL_A', 'NONE');

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMs" TEXT NOT NULL,
    "mqfLevel" INTEGER NOT NULL,
    "category" "QualificationCategory" NOT NULL,
    "awardingBodyType" "AwardingBodyType" NOT NULL,
    "typicalDurationMonthsMin" INTEGER,
    "typicalDurationMonthsMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMs" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "state" TEXT,
    "mqrProviderRef" TEXT,
    "policySourceUrl" TEXT,
    "policyDocumentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "qualificationId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMs" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "mqrRecordUrl" TEXT,
    "accreditationStatus" "AccreditationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "totalCredits" INTEGER,
    "durationMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressionRule" (
    "id" TEXT NOT NULL,
    "fromQualificationId" TEXT,
    "fromProgrammeId" TEXT,
    "toProgrammeId" TEXT NOT NULL,
    "transferType" "TransferType" NOT NULL,
    "maxTransferPercent" DECIMAL(5,2),
    "maxTransferCredits" INTEGER,
    "minimumCgpa" DECIMAL(3,2),
    "requirements" JSONB NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDocumentDate" TIMESTAMP(3) NOT NULL,
    "verifiedOn" TIMESTAMP(3) NOT NULL,
    "recheckDueOn" TIMESTAMP(3) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caveat" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textMs" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Caveat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_slug_key" ON "Qualification"("slug");

-- CreateIndex
CREATE INDEX "Qualification_mqfLevel_idx" ON "Qualification"("mqfLevel");

-- CreateIndex
CREATE INDEX "Qualification_category_idx" ON "Qualification"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE INDEX "Institution_type_idx" ON "Institution"("type");

-- CreateIndex
CREATE INDEX "Institution_state_idx" ON "Institution"("state");

-- CreateIndex
CREATE INDEX "Programme_field_idx" ON "Programme"("field");

-- CreateIndex
CREATE INDEX "Programme_accreditationStatus_idx" ON "Programme"("accreditationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_institutionId_slug_key" ON "Programme"("institutionId", "slug");

-- CreateIndex
CREATE INDEX "ProgressionRule_fromQualificationId_effectiveTo_idx" ON "ProgressionRule"("fromQualificationId", "effectiveTo");

-- CreateIndex
CREATE INDEX "ProgressionRule_fromProgrammeId_effectiveTo_idx" ON "ProgressionRule"("fromProgrammeId", "effectiveTo");

-- CreateIndex
CREATE INDEX "ProgressionRule_toProgrammeId_idx" ON "ProgressionRule"("toProgrammeId");

-- CreateIndex
CREATE INDEX "ProgressionRule_recheckDueOn_idx" ON "ProgressionRule"("recheckDueOn");

-- CreateIndex
CREATE INDEX "Caveat_ruleId_idx" ON "Caveat"("ruleId");

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionRule" ADD CONSTRAINT "ProgressionRule_fromQualificationId_fkey" FOREIGN KEY ("fromQualificationId") REFERENCES "Qualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionRule" ADD CONSTRAINT "ProgressionRule_fromProgrammeId_fkey" FOREIGN KEY ("fromProgrammeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionRule" ADD CONSTRAINT "ProgressionRule_toProgrammeId_fkey" FOREIGN KEY ("toProgrammeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caveat" ADD CONSTRAINT "Caveat_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ProgressionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: a constraint Prisma's schema language cannot express.
--
-- A ProgressionRule starts EITHER from a kind of qualification ("any diploma")
-- OR from one specific programme at one institution ("UiTM's Diploma in
-- Computer Science") — never both, and never neither. Prisma can only mark both
-- columns optional, which would let a row exist with no origin at all, or with
-- two conflicting ones.
--
-- Enforced here rather than only in application code because bad data does not
-- throw: a rule with no origin would silently never match any query, and would
-- look like a coverage gap rather than a bug.
--
-- Mirrored as a pure validation function in src/lib/rules/progression-source.ts
-- so the admin form can reject it with a readable message before it ever
-- reaches the database. The database is the backstop, not the error surface.
-- ---------------------------------------------------------------------------
ALTER TABLE "ProgressionRule"
  ADD CONSTRAINT "ProgressionRule_exactly_one_source"
  CHECK (num_nonnulls("fromQualificationId", "fromProgrammeId") = 1);
