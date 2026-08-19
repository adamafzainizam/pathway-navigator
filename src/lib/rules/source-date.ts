/**
 * Provenance: how strongly a source document's date is known.
 *
 * Mirrors the `ProgressionRule_source_date_matches_basis` CHECK constraint.
 * Pure — no I/O. See AGENTS.md §8.
 *
 * Exists because the first real policy entered (UTHM) carried no printed date
 * at all. The date we hold for it came from PDF file metadata, which records
 * when the file was exported. Treating that as equivalent to a date printed on
 * the document would quietly overstate what we know — and dates are what
 * "is this policy still current?" depends on.
 */

export type SourceDateBasis =
  | "PRINTED_ON_DOCUMENT"
  | "FILE_METADATA"
  | "PAGE_PUBLISHED"
  | "UNDATED";

export type SourceDateInput = {
  sourceDocumentDate?: Date | null;
  sourceDateBasis: SourceDateBasis;
};

export type SourceDateResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNDATED_WITH_DATE" | "DATED_WITHOUT_DATE";
      message: string;
    };

export function validateSourceDate(input: SourceDateInput): SourceDateResult {
  const hasDate = input.sourceDocumentDate instanceof Date;

  if (input.sourceDateBasis === "UNDATED" && hasDate) {
    return {
      ok: false,
      code: "UNDATED_WITH_DATE",
      message:
        "The basis says the document is undated, but a date is set. If a date " +
        "was found, say where it came from instead of calling it undated.",
    };
  }

  if (input.sourceDateBasis !== "UNDATED" && !hasDate) {
    return {
      ok: false,
      code: "DATED_WITHOUT_DATE",
      message:
        `The basis says the date came from ${input.sourceDateBasis}, but no ` +
        "date is set. Use UNDATED if the document genuinely carries none.",
    };
  }

  return { ok: true };
}

/**
 * Whether this date may be presented as the policy's own date.
 *
 * Only a date printed on the document supports that claim. File metadata says
 * when a file was exported; a page-publication date says when someone uploaded
 * it. Both are useful for staleness triage and neither is the policy's date, so
 * the UI must attribute them rather than showing a bare date.
 */
export function isPolicyDateAuthoritative(input: SourceDateInput): boolean {
  return (
    input.sourceDateBasis === "PRINTED_ON_DOCUMENT" &&
    input.sourceDocumentDate instanceof Date
  );
}

/** Short attribution for rendering next to a date. Never returns a bare date. */
export function describeSourceDate(input: SourceDateInput): string {
  switch (input.sourceDateBasis) {
    case "PRINTED_ON_DOCUMENT":
      return "date printed on the document";
    case "FILE_METADATA":
      return "from the file's metadata — when it was exported, not necessarily when the policy took effect";
    case "PAGE_PUBLISHED":
      return "from the web page that published it, not from the document itself";
    case "UNDATED":
      return "the document carries no date at all";
  }
}
