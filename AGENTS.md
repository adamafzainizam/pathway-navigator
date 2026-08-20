# AGENTS.md

> ## ⚠️ PROJECT DISCONTINUED — 2026-08-20
>
> This project was stopped deliberately after its central premise was tested and
> did not hold: credit transfer caps turned out to be a national MOHE/MQA
> baseline that institutions restate, not a per-institution variable.
>
> **Read [`docs/post-mortem.md`](docs/post-mortem.md) first.** Everything below
> is preserved as it stood at the end, including the sections that describe
> plans that were never carried out. Do not resume work here without reading the
> post-mortem — several of the assumptions stated below are known to be wrong.


**Living status document for this repository.** Whichever AI agent (or human) works on this project reads this first and updates it before finishing a session. This file — not any chat history, not any external memory — is the canonical record.

> This mirrors the `AGENTS.md` practice established in the `campus-marketplace` project, which proved its value repeatedly: session boundaries destroy context, and a file in the repo is the only thing that survives them.

---

## 0. How to use this file

**At session start:** read sections 1–4. Read section 6 (gotchas) before writing any code.

**Before finishing:** update section 3 (status), add any new decision to `docs/decision-log.md`, add any new trap to section 6, and update section 4 (next up) so the next session starts oriented.

**Do not** record decisions only in commit messages. Commits explain a diff; this file explains the project.

---

## 1. What this project is

A bilingual decoder for the Malaysian credit transfer process: what the words
actually mean at a given institution, which steps quietly disqualify you, and
where the published information stops.

**Not** another "what to do after SPM" guide. Every institution publishes one as
marketing.

**Also not — any more — a per-institution cap lookup.** That was the original
thesis and three institutions disproved it. UTHM, UM and MMU all restate the
same tiered 30%/50% structure, because it descends from MOHE and MQA policy
rather than from institutional choice; MMU's document says so on page 1. A
database whose main axis is "look up your university's cap" answers a question
whose answer is one sentence and mostly the same everywhere. Evidence and
reasoning: `docs/decision-log.md`, 2026-08-19.

**What actually varies, and is therefore worth collecting:**

1. **The vocabulary is contradictory between institutions.** UM defines a course
   exemption as giving *no credit*, requiring the course be replaced. UTHM's
   glossary defines credit exemption as credit transfer *without grade*, where
   the credit *does* count toward graduation. Same phrase, opposite meanings,
   two public universities. A student who learns the term at one is wrong at the
   other, and no guide in either language explains this.
2. **Process traps.** UTHM refuses credit transfer applications made after the
   first semester, outright. Prerequisites do not transfer automatically at UM. A
   faculty may raise the minimum grade with Senate permission. Each of these
   costs real time and none is prominent in any prospectus.
3. **What is not published at all.** UTHM and MMU do not publish graduating
   credit totals, so their percentage caps cannot be converted into credits by
   anyone, including us. UM publishes 128, so its caps resolve to 38 and 64.
4. **Whether a claim can be trusted**, and how stale it is.

**The product is a small, deeply verified dataset plus the explanation of what
it means.** Coverage is measured in terms disambiguated and traps documented,
not in institution count. Depth over breadth is not a compromise here — breadth
was tested and found to be mostly repetition.

**On the moat.** The README used to claim an AI content farm could not generate
this because it is not in prose anywhere. That is now known to be too
comfortable: an AI extracted three institutional policies from PDFs in an
afternoon. Extraction is not the hard part. What is not easily copied is the
discipline — `UNKNOWN` versus `NOT_IN_REGISTER`, refusing to state an MQF level
MQA declines to assign, recording that a document has no date. A content farm
will not do that, because doing it makes the output look less confident. That is
the real differentiator and it is a behavioural one, not a data one.

**Working name:** Pathway Navigator. Placeholder; the public name is not chosen
and should probably be Bahasa Melayu (see `docs/seo.md`). Note the working name
now describes the old thesis better than the current one.

---

## 2. Standing constraints

These are not negotiable without an explicit decision recorded in `docs/decision-log.md`.

