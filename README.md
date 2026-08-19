# Pathway Navigator

> **Working name.** The public-facing name is not yet chosen and will likely be in Bahasa Melayu — see `docs/seo.md`.

A tool for answering the *mechanical* questions about Malaysian education pathways.

Not "what should I do after SPM" — there is no shortage of that content, and every institution in Malaysia publishes one as marketing. This answers the harder questions those guides skip:

- Is this programme actually accredited, and therefore transferable at all?
- What MQF level does my qualification sit at, and what does that let me enter?
- What is *this* university's credit transfer cap?
- Is this route a credit **transfer** or a credit **exemption**? (They are not the same thing, and the difference can cost a semester.)
- Does APEL apply to me, and which kind?
- What do I actually need to prepare, and who do I ask?

---

## Status

**Week 0 — scaffold verified, database not yet created.** The app builds and runs
locally and the Prisma schema validates, but no migration has been applied and
there is no data. See `AGENTS.md` for current status and next steps.

## Why this exists

That information does exist. It's just scattered across a government register and hundreds of institutional PDFs, and no one has assembled it into something queryable.

Existing Malaysian guides assert things like *"lulusan Diploma berpeluang dikecualikan daripada Tahun 1"* with no way for a reader to check whether it applies to **their** diploma at **their** target university. Closing that gap is the whole point.

## What it deliberately does not do

**It will never tell you "you will receive N credits."**

Per-course transfer decisions are made by faculties case-by-case and are not published anywhere. Institutional guidelines state this outright. Any tool claiming otherwise is guessing.

What it does instead is show you the rules, the caps, the accreditation status, and exactly where the uncertainty begins — with a link to the source document and the date it was last verified.

Being precise about where certainty ends is the point, not a limitation.

---

## Tech stack

Deliberately the same as its predecessor project (`campus-marketplace`), so that hard-won knowledge of its failure modes carries over. Novelty budget is spent on the graph logic and data pipeline, not on infrastructure.

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript, Tailwind) |
| Database | Neon (serverless Postgres, Singapore region) |
| ORM | Prisma |
| Hosting | Vercel |
| i18n | Route-level, `/ms/` and `/en/` |

**Constraint: this project is built without spending money.** Free tiers only.

---

## Getting started

```bash
# 1. Install
npm install

#    npm 11 skips install scripts by default and still exits 0. If you see a
#    `npm warn allow-scripts` block, the Prisma engines and esbuild never
#    unpacked — approve them and install again:
npm approve-scripts prisma @prisma/engines esbuild unrs-resolver && npm install

# 2. Environment
cp .env.example .env
#    Then fill in DATABASE_URL from your Neon development branch.

# 3. Validate the schema
npx prisma validate

# 4. Migrate
npm run db:migrate -- --name init

# 5. Seed the qualification / MQF backbone
npm run seed

# 6. Run
npm run dev
```

Note that `npm run typecheck` fails on a fresh clone until `npm run build` or
`npm run dev` has run once — Next generates route types into `.next/types` that
`tsconfig.json` includes.

### A warning about scripts

Any standalone script run "against production" will **silently target development** unless `DATABASE_URL` is overridden inline on the command line. `dotenv` loads `.env` and does not overwrite an already-set variable. This bit the predecessor project more than once.

```bash
# Correct:
DATABASE_URL="postgres://...prod..." npx tsx scripts/whatever.ts
```

---

## Documentation

| File | Contents |
|---|---|
| `AGENTS.md` | **Living status document.** Read first. Current state, next steps, gotchas, data-entry discipline. |
| `docs/decision-log.md` | Dated record of non-trivial decisions and the reasoning behind them. |
| `docs/data-sources.md` | What data is accessible, what isn't, and the hard ceiling on what can be promised. |
| `docs/seo.md` | Keyword tiers, page architecture, the bilingual decision. |
| `docs/scope.md` | The v1 slice and fortnightly milestones. |

---

## Contributing

This is a personal portfolio project, but corrections to the dataset are genuinely welcome — if a rule here is wrong or out of date, that matters more than any code contribution.

Every rule in the database carries a source URL and a verification date. If you spot one that's stale or wrong, open an issue with the current source document.

---

## Disclaimer

This is an independent project. It is not affiliated with, endorsed by, or operated by the Malaysian Qualifications Agency, the Ministry of Higher Education, or any educational institution listed within it.

Information is compiled from publicly available sources and may be out of date or incorrect. **Always confirm with the institution directly before making an education decision.** Every entry links to its source and shows when it was last verified — use those.

Note that MQA itself disclaims liability for the accuracy of the register data this project draws on.

## License

MIT — see `LICENSE`.
