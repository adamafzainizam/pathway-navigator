# Decision Log

Dated record of non-trivial choices and the reasoning behind them. The *why* matters as much as the *what* — this project is a learning exercise as much as a product.

Append new entries at the bottom. Never delete an entry; if a decision is reversed, add a new entry explaining the reversal.

---

## Pre-build decisions (made during planning, 2026-08)

**Scope narrowed to one field — computing/IT/software engineering.**
The single most important scoping decision. It's the field the builder understands from the inside, it has high student volume, and it keeps the data grind finite. Breadth across fields with shallow coverage is worse than depth in one: a pathway site with gaps everywhere gets one visit and no return.

**Reuse the `campus-marketplace` stack (Next.js + Neon + Prisma + Vercel) rather than trying something new.**
Its failure modes are already known and documented, and every gotcha in the predecessor's `AGENTS.md` still applies. The novelty budget for this project belongs in the graph logic and data pipeline, which is where the actual learning is. Trying a new framework *and* a new problem domain simultaneously means debugging two unfamiliar things at once.

**Provenance fields are `NOT NULL` at the database level, from the first migration.**
Source URL, source document date, and human verification date on every rule. The predecessor project taught this the expensive way: constraints added later never get honestly backfilled — you end up with a nullable column, half-populated, that nobody trusts. Since provenance *is* the credibility differentiator here, it cannot be optional.

**`accreditationStatus` is a six-value enum, not a boolean.**
MQA states a missing register record can mean four different things: provisional accreditation not yet matured to full, the provider never applied, the programme predates 1997, or accreditation was refused. Separately, `NOT_IN_REGISTER` (searched, found nothing) must be distinct from `UNKNOWN` (nobody looked). Collapsing any of these is how a reference site quietly starts publishing false statements.

**`transferType` distinguishes `CREDIT_TRANSFER` from `CREDIT_EXEMPTION`.**
They are not the same thing and the difference costs a semester: an exemption lets a student skip a subject, but the credits may not count toward graduation, so another elective is still needed to reach the required hours. Almost no student knows this and no existing Malaysian site explains it. Making it a first-class enum value forces the UI to surface it rather than glossing over it.

**Rules are versioned via `effectiveFrom`/`effectiveTo` rather than updated in place.**
When an institution changes its cap for the next intake, the old rule stays. Two reasons: a student who applied under previous rules still needs the answer that was true then, and "rules as of intake 2026/1" is genuinely useful information rather than noise.

**`requirements` is structured JSON, not free text.**
Free text cannot power the "enter your results, see what you qualify for" checker. Accepting slightly more painful data entry buys the entire interactive layer.

**A `Caveat` model, rendered as visible warnings rather than fine print.**
Per-course transfer decisions are discretionary and unpublished — institutional guidelines state the faculty reserves the right to determine approval for each course applied for. Rather than hiding this, the tool states it prominently. Competitors either overpromise or stay vague; precision about where certainty ends is the differentiator.

**Bilingual (BM/EN) from day one, not a later port.**
The English keyword space is dominated by institution marketing blogs with real SEO budgets; the Bahasa Melayu space is large and served mostly by low-quality content sites. Retrofitting i18n is painful, and the data model is already language-agnostic (structured rules, not prose), so only presentation layers need translating. See `seo.md`.

**Ship on a free subdomain; no custom domain purchase yet.**
Same reasoning as the predecessor project: the no-spend constraint holds, and a domain is not required to validate whether the dataset is useful.

**Admin data-entry tooling gets built in Weeks 1–2, before any public UI.**
Hundreds of rules will be hand-entered. Without a decent form this happens in raw SQL and accumulates transcription errors that silently poison the dataset — and unlike a code bug, bad data doesn't throw.

---

## Build decisions

*(Append entries here as work proceeds. Format: date, decision, reasoning, and what was rejected.)*

### 2026-08-19 — first working session (scaffold verification)

**Pinned Next.js 16.3.1 / React 19.2.8 exactly; carets elsewhere.**
These are the versions `create-next-app` itself paired, and the framework is the
one dependency where a silent minor bump can change build output. Everything
else is on a caret because churn there is cheap to absorb. Rejected: caret on
Next too — the predecessor project's build broke on an unattended minor bump and
the cause took far longer to find than the pin would have cost.

