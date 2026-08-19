/**
 * How far a Qualification's MQF level has actually been checked, and what may
 * therefore be shown for it.
 *
 * Mirrors the `Qualification_mqf_level_matches_status` CHECK constraint added by
 * hand in the mqf_status migration. Pure — no I/O. See AGENTS.md §8.
 *
 * The distinction this encodes is the whole point of the project: MQA states
 * outright that STPM, Matriculation and foundation programmes are not in the
 * framework, and never mentions SPM. Rendering a plausible-looking level for
 * those is asserting something the source refuses to assert.
 */

export type MqfStatus = "ASSIGNED" | "NOT_IN_FRAMEWORK" | "UNKNOWN";

export type MqfLevelInput = {
  mqfLevel?: number | null;
  mqfStatus: MqfStatus;
};

export type MqfLevelResult =
  | { ok: true }
  | {
      ok: false;
      code: "ASSIGNED_WITHOUT_LEVEL" | "OUTSIDE_FRAMEWORK_WITH_LEVEL";
      message: string;
    };

/** MQF has eight levels. Anything else is a typo, not a qualification. */
export const MQF_MIN_LEVEL = 1;
export const MQF_MAX_LEVEL = 8;

export function validateMqfLevel(input: MqfLevelInput): MqfLevelResult {
  const hasLevel = typeof input.mqfLevel === "number";

  if (input.mqfStatus === "ASSIGNED" && !hasLevel) {
    return {
      ok: false,
      code: "ASSIGNED_WITHOUT_LEVEL",
      message:
        "Status is ASSIGNED but no MQF level is set. ASSIGNED means the level " +
        "was read off the framework document — if it wasn't, use UNKNOWN.",
    };
  }

  if (input.mqfStatus === "NOT_IN_FRAMEWORK" && hasLevel) {
    return {
      ok: false,
      code: "OUTSIDE_FRAMEWORK_WITH_LEVEL",
      message:
        "This qualification is recorded as outside the MQF, so it cannot also " +
        "have a level. MQA deliberately assigns none; there is no correct " +
        "number to put here.",
    };
  }

  return { ok: true };
}

/**
 * Whether the UI may present this level as a fact about the framework.
 *
 * UNKNOWN rows are allowed to carry a drafted level so research isn't lost, but
 * a drafted number must never be rendered as though it were checked. Callers
 * should show the level only when this returns true, and otherwise say what is
 * actually known.
 */
export function isMqfLevelPresentable(input: MqfLevelInput): boolean {
  return input.mqfStatus === "ASSIGNED" && typeof input.mqfLevel === "number";
}
