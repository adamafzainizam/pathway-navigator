-- CreateEnum
CREATE TYPE "SourceDateBasis" AS ENUM ('PRINTED_ON_DOCUMENT', 'FILE_METADATA', 'PAGE_PUBLISHED', 'UNDATED');

-- AlterTable: Institution
ALTER TABLE "Institution" ADD COLUMN "policyDateBasis" "SourceDateBasis";

-- ---------------------------------------------------------------------------
-- Hand-written. Prisma generates this as a required column with no default,
-- which cannot be added to a table that already has rows. Added nullable,
-- backfilled from what is actually known, then tightened.
--
-- Why this column exists: UTHM's credit transfer guidelines carry no printed
-- date anywhere in eleven pages. The date stored for them came from PDF file
-- metadata — when the file was exported, not when the policy took effect, and a
-- re-export would change it. Without this column that is indistinguishable from
-- a date printed on the document itself, which is the only basis strong enough
-- to reason about one policy superseding another.
--
-- Same shape as MqfStatus and AccreditationStatus: record how you know, not
-- just what you know. See docs/decision-log.md 2026-08-19.
-- ---------------------------------------------------------------------------
ALTER TABLE "ProgressionRule" ADD COLUMN "sourceDateBasis" "SourceDateBasis";
ALTER TABLE "ProgressionRule" ALTER COLUMN "sourceDocumentDate" DROP NOT NULL;

-- Every existing rule is UTHM's, whose date came from `pdfinfo` CreationDate.
UPDATE "ProgressionRule"
   SET "sourceDateBasis" = 'FILE_METADATA'
 WHERE "sourceDateBasis" IS NULL;

UPDATE "Institution"
   SET "policyDateBasis" = 'FILE_METADATA'
 WHERE "policyDocumentDate" IS NOT NULL AND "policyDateBasis" IS NULL;

ALTER TABLE "ProgressionRule" ALTER COLUMN "sourceDateBasis" SET NOT NULL;

-- A date and its basis must agree: UNDATED means there is genuinely no date to
-- record, and any other basis means one was found. This is what stops the
-- column from decaying back into "some date, provenance unknown".
ALTER TABLE "ProgressionRule"
  ADD CONSTRAINT "ProgressionRule_source_date_matches_basis"
  CHECK (
    ("sourceDateBasis" = 'UNDATED' AND "sourceDocumentDate" IS NULL)
    OR ("sourceDateBasis" <> 'UNDATED' AND "sourceDocumentDate" IS NOT NULL)
  );

ALTER TABLE "Institution"
  ADD CONSTRAINT "Institution_policy_date_matches_basis"
  CHECK (
    "policyDateBasis" IS NULL
    OR ("policyDateBasis" = 'UNDATED' AND "policyDocumentDate" IS NULL)
    OR ("policyDateBasis" <> 'UNDATED' AND "policyDocumentDate" IS NOT NULL)
  );