**Prisma's `prisma-client` generator, not the legacy `prisma-client-js`.**
`prisma-client-js` still works under 7.x and generates without complaint, so
this was a choice rather than a forced fix. Two reasons for switching now: it is
removed in Prisma 8 (already at rc), so this migration is owed regardless — and
at week 0, with no queries written, it costs nothing, whereas later it means
touching every call site. It also emits to a visible path (`src/generated/prisma`,
gitignored, rebuilt by the `build` script) instead of burying output inside
`node_modules`, which is what made the predecessor's "migration applied but the
client didn't pick it up" bug so hard to see. Rejected: staying on the legacy
generator to conserve novelty budget — but the budget argument cuts the other
way when the migration is unavoidable and only gets more expensive.

**`@prisma/adapter-neon` (Neon serverless driver) rather than `@prisma/adapter-pg`.**
Prisma 7 requires an explicit driver adapter. Neon's own driver avoids holding a
TCP connection per serverless invocation, which matters specifically because the
free tier's connection ceiling is low and Vercel functions scale horizontally.
`adapter-pg` over the pooled connection string would also work and is more
conventional; it was rejected because the failure it invites — connection
exhaustion under traffic — is exactly the kind that only shows up once the site
is actually being used.

**`src/lib/db.ts` throws when `DATABASE_URL` is missing, instead of defaulting.**
Directly targets the inherited gotcha where a standalone script silently fell
back to `localhost:5432` and appeared to succeed against nothing. A loud failure
at construction is strictly better than a quiet one at query time. The seed
script imports this singleton rather than constructing its own client, so there
is exactly one place this rule can be violated.

**Kept the 3 high-severity `npm audit` advisories unfixed.**
All three are `deepmerge-ts` via `@prisma/config`, which parses our own config
file at CLI time — not attacker-controlled input. `npm audit fix --force`
resolves them by downgrading to Prisma 6.12, a major version backwards, which
would undo the Prisma 7 work above and reintroduce a generator that is going
away. Accepted deliberately, recorded here so it isn't rediscovered as a
surprise. Revisit when `@prisma/config` bumps its dependency.

**Approved install scripts pinned per version rather than blanket-allowed.**
`npm approve-scripts --all` would have been one command. Pinning four named
packages at exact versions means a future version bump fails loudly and gets
looked at, which is the point of npm 11 gating them in the first place.

### 2026-08-19 — MQF levels in the seed verified against the source document

**Verified against:** *Malaysian Qualifications Framework (MQF) Second Edition*,
MQA, first published 2007, second edition 2017, this printing © 2024.
Retrieved 2026-08-19. Text checked directly, not summarised from secondary
sources. Verification date for the rows below: **2026-08-19**.

**Confirmed correct.** Diploma = Level 4, Advanced Diploma = Level 5,
Bachelor's Degree = Level 6, Certificate = Levels 1–3. Appendix 3 gives the
graduating-credit table that matches. The `diploma`, `advanced-diploma` and
`bachelor` seed rows are right.

**Contradicted — four seed rows assert a level the framework explicitly
declines to assign.** MQF paragraph 74, quoted in full:

> "Foundation and university preparatory programmes, Sijil Tinggi Persekolahan
> Malaysia, Matriculation and foreign qualifications like A Levels are entry
> qualifications to tertiary education/bachelor's programmes at universities.
> **However, they are not included in the Framework.** Nonetheless, the MQF
> determines the standards for these qualifications to ensure comparability and
> standardisation of student abilities."

That covers `stpm`, `matrikulasi` and `asasi`, all seeded at MQF 3. `spm` is
seeded at MQF 2 and is not mentioned in the document at all — the string
"Pelajaran" does not occur in it. SPM is a school-leaving certificate below the
framework's floor.

So four of thirteen rows currently state something MQA specifically refuses to
state. That is the exact failure mode section 7 of AGENTS.md is about: it is not
a gap, it is an assertion, and it is wrong.

**Not verifiable from this document — needs a different source.** The MQF names
no Malaysian TVET qualification anywhere: "Kemahiran" and "Vokasional" each
occur zero times. Appendix 3's TVET column carries bare level numbers only. So
`skm-1`, `skm-2`, `skm-3`, `dkm`, `dlkm` and `kv` are *unverified*, not
*verified-correct* — their mapping comes from JPK (Jabatan Pembangunan
Kemahiran), which has to be cited on its own terms. `kv` at Level 4 is the most
doubtful: Sijil Vokasional Malaysia and Diploma Vokasional Malaysia are distinct
awards and the seed row collapses them into one.

