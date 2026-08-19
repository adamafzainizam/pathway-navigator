import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSourceDate,
  isPolicyDateAuthoritative,
  describeSourceDate,
} from "./source-date.ts";

const d = new Date("2022-06-02");

test("a printed date with a date is valid", () => {
  assert.deepEqual(
    validateSourceDate({ sourceDateBasis: "PRINTED_ON_DOCUMENT", sourceDocumentDate: d }),
    { ok: true },
  );
});

test("UNDATED with no date is valid", () => {
  assert.deepEqual(
    validateSourceDate({ sourceDateBasis: "UNDATED", sourceDocumentDate: null }),
    { ok: true },
  );
});

test("UNDATED carrying a date is rejected", () => {
  const r = validateSourceDate({ sourceDateBasis: "UNDATED", sourceDocumentDate: d });
  assert.equal(r.ok === false && r.code, "UNDATED_WITH_DATE");
});

test("a stated basis with no date is rejected", () => {
  const r = validateSourceDate({ sourceDateBasis: "FILE_METADATA" });
  assert.equal(r.ok === false && r.code, "DATED_WITHOUT_DATE");
});

// This is the UTHM case, and the whole reason the column exists.
test("file metadata is not authoritative for the policy's own date", () => {
  assert.equal(
    isPolicyDateAuthoritative({ sourceDateBasis: "FILE_METADATA", sourceDocumentDate: d }),
    false,
  );
  assert.equal(
    isPolicyDateAuthoritative({ sourceDateBasis: "PRINTED_ON_DOCUMENT", sourceDocumentDate: d }),
    true,
  );
});

test("every basis has an attribution and none is a bare date", () => {
  for (const basis of ["PRINTED_ON_DOCUMENT", "FILE_METADATA", "PAGE_PUBLISHED", "UNDATED"] as const) {
    const text = describeSourceDate({ sourceDateBasis: basis, sourceDocumentDate: d });
    assert.ok(text.length > 0);
    assert.ok(!/^\d{4}-\d{2}-\d{2}$/.test(text));
  }
});
