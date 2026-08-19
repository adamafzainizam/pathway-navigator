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

**Phase:** Week 0 — repository scaffolded, nothing built.

**Done:**
- [x] Repository structure and documentation
- [x] Prisma schema drafted (`prisma/schema.prisma`) — **not yet migrated or validated against a real database**
- [x] Research completed on data sources, saturation, SEO, monetization (see `docs/`)

**Not started:** everything else.

**Nothing in this repo has been run.** The schema has never been through `prisma validate`, no dependencies are installed, no database exists. First session must verify the scaffold actually works before building on it.

---

## 4. Next up

**Immediate (first working session):**

0. **`package.json` has no dependencies listed on purpose.** It was written without network access, so pinning versions would mean inventing them. Scaffold properly instead — run `npx create-next-app@latest` in a temp directory with TypeScript + Tailwind + App Router + `src/` + `@/*` alias, then merge its `package.json`, `tsconfig.json`, `next.config`, and `eslint` config into this repo. Add `prisma`, `@prisma/client`, `tsx`, and `dotenv` after. Keep the `scripts` block already defined here.
1. `npm install`, then `npx prisma validate` — the schema in this repo was written without network access and has never been checked by the Prisma CLI. Expect to fix things. Note Prisma 7 wants the connection string in `prisma.config.ts`, not the `datasource` block; the schema currently uses the older `env("DATABASE_URL")` form and will likely need adjusting.
2. Create the Neon project and `development` branch. Set `DATABASE_URL`.
3. First migration. Confirm the generated client includes all models.
4. Seed the qualification/MQF backbone (`prisma/seed.ts`).

**Weeks 1–2 target:** admin entry form + 3–5 institutions' rules entered end to end.
**Success test:** one real progression question answered correctly from the database, with sources attached.

**Explicitly deferred:** public UI, SEO pages, the interactive checker, study-abroad data. Do not start these before the data layer is proven.

---

## 5. The hard ceiling (read before designing any UI)

Per-course transfer decisions are discretionary. Institutional guidelines state outright that the faculty reserves the right to determine approval for each course applied for.

**Therefore the tool must never render:** "you will receive N credits."

**It may render:** which programmes are accredited (and therefore transferable at all), MQF levels, the institution's stated cap, whether a route is transfer or exemption, which APEL route applies, what documents to prepare, and who to contact.

The `Caveat` model exists for exactly this. Caveats render as **visible warnings on the page, not as fine print**.

Being explicit about where certainty ends is the differentiator, not a weakness. Competitors either overpromise or stay vague.

---

## 6. Gotchas

Empty for now — this project has not been run. **But the following are inherited from `campus-marketplace` and almost certainly still apply**, since the stack is deliberately the same:

- **Prisma 7** keeps the connection string in `prisma.config.ts`, not `schema.prisma`. `PrismaClient` needs an explicit driver adapter. Standalone scripts need `import "dotenv/config"` or `DATABASE_URL` silently falls back to `localhost:5432`.
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
├── README.md              ← public-facing project description
├── LICENSE                ← MIT
├── .env.example           ← copy to .env, never commit .env
├── prisma/
│   ├── schema.prisma      ← the data model
│   └── seed.ts            ← qualification/MQF backbone
├── docs/
│   ├── decision-log.md    ← dated record of non-trivial choices + reasoning
│   ├── data-sources.md    ← what's accessible, what isn't, the hard ceiling
│   ├── seo.md             ← keyword tiers, page architecture, bilingual plan
│   └── scope.md           ← v1 slice and fortnightly milestones
├── scripts/               ← standalone tooling (see gotcha re: DATABASE_URL)
└── src/
    ├── app/               ← Next.js App Router
    ├── lib/               ← pure logic, kept separate from I/O for testability
    └── components/
```

**Keep rules logic pure and separate from I/O**, in `src/lib/`. This was what made mutation-testing tractable in `campus-marketplace` — revert a control, confirm its test fails, restore it. Same pattern applies here for eligibility matching and cap resolution.

---

## 9. Session log

Append a short entry per working session. Newest at the bottom.

| Date | Who | What changed |
|---|---|---|
| (scaffold) | Claude (chat) | Repository created: docs, schema draft, no code run |