**Consequence for the schema, and it is not a data-entry problem.**
`Qualification.mqfLevel` is `Int` and `NOT NULL`, so the model cannot represent
"this qualification is real, widely used, and deliberately outside the MQF."
Every row is forced to claim a level. The three states that need distinguishing
are the same three the `accreditationStatus` enum already distinguishes for
accreditation:

  - a level the framework assigns;
  - explicitly outside the framework (STPM, Matriculation, Asasi, SPM) — checked,
    and the answer is "MQA does not assign one";
  - nobody has checked yet.

Collapsing the second into a plausible-looking integer is how a reference site
starts lying, and it would be load-bearing: MQF level is described in AGENTS.md
section 1 as the spine every progression rule resolves against.

**Status: RESOLVED, same day.** `mqfLevel` becomes `Int?` and a new `MqfStatus`
enum (`ASSIGNED` / `NOT_IN_FRAMEWORK` / `UNKNOWN`) carries how far each row has
been checked — deliberately the same three-state shape as
`accreditationStatus`, for the same reason.

Rejected: making `mqfLevel` nullable *without* the enum. Null would then mean
both "MQA excludes it" and "nobody has looked", which is precisely the
`NOT_IN_REGISTER` / `UNKNOWN` collapse section 7 forbids. Also rejected:
dropping the four rows to keep the column `NOT NULL`. SPM and STPM are where
most users start, so a `ProgressionRule` could then never originate from SPM —
that removes the product's primary question to preserve a schema convenience.

A CHECK constraint (`Qualification_mqf_level_matches_status`) ties the two
columns together: `ASSIGNED` requires a level, `NOT_IN_FRAMEWORK` forbids one.
`UNKNOWN` is left unconstrained on purpose, so the six TVET rows keep their
drafted levels rather than discarding researched work — but
`isMqfLevelPresentable()` in `src/lib/rules/mqf-level.ts` returns false for
them, so a drafted number cannot be rendered as fact. Verified against the live
database across all six status/level combinations.

### 2026-08-19 — first real institution entered, to test the schema against reality

**Source:** UTHM Credit Transfer Guidelines,
https://amo.uthm.edu.my/images/UPPP/Credit_Transfer_Guidelines.pdf
Read in full and transcribed, not summarised. Verified 2026-08-19.

Entered before building the admin form deliberately: a form is a UI wrapped
around the `requirements` shape, and if a real policy did not fit that shape the
form would have been built twice. It did not fit. Four findings.

**1. The documented `requirements` shape was wrong for the main use case.**
The schema described SPM-style entry requirements — `subjectCredits`,
`minTotalCredits`, `mustPass`. A credit transfer rule needs none of those. What
UTHM actually publishes is course-equivalence criteria: a minimum grade per
course (C+), a syllabus similarity threshold (80%), a requirement that the
source programme be accredited, an application window, and disqualifying
conditions. The schema comment has been corrected to carry both shapes, with a
note not to unify them — `DIRECT_ENTRY` rules genuinely do look like the first
shape. The checker should branch on `transferType`.

**2. A tiered cap does not fit one row.** UTHM's regulation 12 plus Table 1 is a
single policy with two tiers: up to 30% at minimum grade C+, or up to 50% at
minimum grade B if the target bachelor programme is MQA-accredited.
`maxTransferPercent` is a scalar, so this is stored as two `ProgressionRule`
rows. That works and reads correctly, but it overloads the row: two rows now
mean either "two independent rules" or "two tiers of one rule", and nothing
distinguishes them. Acceptable for now — flagged because if tiering turns out
to be common rather than a UTHM quirk, this wants a `tier` column or a
parent/child relation rather than a convention buried in the JSON.

**3. `sourceDocumentDate` assumes documents carry dates. This one does not.**
The UTHM guidelines have no printed date anywhere in eleven pages. The only date
available is PDF file metadata (`CreationDate` 2022-06-02), which is a much
weaker claim — it is when the file was generated, not when the policy took
effect, and a re-export would change it. The column is `NOT NULL`, so the
metadata date was used and a visible caveat attached saying exactly that.

