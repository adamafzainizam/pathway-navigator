# `src/lib` — pure logic

Rules logic lives here, deliberately separate from I/O.

This mirrors the pattern that worked in the predecessor project: pure functions
taking plain data and returning plain data, with database access kept at the
edges. It's what made mutation testing tractable — revert a control, confirm its
test fails, restore it. An untested-to-fail regression test is only an assumption
that it works.

Expected modules:

- `eligibility.ts` — match a student's results against a rule's `requirements` JSON
- `caps.ts` — resolve `maxTransferPercent` against a programme's `totalCredits`
  into an absolute credit figure
- `rules.ts` — validate that exactly one of `fromQualificationId` /
  `fromProgrammeId` is set (Prisma can't express this constraint)
- `accreditation.ts` — the display logic for the six-value status enum,
  including the rule that `NOT_IN_REGISTER` must never render as "not accredited"

Tests are co-located (`eligibility.test.ts` next to `eligibility.ts`). Next only
bundles what routes import, so this doesn't bloat the production build, and it
makes coverage visible to anyone reading a module.
