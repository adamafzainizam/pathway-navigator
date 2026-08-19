/**
 * Turns stored rules into an answer that can be rendered.
 *
 * Pure — takes already-fetched rows, does no I/O. See AGENTS.md §8.
 *
 * The hard ceiling (AGENTS.md §5) is enforced here rather than left to whoever
 * writes the UI: this module has no way to express "you will receive N
 * credits", because that claim cannot be supported by any data we hold. The
 * most it will ever say is what the institution published as a MAXIMUM, and
 * what is still undecided.
 */

export type TransferType =
  | "DIRECT_ENTRY"
  | "CREDIT_TRANSFER"
  | "CREDIT_EXEMPTION"
  | "APEL_C"
  | "APEL_A"
  | "NONE";

export type CaveatView = {
  textEn: string;
  textMs: string;
  severity: number;
};

export type RuleView = {
  transferType: TransferType;
  /** Percentage of the target programme's graduating credits. */
  maxTransferPercent: number | null;
  /** Absolute cap, where the institution states one instead of a percentage. */
  maxTransferCredits: number | null;
  /** Needed to turn a percentage into an absolute ceiling. Often unknown. */
  targetTotalCredits: number | null;
  requirements: Record<string, unknown>;
  sourceUrl: string;
  sourceDocumentDate: Date;
  verifiedOn: Date;
  caveats: CaveatView[];
};

/**
 * A ceiling, never an award. `atMostCredits` is null whenever it cannot be
 * derived from published figures — it is never estimated.
 */
export type Cap =
  | { kind: "percent"; percent: number; atMostCredits: number | null }
  | { kind: "credits"; atMostCredits: number }
  | { kind: "none_stated" };

export type AnswerTier = {
  transferType: TransferType;
  cap: Cap;
  requirements: Record<string, unknown>;
  source: { url: string; documentDate: Date; verifiedOn: Date };
  /** Highest severity first, so the UI cannot bury the important one. */
  caveats: CaveatView[];
};

export type ProgressionAnswer =
  | { known: false; reason: "NO_RULE_ON_RECORD" }
  | { known: true; tiers: AnswerTier[]; caveats: CaveatView[] };

function resolveCap(rule: RuleView): Cap {
  if (rule.maxTransferCredits !== null) {
    return { kind: "credits", atMostCredits: rule.maxTransferCredits };
  }
  if (rule.maxTransferPercent !== null) {
    return {
      kind: "percent",
      percent: rule.maxTransferPercent,
      // Only when the programme's graduating credits are actually published.
      // Floor, not round: a ceiling must never be overstated.
      atMostCredits:
        rule.targetTotalCredits === null
          ? null
          : Math.floor((rule.maxTransferPercent / 100) * rule.targetTotalCredits),
    };
  }
  return { kind: "none_stated" };
}

function bySeverityDesc(a: CaveatView, b: CaveatView) {
  return b.severity - a.severity;
}

export function buildProgressionAnswer(rules: RuleView[]): ProgressionAnswer {
  if (rules.length === 0) {
    // Not "no transfer is possible" — only "nobody has recorded a rule".
    // Rendering absence as a negative answer is how a reference site lies.
    return { known: false, reason: "NO_RULE_ON_RECORD" };
  }

  const tiers = rules.map((rule) => ({
    transferType: rule.transferType,
    cap: resolveCap(rule),
    requirements: rule.requirements,
    source: {
      url: rule.sourceUrl,
      documentDate: rule.sourceDocumentDate,
      verifiedOn: rule.verifiedOn,
    },
    caveats: [...rule.caveats].sort(bySeverityDesc),
  }));

  // De-duplicated union, so a caveat attached to every tier is stated once.
  const seen = new Set<string>();
  const caveats = tiers
    .flatMap((t) => t.caveats)
    .filter((c) => (seen.has(c.textEn) ? false : (seen.add(c.textEn), true)))
    .sort(bySeverityDesc);

  return { known: true, tiers, caveats };
}

/** True when a rule is current as of `on`. Rules are closed, never edited. */
export function isCurrent(
  rule: { effectiveFrom: Date; effectiveTo: Date | null },
  on: Date,
): boolean {
  if (rule.effectiveFrom > on) return false;
  return rule.effectiveTo === null || rule.effectiveTo > on;
}