This is the same class of problem as the MQF levels: a provenance field that
cannot say how it knows what it knows. **Status: RESOLVED, same day.** A `SourceDateBasis` enum
(`PRINTED_ON_DOCUMENT` / `FILE_METADATA` / `PAGE_PUBLISHED` / `UNDATED`) now
sits alongside the date on both `ProgressionRule` and `Institution`, matching
`MqfStatus` and `AccreditationStatus`.

`sourceDocumentDate` became nullable, which amends standing constraint 2 in
`AGENTS.md` — recorded there as required. This looks like a weakening and is
not: the old column was `NOT NULL` but could not say whether its value was
printed on the document or scraped off file metadata, so it compelled a value
without compelling its meaning. The obligation now falls on `sourceDateBasis`,
which *is* `NOT NULL`, and a CHECK constraint keeps the two honest — `UNDATED`
requires no date, any other basis requires one. Verified live across all five
combinations.

Rejected: keeping the date `NOT NULL` and treating an undated document as
unenterable. That would have made the dataset's coverage depend on institutions'
document hygiene rather than on what is actually knowable, and undated PDFs are
common enough that it would have excluded real policies outright.

`isPolicyDateAuthoritative()` returns true only for `PRINTED_ON_DOCUMENT`, so
weaker bases can still drive staleness triage without ever being presented as
the policy's own date. `describeSourceDate()` guarantees a date is never
rendered bare.

**4. What worked.** The nullable columns earned their keep immediately.
UTHM does not publish this programme's graduating credit total, so
`totalCredits` is null and the 30%/50% caps cannot be resolved into credit
figures — and the answer builder says so in words rather than estimating.
`accreditationStatus` is `UNKNOWN` rather than `NOT_IN_REGISTER`, because the
MQA register is a frameset over a POST-based ColdFusion search that could not be
queried: no search was completed, so claiming one returned nothing would be
false. Both are exactly the distinctions section 7 exists to protect.

**The hard ceiling is now enforced in code, not convention.**
`src/lib/rules/progression-answer.ts` has no field capable of expressing "you
will receive N credits" — the only credit figure it can produce is
`atMostCredits`, floored rather than rounded so a ceiling is never overstated,
and null whenever it cannot be derived from published figures. A unit test
asserts no field name on the answer implies an award. Regulation 17 of the UTHM
document — "the Faculty reserves the right to determine the approval of the
application for each course applied for" — is stored as a severity-3 caveat,
which is the exact sentence AGENTS.md section 5 was written around, now
confirmed verbatim in a real institutional document rather than assumed.

### 2026-08-19 — two more institutions, and a finding that challenges the thesis

Added Universiti Malaya (public) and Multimedia University (private) alongside
UTHM. Three institutions, three programmes, six rules, 23 caveats.

**The caps are nearly identical across all three, and that was not expected.**

| Institution | Diploma → Bachelor cap | Tiers |
|---|---|---|
| UTHM | 30%, or up to 50% if the target is MQA-accredited | 1–30% grade C+, 31–50% grade B |
| UM | 50% | 1–30% grade C, 31–50% grade B |
| MMU | 50% | 1–30% grade C, 31–50% grade B |

UM and MMU are structurally identical. UTHM differs only in requiring C+ rather
than C, and in gating the higher tier on accreditation.

This is not coincidence, and the documents say so. MMU's policy states on page 1
that it exists "to be in line with the Ministry of Higher Education (MOHE)'s
policy" and records four Senate amendments made for that reason. UTHM cites
*Kompilasi Dasar Jaminan Kualiti Pendidikan Tinggi, MQA*. UM cites the same
family of MQA and MOHE sources. **The tiered 30/50 structure is a national
baseline that institutions restate, not a per-institution variable.**

**Consequence for the product thesis.** `AGENTS.md` §1 says the gap is "the
mechanics layer — accreditation status, MQF levels, per-institution transfer
caps". On this evidence *per-institution transfer caps are largely uniform*, so
a dataset whose main axis is "look up this university's cap" is worth much less
than assumed: three institutions took a day's work to establish a number that a
single sentence could convey.

What genuinely does vary, and is worth collecting, is narrower and stranger:

