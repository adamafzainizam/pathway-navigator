/**
 * The origin of a ProgressionRule.
 *
 * A rule starts EITHER from a kind of qualification ("any diploma") or from one
 * specific programme at one institution ("UiTM's Diploma in Computer Science").
 * Never both, never neither.
 *
 * The database enforces this with a CHECK constraint
 * (`ProgressionRule_exactly_one_source`, added by hand in the init migration).
 * This module is the mirror of that constraint: it exists so the admin form can
 * reject the mistake with a readable message instead of surfacing a Postgres
 * error, and so the rule can be unit-tested without a database.
 *
 * Pure — no I/O, no Prisma import. See AGENTS.md §8.
 */

export type ProgressionSourceInput = {
  fromQualificationId?: string | null;
  fromProgrammeId?: string | null;
};

export type ProgressionSourceKind = "qualification" | "programme";

export type ProgressionSourceResult =
  | { ok: true; kind: ProgressionSourceKind }
  | { ok: false; code: "NO_SOURCE" | "AMBIGUOUS_SOURCE"; message: string };

/** Treats null, undefined and whitespace-only strings alike as "not set". */
function isSet(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Returns a typed result rather than throwing. Validation failures thrown out
 * of a server action get masked in Next.js production builds — see AGENTS.md §6.
 */
export function validateProgressionSource(
  input: ProgressionSourceInput,
): ProgressionSourceResult {
  const hasQualification = isSet(input.fromQualificationId);
  const hasProgramme = isSet(input.fromProgrammeId);

  if (hasQualification && hasProgramme) {
    return {
      ok: false,
      code: "AMBIGUOUS_SOURCE",
      message:
        "A rule cannot start from both a qualification and a specific programme. " +
        "Pick one: a qualification for a general rule, a programme for an " +
        "institution-specific one.",
    };
  }

  if (!hasQualification && !hasProgramme) {
    return {
      ok: false,
      code: "NO_SOURCE",
      message:
        "A rule must start from either a qualification or a specific programme. " +
        "A rule with no origin would silently match nothing and look like a " +
        "coverage gap rather than an error.",
    };
  }

  return { ok: true, kind: hasQualification ? "qualification" : "programme" };
}