1. **No spending.** Free tiers only. Ask before introducing anything billable. (Carried over from `campus-marketplace`, where this constraint held for the entire project.)
2. **Provenance on every claim.** Every rule row carries a source URL, a human
   verification date, and a statement of how the source document's date is
   known. `sourceUrl`, `verifiedOn` and `sourceDateBasis` are `NOT NULL`.
   *Amended 2026-08-19:* `sourceDocumentDate` itself is now nullable, because
   real institutional documents are frequently undated and forcing a date
   produced a column that could not say how strong it was. The obligation did
   not weaken — a row must still state its provenance, it simply may now state
   "this document carries no date" instead of inventing one. Reasoning in
   `docs/decision-log.md`.
3. **Never overstate certainty.** Per-course transfer decisions are made by faculties case-by-case and are unpublished. The tool states where certainty ends. See section 5.
4. **Bilingual from day one.** BM and EN, route-level i18n. Not a later port.
5. **Git workflow:** one feature = one branch, atomic commits, PR per feature, tagged releases. Branch *before* writing code, not after.
6. **Reasoning gets recorded**, not just outcomes. The builder is using this project to learn, so the *why* matters as much as the *what*.

---

## 3. Current status

**Phase:** DISCONTINUED 2026-08-20. Final state: the data layer works end to
end and three institutions' policies answer real questions with sources and
caveats attached. There is no public UI and there never will be. See
`docs/post-mortem.md`.

**Done:**
- [x] Repository structure and documentation
- [x] Research completed on data sources, saturation, SEO, monetization (see `docs/`)
- [x] Git repository initialised; scaffold committed as a restore point
- [x] Next.js 16.3.1 scaffold merged in (TypeScript, Tailwind 4, App Router, `src/`, `@/*` alias)
- [x] Dependencies installed and pinned in `package-lock.json`
- [x] Prisma 7.9.1 wired up: `prisma.config.ts` added, schema fixed, **`prisma validate` passes**
- [x] Generated client confirmed to contain all five models
- [x] `npm run build`, `npm run typecheck`, `npm run lint` all pass; dev server serves `/` with HTTP 200

- [x] Neon project created — Singapore (`ap-southeast-1`), Postgres 18.6, free tier
- [x] `development` and `preview` branches both created (Preview not left sharing a database — see section 6)
- [x] First migration applied; all five tables present
- [x] `ProgressionRule_exactly_one_source` CHECK constraint added by hand and **verified against the live database**
- [x] Mirrored as a pure function in `src/lib/rules/progression-source.ts`, 7 unit tests passing
- [x] Backbone seeded: 13 qualifications
- [x] MQF levels in the seed verified against the MQF 2nd Edition document

**Not started:** institutions, programmes, progression rules, admin UI.

- [x] `mqfLevel` made nullable, `MqfStatus` enum added, four wrong rows corrected
- [x] Second CHECK constraint tying level to status, verified live across all six combinations
- [x] 15 unit tests passing across two pure rule modules

- [x] Three real institutions entered: UTHM, UM, MMU — 3 programmes, 6 rules, 23 caveats
- [x] **Success test passed** — a real progression question answered from the database with sources attached (`npx tsx scripts/ask.ts`)
- [x] Hard ceiling enforced in code: the answer type cannot express "you will receive N credits"

**Current qualification data:** 3 `ASSIGNED` (verified against the MQF
document), 4 `NOT_IN_FRAMEWORK` (verified — MQA deliberately assigns no level),
6 `UNKNOWN` (TVET rows carrying drafted levels that no source has confirmed).
Nothing in the database now claims an MQF level it cannot support.

---

## 4. Next up

**Direction settled 2026-08-19: narrow to the decoder. Data entry is PAUSED.**
Do not add institutions until the pages that explain the existing data exist.
Three institutions already contain more unexplained material than the site can
currently present, and adding a fourth does not change that.

1. **Write the terminology decoder.** The credit-transfer / credit-exemption /
   transfer-with-grade / transfer-without-grade tangle, shown as what each term
   means *at each institution we hold*, side by side, with the source quote. This
   is the highest-value thing in the dataset and it currently exists only as a
   severity-3 caveat string.
2. **Then the first public page type**, bilingual, server-rendered, with every
   claim carrying its source and verification date. One page done properly beats
   five stubs.
3. **Then, and only then, resume data entry** — and when resuming, collect
   terminology and process traps first, caps second. `scripts/import-uthm.ts`,
   `import-um.ts` and `import-mmu.ts` are the pattern.

