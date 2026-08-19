import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMqfLevel, isMqfLevelPresentable } from "./mqf-level.ts";

test("ASSIGNED with a level is valid", () => {
  assert.deepEqual(validateMqfLevel({ mqfStatus: "ASSIGNED", mqfLevel: 4 }), { ok: true });
});

test("ASSIGNED without a level is rejected", () => {
  const r = validateMqfLevel({ mqfStatus: "ASSIGNED", mqfLevel: null });
  assert.equal(r.ok === false && r.code, "ASSIGNED_WITHOUT_LEVEL");
});

test("NOT_IN_FRAMEWORK without a level is valid", () => {
  assert.deepEqual(validateMqfLevel({ mqfStatus: "NOT_IN_FRAMEWORK", mqfLevel: null }), { ok: true });
});

// This is the case that was actually wrong in the seed: STPM at MQF 3.
test("NOT_IN_FRAMEWORK with a level is rejected", () => {
  const r = validateMqfLevel({ mqfStatus: "NOT_IN_FRAMEWORK", mqfLevel: 3 });
  assert.equal(r.ok === false && r.code, "OUTSIDE_FRAMEWORK_WITH_LEVEL");
});

test("UNKNOWN may carry a drafted level", () => {
  assert.deepEqual(validateMqfLevel({ mqfStatus: "UNKNOWN", mqfLevel: 4 }), { ok: true });
});

test("UNKNOWN may carry no level", () => {
  assert.deepEqual(validateMqfLevel({ mqfStatus: "UNKNOWN" }), { ok: true });
});

test("only a verified level is presentable as fact", () => {
  assert.equal(isMqfLevelPresentable({ mqfStatus: "ASSIGNED", mqfLevel: 6 }), true);
  assert.equal(isMqfLevelPresentable({ mqfStatus: "UNKNOWN", mqfLevel: 4 }), false);
  assert.equal(isMqfLevelPresentable({ mqfStatus: "NOT_IN_FRAMEWORK", mqfLevel: null }), false);
});

// Level 0 is falsy; a naive truthiness check would treat it as absent and let
// an ASSIGNED row through with no level.
test("level 0 counts as present, not absent", () => {
  assert.deepEqual(validateMqfLevel({ mqfStatus: "ASSIGNED", mqfLevel: 0 }), { ok: true });
  const r = validateMqfLevel({ mqfStatus: "NOT_IN_FRAMEWORK", mqfLevel: 0 });
  assert.equal(r.ok === false && r.code, "OUTSIDE_FRAMEWORK_WITH_LEVEL");
});
