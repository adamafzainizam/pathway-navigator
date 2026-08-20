# Pathway Navigator

> ## ⚠️ Discontinued — August 2026
>
> This project was stopped after its central premise failed a reality check:
> Malaysian credit transfer caps are set by a national MOHE/MQA baseline that
> institutions restate, not chosen per institution — so a database organised
> around per-institution caps had little to offer.
>
> **[Read the post-mortem](docs/post-mortem.md)** for what was built, what was
> learned, and the one cheap question that would have settled it in an afternoon.
>
> The code works: three CHECK constraints Prisma cannot express, verified live;
> 31 tests; three institutions transcribed with full provenance. It is kept as a
> record, not as a product.


> **Working name.** The public-facing name is not yet chosen and will likely be in Bahasa Melayu — see `docs/seo.md`.

A bilingual decoder for the Malaysian credit transfer process.

Not "what should I do after SPM" — there is no shortage of that content, and every institution publishes one as marketing. This answers the questions those guides skip:

- When this university says **exemption**, does that mean I get the credit, or that I have to take another subject instead? (It depends on the university. They contradict each other.)
- Which step in this process quietly disqualifies me if I miss it?
- Is this programme actually accredited, and therefore transferable at all?
- What does this institution simply not publish — and what does that mean for planning?
- Where does the published information stop and the faculty's discretion begin?

---

## Status

**Early. Data layer working, no public UI yet.** Three institutions' policies
are in the database and answer real questions with sources and caveats attached;
there are no pages to read them on. Data entry is deliberately paused while the
scope is narrowed. See [`AGENTS.md`](AGENTS.md) for current status.

## Why this exists

Existing Malaysian guides assert things like *"lulusan Diploma berpeluang dikecualikan daripada Tahun 1"* with no way for a reader to check whether it applies to **their** diploma at **their** target university.

The most concrete example found so far, from the institutions' own documents:

> **Universiti Malaya:** a course exemption *"will not result in a student obtaining credit for the course which is exempted"*, and the exempted course *"shall be replaced with another course"*.
>
> **UTHM:** *"Credit Exemption — Credit Transfer Without Grade"*, where the credit **is** counted toward graduation.

Two public universities, one phrase, opposite meanings. A student who learns the word at one is wrong at the other, and the difference is a subject you either do or do not have to take. No guide in either language explains this.

That is the gap: not that the rules are hidden, but that they are written in vocabulary that is not consistent between the institutions using it.

### What this project no longer claims

The original premise was that credit transfer **caps** vary per institution and needed collecting. Three institutions disproved that — UTHM, UM and MMU all restate the same tiered 30%/50% structure, because it descends from Ministry of Higher Education and MQA policy rather than institutional choice. The finding, and what it changed, is recorded in [the decision log](docs/decision-log.md).

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