1. **Terminology is contradictory between institutions.** UM: course exemption
   "will not result in a student obtaining credit... shall be replaced with
   another course". UTHM's glossary: "Credit Exemption — Credit Transfer Without
   Grade", where credit *does* count toward graduation. The same phrase means
   opposite things at two public universities, and a student who learns the word
   at one will be wrong at the other. No guide anywhere explains this.
2. **Process detail.** UTHM requires application in the first semester only and
   refuses later ones outright; a faculty may raise the minimum grade with Senate
   permission; prerequisites do not transfer automatically at UM.
3. **What is not published at all.** UTHM and MMU do not publish graduating
   credit totals, so their percentage caps cannot be turned into credit figures.
   UM does (128), so its caps resolve to 38 and 64.
4. **The existence of the national baseline itself**, which no student-facing
   Malaysian guide states.

**Not acted on yet.** This does not obviously kill the project, but it does move
the centre of gravity from "per-institution caps" to "terminology, process and
provenance", and that is a different product with a different amount of work per
row. Recorded here for a deliberate decision rather than drifting into the
answer.

**Smaller findings from the same pass.**

- `Institution.state` assumes one location. MMU operates in Cyberjaya (Selangor)
  and Melaka, so `state` is left null rather than asserting one campus.
- `Programme.nameMs` is `NOT NULL`, but neither UM nor MMU publishes a Malay
  programme name. The English string stands in, which is visibly wrong to a
  Malay reader. Translating an official award title would be fabrication, so it
  was not done. The bilingual-from-day-one constraint has a data-availability
  cost that had not been anticipated.
- UM's document states a version *year* ("LATEST VERSION 2022") with no day or
  month. `sourceDateBasis` records PRINTED_ON_DOCUMENT honestly, but the stored
  date pads the day and month, so a caveat says so. Date *granularity* is a
  third axis the basis enum does not capture.
- MMU's policy PDF carries the metadata title "MEDICAL CERTIFICATION/REPORT
  SUBMISSION" because it was made from a reused template. Any pipeline that
  trusts PDF metadata to identify documents will mis-file it.

### 2026-08-19 — thesis narrowed to the decoder; data entry paused

**Decision.** The project stops being a per-institution cap lookup and becomes a
bilingual decoder for the credit transfer process: what the words mean at a given
institution, which steps disqualify you, and where published information stops.
Coverage target drops from 15–20 institutions to 5–8 documented exhaustively.
Data entry is paused until the pages explaining the existing three exist.

**Why.** The entry above. Caps are a national MOHE/MQA baseline that institutions
restate, so the axis the product was organised around carries little information.
The axes that do carry information — contradictory vocabulary, process traps,
publication gaps — are denser per institution, which means fewer institutions
studied harder, not more studied lightly.

**What was rejected.**

*Continue as scoped* (push to 15–20 institutions): coverage might reveal variance
that three institutions hide. Rejected because the mechanism is documented rather
than inferred — MMU states its policy exists to align with MOHE — so more rows
would most likely buy more copies of the same number, at the highest cost per row
of any option.

*Shrink to a single explainer page*: much of the reader value, almost none of the
maintenance. Rejected because the terminology contradiction is only demonstrable
by holding both institutions' definitions side by side with provenance, which is
a dataset even if a small one, and because it would discard working
infrastructure that is already correct.

*Stop and write it up*: defensible — the findings stand on their own. Rejected
because the decoder is a real gap that has now been evidenced rather than
assumed, and the cost of testing it is weeks rather than months.

**The moat claim is also corrected.** `AGENTS.md` §1 and the README claimed an AI
content farm could not generate this dataset because it is not in prose anywhere.
An AI extracted three institutional policies from PDFs in an afternoon during
this session, so extraction is plainly not the barrier. The defensible
differentiator is behavioural: distinguishing `UNKNOWN` from `NOT_IN_REGISTER`,
refusing to state an MQF level MQA declines to assign, recording that a document
carries no date. A content farm will not do those things because they make output
look less confident. Both files now say this.

**Unresolved, and flagged as the likeliest cause of failure.** Every rule carries
`recheckDueOn` and policies change per intake. Nobody has established how many
rules one person can honestly re-verify per intake. That number, not build speed,
sets the maximum sustainable size of the dataset, and it should be decided before
coverage grows rather than discovered when rows go stale.

