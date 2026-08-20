# Post-Mortem

**Project discontinued 2026-08-20**, four days after the first line of code was
run. Not abandoned mid-flight: stopped deliberately, with the reasoning recorded,
because its central premise was tested and did not hold.

This document exists so the next project starts from what was learned rather
than from the same assumptions.

---

## What it was meant to be

A bilingual, queryable dataset of Malaysian credit transfer rules across 15–20
institutions. The bet: students cannot find out what their diploma is worth at a
given university because the rules live in scattered institutional PDFs, and
assembling them into structured data is real engineering a content farm cannot
shortcut.

## What was actually built

Working, and all of it verified rather than assumed:

- Next.js 16.3 + Prisma 7 + Neon Postgres 18, deployed nowhere, no public UI
- Five tables, three migrations, **three CHECK constraints Prisma cannot express** —
  each hand-written into the migration before applying and each verified against
  the live database case-by-case
- Each constraint mirrored as a pure, unit-tested function so the application can
  be the error surface instead of Postgres
- 31 tests, including one asserting the answer type **cannot express** "you will
  receive N credits"
- Three institutions fully transcribed: UTHM, Universiti Malaya, Multimedia
  University — 3 programmes, 6 rules, 23 caveats, every row carrying a source URL,
  a verification date, and a statement of how its document's date is known

`npx tsx scripts/ask.ts` answers a real progression question from the database
with sources and caveats attached. The success test passed.

## Why it stopped

### Three premises failed, in order

**1. MQF levels are a clean spine.** They are not. The MQF states outright that
STPM, Matriculation and foundation programmes "are not included in the
Framework", and never mentions SPM at all. Four of thirteen seeded qualifications
were asserting a level MQA explicitly declines to assign. *Cost: one schema
change.* Survivable, and the fix (`MqfStatus`) made the model better.

**2. Provenance is a date.** It is not. UTHM's eleven-page policy carries no
printed date anywhere; the only date available was PDF file metadata, which
records when a file was exported. *Cost: one schema change.* Also survivable —
`SourceDateBasis` was a genuine improvement.

**3. Credit transfer caps vary per institution.** **This one was fatal.**

| Institution | Diploma → Bachelor cap | Tiers |
|---|---|---|
| UTHM | 30%, or 50% if MQA-accredited | 1–30% grade C+, 31–50% grade B |
| UM | 50% | 1–30% grade C, 31–50% grade B |
| MMU | 50% | 1–30% grade C, 31–50% grade B |

UM and MMU are structurally identical; UTHM differs by one grade step. The
documents explain why: MMU's policy states on page 1 that it exists "to be in
line with the Ministry of Higher Education (MOHE)'s policy", and UTHM cites MQA's
*Kompilasi Dasar Jaminan Kualiti Pendidikan Tinggi*. **The tiered 30/50 structure
is a national baseline institutions restate, not an institutional choice.**

A database whose primary axis is "look up your university's cap" answers a
question whose answer is one sentence and nearly the same everywhere.

### The moat argument was also wrong

The README claimed an AI content farm could not generate this dataset because it
is not in prose anywhere. During this project an AI extracted three institutional
policies from PDFs in an afternoon. **Extraction was never the barrier.**

What is genuinely hard to copy is behavioural: distinguishing `UNKNOWN` from
`NOT_IN_REGISTER`, refusing to state a level a source declines to assign,
recording that a document has no date. A content farm will not do those things
because they make output look less confident. That is a real differentiator — but
it is a discipline, not an asset, and it does not by itself make a product.

### The revised thesis was never load-bearing enough

After the caps finding, the project was narrowed to a *decoder*: the vocabulary
is contradictory between institutions. UM defines a course exemption as giving no
credit, requiring the course be replaced. UTHM's glossary defines credit
exemption as credit transfer *without grade*, where the credit *does* count
toward graduation. Same phrase, opposite meanings, two public universities.

That finding is real, checkable, and genuinely useful to a student. But it rested
on **n = 2** — thinner evidence than the caps thesis had when it died at n = 3. It
was never stress-tested against a fourth institution.

### The decisive argument: the two goals wanted opposite things

The project was meant to serve both as a portfolio piece and as a small income
source. After the narrowing, those diverged:

- **Portfolio value was already banked.** The constraints, the provenance
  modelling, the hard ceiling as a type — all demonstrable at the final commit.
  Everything remaining was data-entry grind, which adds no engineering signal.
- **Income needs volume.** The surviving thesis targeted "mechanism terms", which
  the project's own SEO research describes as *low volume*. The high-volume
  programmatic play had just been demoted, because generating the full
  institution × qualification matrix over a uniform national rule produces
  hundreds of near-identical pages — thin/doorway content that gets demoted
  rather than rewarded.

So the work that might have served income added nothing to the portfolio, while
carrying a solo, seasonal re-verification burden nobody had sized. Two weak cases
that did not add up.

## The unsized risk, worth carrying forward

Every rule carried a `recheckDueOn` date because policies change per intake. Six
rules existed; all were due within six months. **Nobody ever established how many
rules one person can honestly re-verify per intake** — and that number, not build
speed, sets the maximum sustainable size of any reference dataset. A stale
reference site is worse than a small one.

Any future project that stores facts about the outside world inherits this
problem. Size it before building, not after.

## What is worth reusing

**Practices that earned their keep:**

- **`AGENTS.md` as a living status document.** Session boundaries destroy
  context; a file in the repo is the only thing that survives them. It worked
  exactly as intended — every session started oriented.
- **Recording *why*, not just *what*.** `docs/decision-log.md` is the most
  valuable file here. It is the reason this post-mortem could be written honestly
  instead of reconstructed from memory.
- **Encoding ambiguity as enum values rather than collapsing it.**
  `UNKNOWN` ≠ `NOT_IN_REGISTER`; `ASSIGNED` ≠ `NOT_IN_FRAMEWORK`;
  `PRINTED_ON_DOCUMENT` ≠ `FILE_METADATA`. Three times a `NOT NULL` column
  compelled a value without compelling its meaning, and each time the fix was to
  add a column recording *how we know*.
- **Making the impossible claim unrepresentable.** The answer type has no field
  that could carry "you will receive N credits". Enforcing a product rule in the
  type system beats enforcing it in review.
- **Mirroring database constraints as pure functions.** Testable without a
  database, and lets the UI produce a readable error rather than a Postgres one.

**The transferable lesson:**

The premise was testable in about a day — read three source documents and compare
them. It was not tested until a week of infrastructure had been built on top of
it. **Every project of this shape has one cheap question that decides whether it
is worth building. Find it and answer it first.**

Here it was: *"do three institutions actually publish different numbers?"* Three
PDFs. One afternoon. It would have saved the entire build.

## Final state

- Repository: 6 merged PRs, `main` green — typecheck, lint, 31 tests, build
- Database: Neon free tier, `development` and `preview` branches, 3 institutions
- No deployment, no users, no public pages, nothing published

Nothing here is broken. It is simply not worth continuing.
