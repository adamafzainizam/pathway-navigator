import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProgressionSource } from "./progression-source.ts";

test("accepts a qualification as the sole source", () => {
  const r = validateProgressionSource({ fromQualificationId: "q1" });
  assert.deepEqual(r, { ok: true, kind: "qualification" });
});

test("accepts a programme as the sole source", () => {
  const r = validateProgressionSource({ fromProgrammeId: "p1" });
  assert.deepEqual(r, { ok: true, kind: "programme" });
});

test("rejects both sources set", () => {
  const r = validateProgressionSource({
    fromQualificationId: "q1",
    fromProgrammeId: "p1",
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.code, "AMBIGUOUS_SOURCE");
});

test("rejects neither source set", () => {
  const r = validateProgressionSource({});
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.code, "NO_SOURCE");
});

test("treats explicit null the same as absent", () => {
  const r = validateProgressionSource({
    fromQualificationId: null,
    fromProgrammeId: null,
  });
  assert.equal(r.ok === false && r.code, "NO_SOURCE");
});

// An empty or whitespace-only id is what an untouched <select> actually submits.
// The database CHECK would accept "" as a value and then fail on the foreign
// key instead, which is a much less useful error for the person entering data.
test("treats an empty-string id as not set", () => {
  const r = validateProgressionSource({
    fromQualificationId: "",
    fromProgrammeId: "p1",
  });
  assert.deepEqual(r, { ok: true, kind: "programme" });
});

test("treats a whitespace-only id as not set", () => {
  const r = validateProgressionSource({ fromQualificationId: "   " });
  assert.equal(r.ok === false && r.code, "NO_SOURCE");
});