**Known data debt (deliberately not blocking):**

- Six TVET qualification rows are `UNKNOWN` and need a JPK source; `kv`
  conflates Sijil Vokasional Malaysia with Diploma Vokasional Malaysia.
- `Programme.nameMs` holds English text for UM and MMU because neither publishes
  a Malay programme name. Visibly wrong to a Malay reader; inventing an official
  award title would be worse. Needs sourcing, not translating.
- All three programmes are `accreditationStatus: UNKNOWN` — the MQA register
  cannot be queried programmatically (section 6).
- `Institution.state` cannot represent MMU's two campuses and is null.

**The maintenance question is the real risk, and it is not answered.** Every rule
carries `recheckDueOn`. Six rules are due in six months. Before coverage grows,
decide honestly how many rules one person can re-verify per intake — a stale
reference site is worse than a small one.

**Explicitly deferred:** the interactive checker, study-abroad data, the admin
entry form (defer it further — its shape depends on what the decoder needs).

The root layout and `src/app/page.tsx` are deliberately a placeholder, and
`lang` is hardcoded to `en`. When route-level i18n lands, the layout becomes a
`[locale]` layout and `lang` comes from the route param.

---

## 5. The hard ceiling (read before designing any UI)

Per-course transfer decisions are discretionary. Institutional guidelines state outright that the faculty reserves the right to determine approval for each course applied for.

**Therefore the tool must never render:** "you will receive N credits."

**It may render:** which programmes are accredited (and therefore transferable at all), MQF levels, the institution's stated cap, whether a route is transfer or exemption, which APEL route applies, what documents to prepare, and who to contact.

The `Caveat` model exists for exactly this. Caveats render as **visible warnings on the page, not as fine print**.

Being explicit about where certainty ends is the differentiator, not a weakness. Competitors either overpromise or stay vague.

---

## 6. Gotchas

### Confirmed in this repository

Each of these was hit and verified on 2026-08-19, not inherited.

