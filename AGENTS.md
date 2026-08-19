# AGENTS.md

**Living status document for this repository.** Whichever AI agent (or human) works on this project reads this first and updates it before finishing a session. This file — not any chat history, not any external memory — is the canonical record.

> This mirrors the `AGENTS.md` practice established in the `campus-marketplace` project, which proved its value repeatedly: session boundaries destroy context, and a file in the repo is the only thing that survives them.

---

## 0. How to use this file

**At session start:** read sections 1–4. Read section 6 (gotchas) before writing any code.

**Before finishing:** update section 3 (status), add any new decision to `docs/decision-log.md`, add any new trap to section 6, and update section 4 (next up) so the next session starts oriented.

**Do not** record decisions only in commit messages. Commits explain a diff; this file explains the project.

---

## 1. What this project is

A tool answering the *mechanical* questions about Malaysian education pathways: what a given qualification actually gets you, at which institution, with what credit transfer, under what rules.

**Not** another "what to do after SPM" guide. Every institution in Malaysia publishes one as marketing. The gap is the mechanics layer — accreditation status, MQF levels, per-institution transfer caps, transfer-vs-exemption, APEL routes — which exists only as scattered institutional PDFs and a government register.

**The product is the structured dataset.** The web app is how it's queried. An AI content farm cannot generate this dataset because it isn't in prose anywhere; that's the moat.

**Working name:** Pathway Navigator. This is a placeholder — the public-facing name is not yet chosen and should probably be Bahasa Melayu, since that's where the SEO opening is (see `docs/seo.md`).

---

## 2. Standing constraints

These are not negotiable without an explicit decision recorded in `docs/decision-log.md`.

1. **No spending.** Free tiers only. Ask before introducing anything billable. (Carried over from `campus-marketplace`, where this constraint held for the entire project.)
2. **Provenance on every claim.** Every rule row carries a source URL, the source document's own date, and a human verification date. Enforced `NOT NULL` at the database level, from the first migration.
3. **Never overstate certainty.** Per-course transfer decisions are made by faculties case-by-case and are unpublished. The tool states where certainty ends. See section 5.
4. **Bilingual from day one.** BM and EN, route-level i18n. Not a later port.
5. **Git workflow:** one feature = one branch, atomic commits, PR per feature, tagged releases. Branch *before* writing code, not after.
6. **Reasoning gets recorded**, not just outcomes. The builder is using this project to learn, so the *why* matters as much as the *what*.

---

## 3. Current status

**Phase:** Week 0 — scaffold verified and running locally. No database yet.

**Done:**
- [x] Repository structure and documentation
- [x] Research completed on data sources, saturation, SEO, monetization (see `docs/`)
- [x] Git repository initialised; scaffold committed as a restore point
- [x] Next.js 16.3.1 scaffold merged in (TypeScript, Tailwind 4, App Router, `src/`, `@/*` alias)
- [x] Dependencies installed and pinned in `package-lock.json`
- [x] Prisma 7.9.1 wired up: `prisma.config.ts` added, schema fixed, **`prisma validate` passes**
- [x] Generated client confirmed to contain all five models
- [x] `npm run build`, `npm run typecheck`, `npm run lint` all pass; dev server serves `/` with HTTP 200

**Not started:** the database itself, and everything downstream of it.

**Still true: no database exists.** The schema validates, but it has never been
migrated — `DATABASE_URL` currently points at a placeholder that is never
connected to. Nothing has round-tripped through Postgres. Section 4 picks up
exactly there.

---

## 4. Next up

**Immediate (next working session) — steps 0 and 1 are done; this is where it stopped:**

1. **Create the Neon project and its `development` branch.** Free tier, Singapore
   region (`ap-southeast-1`) — closest to the audience. Copy the **pooled**
   connection string into `.env` as `DATABASE_URL`, replacing the placeholder
   that is there now. Give **Preview** its own Neon branch at the same time
   rather than later; see section 6 on why sharing one is a trap.
2. **First migration:** `npm run db:migrate -- --name init`. This is the first
   time any of this touches a real database, so expect to fix things.
3. **Add the CHECK constraint Prisma cannot express.** `ProgressionRule` requires
   exactly one of `fromQualificationId` / `fromProgrammeId` to be set. Write it
   by hand into the generated migration SQL *before* applying, or as a follow-up
   migration. Mirror it as a validation function in `src/lib/`.
4. **Seed the backbone:** `npm run seed`. Note the file's own warning — the MQF
   levels in it were drafted from research notes, not read off the current MQF
   document. Verify them against MQA's published framework and record the
   verification date in `docs/decision-log.md` before building rules on top.

**Weeks 1–2 target:** admin entry form + 3–5 institutions' rules entered end to end.
**Success test:** one real progression question answered correctly from the database, with sources attached.

**Explicitly deferred:** public UI, SEO pages, the interactive checker, study-abroad data. Do not start these before the data layer is proven.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
