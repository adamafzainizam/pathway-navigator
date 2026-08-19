import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProgressionAnswer,
  isCurrent,
  type RuleView,
} from "./progression-answer.ts";

const base: RuleView = {
  transferType: "CREDIT_TRANSFER",
  maxTransferPercent: 30,
  maxTransferCredits: null,
  targetTotalCredits: null,
  requirements: { minCourseGrade: "C+" },
  sourceUrl: "https://example.test/policy.pdf",
  sourceDocumentDate: new Date("2022-06-02"),
  verifiedOn: new Date("2026-08-19"),
  caveats: [],
};

test("no rules means 'nobody recorded one', not 'no transfer possible'", () => {
  const a = buildProgressionAnswer([]);
  assert.equal(a.known, false);
  assert.equal(a.known === false && a.reason, "NO_RULE_ON_RECORD");
});

test("a percentage cap stays a percentage when graduating credits are unknown", () => {
  const a = buildProgressionAnswer([base]);
  assert.equal(a.known, true);
  if (!a.known) return;
  assert.deepEqual(a.tiers[0].cap, {
    kind: "percent",
    percent: 30,
    atMostCredits: null,
  });
});

test("a percentage resolves to an absolute ceiling only when credits are published", () => {
  const a = buildProgressionAnswer([{ ...base, targetTotalCredits: 130 }]);
  if (!a.known) throw new Error("expected known");
  assert.deepEqual(a.tiers[0].cap, {
    kind: "percent",
    percent: 30,
    atMostCredits: 39,
  });
});

// A ceiling must never be overstated, so rounding is always down.
test("the resolved ceiling floors rather than rounds", () => {
  const a = buildProgressionAnswer([{ ...base, targetTotalCredits: 125 }]);
  if (!a.known) throw new Error("expected known");
  // 30% of 125 is 37.5 — must be 37, never 38.
  assert.equal(a.tiers[0].cap.kind === "percent" && a.tiers[0].cap.atMostCredits, 37);
});

test("an absolute cap is passed through unchanged", () => {
  const a = buildProgressionAnswer([
    { ...base, maxTransferPercent: null, maxTransferCredits: 40 },
  ]);
  if (!a.known) throw new Error("expected known");
  assert.deepEqual(a.tiers[0].cap, { kind: "credits", atMostCredits: 40 });
});

test("a rule stating no cap says so rather than inventing one", () => {
  const a = buildProgressionAnswer([
    { ...base, maxTransferPercent: null, maxTransferCredits: null },
  ]);
  if (!a.known) throw new Error("expected known");
  assert.deepEqual(a.tiers[0].cap, { kind: "none_stated" });
});

test("caveats surface highest severity first", () => {
  const a = buildProgressionAnswer([
    {
      ...base,
      caveats: [
        { textEn: "minor", textMs: "kecil", severity: 1 },
        { textEn: "critical", textMs: "kritikal", severity: 3 },
        { textEn: "medium", textMs: "sederhana", severity: 2 },
      ],
    },
  ]);
  if (!a.known) throw new Error("expected known");
  assert.deepEqual(a.caveats.map((c) => c.textEn), ["critical", "medium", "minor"]);
});

test("a caveat shared by every tier is stated once", () => {
  const shared = { textEn: "faculty decides", textMs: "fakulti memutuskan", severity: 3 };
  const a = buildProgressionAnswer([
    { ...base, caveats: [shared] },
    { ...base, maxTransferPercent: 50, caveats: [shared] },
  ]);
  if (!a.known) throw new Error("expected known");
  assert.equal(a.caveats.length, 1);
  assert.equal(a.tiers.length, 2);
});

// The hard ceiling, as a test rather than a convention: there is no field on
// the answer that could carry "you will receive N credits".
test("the answer shape cannot express credits awarded, only a maximum", () => {
  const a = buildProgressionAnswer([{ ...base, targetTotalCredits: 130 }]);
  if (!a.known) throw new Error("expected known");
  const keys = Object.keys(a.tiers[0].cap);
  assert.ok(!keys.some((k) => /awarded|granted|willReceive|actual/i.test(k)));
  assert.ok(keys.some((k) => /atMost|percent|kind/.test(k)));
});

test("isCurrent respects effectiveFrom and effectiveTo", () => {
  const on = new Date("2026-08-19");
  assert.equal(isCurrent({ effectiveFrom: new Date("2022-01-01"), effectiveTo: null }, on), true);
  assert.equal(isCurrent({ effectiveFrom: new Date("2027-01-01"), effectiveTo: null }, on), false);
  assert.equal(
    isCurrent({ effectiveFrom: new Date("2022-01-01"), effectiveTo: new Date("2025-01-01") }, on),
    false,
  );
});
