-- CreateEnum
CREATE TYPE "MqfStatus" AS ENUM ('ASSIGNED', 'NOT_IN_FRAMEWORK', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Qualification" ADD COLUMN     "mqfStatus" "MqfStatus" NOT NULL DEFAULT 'UNKNOWN',
ALTER COLUMN "mqfLevel" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Qualification_mqfStatus_idx" ON "Qualification"("mqfStatus");

-- ---------------------------------------------------------------------------
-- Hand-written: backfill, then a constraint tying level to status.
--
-- Verified 2026-08-19 against the Malaysian Qualifications Framework 2nd
-- Edition (MQA). Paragraph 74: foundation and university preparatory
-- programmes, "Sijil Tinggi Persekolahan Malaysia, Matriculation and foreign
-- qualifications like A Levels ... are not included in the Framework". SPM is
-- not mentioned in the document at all.
--
-- These four rows previously asserted a level MQA declines to assign. The level
-- is cleared rather than corrected, because there is no correct value to put
-- there — the honest answer is "the framework does not assign one".
--
-- Done here rather than only in the seed so that a branch which runs
-- `migrate deploy` without seeding still ends up with correct data.
-- ---------------------------------------------------------------------------
UPDATE "Qualification"
   SET "mqfLevel" = NULL, "mqfStatus" = 'NOT_IN_FRAMEWORK'
 WHERE "slug" IN ('spm', 'stpm', 'matrikulasi', 'asasi');

-- Verified directly against the MQF: Diploma is Level 4, Advanced Diploma
-- Level 5, Bachelor's Degree Level 6 (Appendix 3).
UPDATE "Qualification"
   SET "mqfStatus" = 'ASSIGNED'
 WHERE "slug" IN ('diploma', 'advanced-diploma', 'bachelor');

-- Everything else keeps the DEFAULT 'UNKNOWN'. The TVET rows (skm-1, skm-2,
-- skm-3, dkm, dlkm, kv) retain their drafted levels deliberately: the numbers
-- are probably right and were researched, but the MQF names no TVET
-- qualification anywhere ("Kemahiran" and "Vokasional" do not occur in it), so
-- they are unverified rather than verified-correct and need a JPK source.

-- A level is only a claim about the framework when the status is ASSIGNED.
-- UNKNOWN is left unconstrained on purpose so a drafted-but-unchecked level can
-- be stored without being presented as fact.
ALTER TABLE "Qualification"
  ADD CONSTRAINT "Qualification_mqf_level_matches_status"
  CHECK (
    ("mqfStatus" = 'ASSIGNED'         AND "mqfLevel" IS NOT NULL)
    OR ("mqfStatus" = 'NOT_IN_FRAMEWORK' AND "mqfLevel" IS NULL)
    OR ("mqfStatus" = 'UNKNOWN')
  );