- **`npm install` exits 0 while silently skipping install scripts.** npm 11 gates
  them behind an allowlist. Four packages here need theirs: `prisma`,
  `@prisma/engines`, `esbuild` (which `tsx` runs on) and `unrs-resolver` (which
  ESLint's import resolver runs on). The only sign is a `npm warn allow-scripts`
  block in output you have probably already scrolled past — the exit code is 0
  and `node_modules/` looks complete. *Symptom:* a tool that should work fails
  bizarrely right after a "successful" install. *Fix:*
  `npm approve-scripts <pkg> ...`, then re-run `npm install`. Approvals are
  written into the `allowScripts` block of `package.json` **pinned to exact
  versions**, so bumping any of those four packages needs re-approval — and will
  present as this same silent breakage.

- **Prisma 7 rejects `url` inside the `datasource` block outright** — it is not a
  warning. `P1012: The datasource property 'url' is no longer supported in
  schema files.` The URL belongs in `prisma.config.ts`; the schema block declares
  only `provider`.

- **The Prisma 7 CLI does not load `.env` at all.** `prisma.config.ts` must
  `import "dotenv/config"` itself. Without it: `PrismaConfigEnvError: Cannot
  resolve environment variable: DATABASE_URL`. *The error names the project
  directory, not the config file*, which makes it read like a much bigger
  problem than a missing import.

- **`tsc --noEmit` fails on a clean checkout until something has built once.**
  Next 16 generates `LayoutProps` / `PageProps` into `.next/types`, which
  `tsconfig.json` includes. *Symptom:* `error TS2304: Cannot find name
  'LayoutProps'` in `src/app/layout.tsx`. Not a real type error — run
  `npm run build` (or `npm run dev`) once. Worth remembering when CI runs
  typecheck before build.

- **`npm audit` reports 3 high-severity advisories that should be left alone.**
  All three are `deepmerge-ts` (stack exhaustion on recursive object graphs)
  reached via `@prisma/config`. It parses our own config file at CLI time, not
  untrusted input. `npm audit fix --force` "fixes" it by downgrading to
  **Prisma 6.12 — a major version back**. Don't. Re-check when Prisma ships a
  bumped `@prisma/config`.

- **Testing a CHECK constraint with several cases in one transaction gives
  false results.** In Postgres, one failed statement aborts the entire
  transaction; every later statement then fails with a *different* error
  regardless of merit. *Symptom:* the first bad case is correctly rejected, then
  a case you know is valid is also "rejected" — reading as though the constraint
  is far too strict. Give each case its own transaction and roll it back.

- **`node --test` and `tsc` disagree about import extensions.** Node's native
  type stripping requires `./thing.ts` on relative imports inside test files;
  `tsc` rejects that with `TS5097` unless `allowImportingTsExtensions` is set.
  It is set in `tsconfig.json`, which is only valid because `noEmit` is true.

- **`prisma.$queryRaw` cannot deserialise Postgres's `name` type.** `SELECT
  current_user` or `current_database()` fails with "Failed to deserialize column
  of type 'name'", which reads like a connection problem but is not — the
  connection is fine. Cast in the query: `current_user::text`.

- **tsx runs `.ts` files as CommonJS** unless `package.json` sets
  `"type": "module"`, so top-level `await` in a standalone script fails with an
  esbuild `TransformError`, not a Node error. Wrap script bodies in an
  `async main()` the way `prisma/seed.ts` does.

- **The MQA register (MQR) cannot be queried programmatically.**
  `www2.mqa.gov.my/mqr/` is a frameset wrapping a POST-based ColdFusion search;
  there is no URL pattern that returns a programme record. Consequence for data
  entry: accreditation must be checked by hand, and until it is, the status is
  `UNKNOWN` — never `NOT_IN_REGISTER`, which asserts a search was performed.

- **Institutional policy PDFs are often undated.** UTHM's eleven-page credit
  transfer guidelines carry no printed date. `pdfinfo` metadata is the fallback,
  but `CreationDate` is when the file was exported, not when the policy took
  effect. Always run `pdfinfo` and record which kind of date you got.

- **Neon free-tier compute suspends when idle, and the first command after that
  fails with `P1001: Can't reach database server`.** It reads like a wrong host
  or a dead database; it is neither. The connection attempt itself wakes the
  compute, so simply running the same command again succeeds. Hit twice in one
  session. Do not go debugging the connection string over this — retry first.

- **Neon's pooled connection is fine for `prisma migrate dev`.** Worth recording
  because the opposite is widely assumed: PgBouncer in transaction mode cannot
  run `CREATE DATABASE`, so shadow-database creation was expected to fail. It
  did not — no separate direct/unpooled URL was needed.

### Inherited from `campus-marketplace`

Not yet re-confirmed here, but the stack is deliberately the same, so assume they apply:

- Standalone scripts need `import "dotenv/config"` or `DATABASE_URL` is simply
  unset. `src/lib/db.ts` now throws loudly in that case rather than defaulting,
  because the old failure mode was a silent fallback to `localhost:5432`.
- A migration can apply without the generated client picking up new models. Verify the client after migrating. A stale dev server (started before the migration) is diagnosable from its error still listing old fields.
- **Any standalone script "against production" silently targets development** unless `DATABASE_URL` is overridden inline on the command line — `dotenv` loads `.env` and does not overwrite an already-set variable.
- **A migration applied to one Neon branch is not applied to another.** Every branch needs its own `migrate deploy`, and the resulting error never names which database is out of sync.
- Vercel's build step never applies migrations by itself. `prisma generate` succeeding is not evidence the schema is in sync.
- A shared `DATABASE_URL` across environments means opening a PR migrates *production* when Vercel builds the preview. Give Preview its own database from the start — this was left outstanding in the marketplace project and shouldn't be repeated.
- Vercel Deployment Protection is **on by default** and makes the whole site require a Vercel login. Fatal for a public site.
- Next.js **masks errors thrown out of a server action** in production builds. Return typed results; never throw for validation failures.
- Any CSS the build can rewrite needs its *compiled* output read, not its source grepped. Source saying X and build saying X are different claims.
- `git checkout <file>` during mutation testing deletes uncommitted work. Commit first, then mutate, then revert.

Add project-specific gotchas here as they're found, with enough detail that the *symptom* is searchable, not just the fix.

---

## 7. Data entry discipline

Hundreds of rules will be hand-entered. This is where the project succeeds or quietly rots.

- **Never enter a rule without its source URL and document date.** The schema enforces this; don't work around it.
- **`NOT_IN_REGISTER` ≠ `UNKNOWN`.** The first means a search was performed and returned nothing. The second means nobody has looked. Collapsing them is how a reference site starts lying.
- **A missing MQA register record is ambiguous** — it can mean provisional accreditation not yet matured, the provider never applied, the programme predates 1997, or accreditation was refused. Never render "not found" as "not accredited."
- **Set `recheckDueOn` on every rule.** Policies change per intake. Staleness kills credibility faster than gaps do.
- When a rule changes, **add a new row and close the old one** via `effectiveTo`. Never edit history — a student who applied under previous rules still needs the answer that was true then.

---

## 8. Repository map

```
├── AGENTS.md              ← you are here
├── CLAUDE.md              ← one line: points Claude Code at AGENTS.md
├── README.md              ← public-facing project description
├── LICENSE                ← MIT
├── .env.example           ← copy to .env, never commit .env
├── prisma.config.ts       ← Prisma 7 config: connection URL, seed command
├── prisma/
│   ├── schema.prisma      ← the data model (provider only; no URL — see §6)
│   └── seed.ts            ← qualification/MQF backbone
├── docs/
│   ├── decision-log.md    ← dated record of non-trivial choices + reasoning
│   ├── data-sources.md    ← what's accessible, what isn't, the hard ceiling
│   ├── seo.md             ← keyword tiers, page architecture, bilingual plan
│   └── scope.md           ← v1 slice and fortnightly milestones
├── scripts/               ← standalone tooling (see gotcha re: DATABASE_URL)
└── src/
    ├── app/               ← Next.js App Router
    ├── generated/prisma/  ← generated client, gitignored, rebuilt on build
    ├── lib/
    │   └── db.ts          ← the ONLY place a PrismaClient is constructed
    └── components/
```

**Keep rules logic pure and separate from I/O**, in `src/lib/`. This was what made mutation-testing tractable in `campus-marketplace` — revert a control, confirm its test fails, restore it. Same pattern applies here for eligibility matching and cap resolution.

---

## 9. Session log

Append a short entry per working session. Newest at the bottom.

| Date | Who | What changed |
|---|---|---|
| (scaffold) | Claude (chat) | Repository created: docs, schema draft, no code run |
| 2026-08-19 | Claude (Claude Code) | `git init`. Next 16.3.1 scaffold merged. Deps installed. Prisma 7 wired up (`prisma.config.ts`, `prisma-client` generator, Neon driver adapter in `src/lib/db.ts`). `prisma validate` passes, build/typecheck/lint pass, dev server serves `/`. **Stopped at: Neon project not created, no migration run.** |
| 2026-08-19 | Claude (Claude Code) | Neon project created (Singapore, PG 18.6), `development` + `preview` branches. First migration applied with hand-written CHECK constraint, verified live. Pure mirror + 7 tests in `src/lib/rules/`. Seeded 13 qualifications. **MQF levels verified against the MQF 2nd Edition — four seed rows are wrong and need a schema decision before they can be fixed.** |
| 2026-08-19 | Claude (Claude Code) | Resolved the MQF modelling problem: `mqfLevel` nullable + `MqfStatus` enum + CHECK constraint, migration `mqf_status`. Four wrong rows corrected, six TVET rows flagged `UNKNOWN`. Pure mirror in `src/lib/rules/mqf-level.ts`, 15 tests passing. Week 0 done. |
| 2026-08-19 | Claude (Claude Code) | GitHub repo created (private, `adamafzainizam`), PR #1 merged. First real institution entered: UTHM credit transfer guidelines, 2 tiered rules, 9 caveats. Pure answer builder + 25 tests; the hard ceiling is now a type constraint, not a convention. **Success test passed.** Found a third schema gap: `sourceDocumentDate` cannot say how it knows the date. |
| 2026-08-19 | Claude (Claude Code) | Added UM and MMU. Found the diploma→bachelor caps are a national MOHE/MQA baseline, not a per-institution variable — the original thesis. **Thesis narrowed to the decoder** (terminology, process traps, publication gaps); coverage target cut from 15–20 institutions to 5–8; data entry paused; moat claim corrected. §1, README, scope.md and seo.md all restated. |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
