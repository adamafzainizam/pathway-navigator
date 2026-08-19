
# Pathway Navigator — Scope & Milestones

Part of this project — see the main [README](../README.md) and [AGENTS.md](../AGENTS.md). Roughly 8–10 weeks at 10–20 hrs/week, matching the pace of the campus-marketplace project.

## The v1 slice

Be ruthless. The single most important scoping decision is **one field only: Computing / IT / Software Engineering.** It's the field already understood from the inside, it has high student volume, and it keeps the data grind finite.

**Coverage target:**
- ~15–20 institutions — a mix of public universities, private universities, polytechnics, and GMI-type technical institutes
- All entry qualifications: SPM, STPM, Matrikulasi, Asasi/Foundation, KV, Sijil Kemahiran, Diploma, Advanced Diploma
- Both query directions: *"I have X, where can I go?"* and *"I want Y, how do I get there?"*

**What v1 explicitly does NOT do:** promise credit counts, predict admission outcomes, or cover study abroad. Those are later — see study-abroad expansion (see AGENTS.md).

## Fortnightly plan

### Weeks 1–2 — Data foundation, no UI
Schema, the qualification/MQF backbone seeded, the register ingestion path, and 3–5 institutions' rules entered by hand end to end. Ship a CLI or admin view only.

**Success test:** one real progression question answered correctly from the database, with sources attached.

The temptation is to build pretty pages first. Resist it — if the data model is wrong, everything downstream is rework. Also build the admin entry tooling here (see the Prisma schema (`prisma/schema.prisma`)), because hundreds of rules entered via raw SQL will accumulate transcription errors.

### Weeks 3–4 — Core query + first public pages
The graph traversal: given a qualification, return reachable programmes with rules and caveats attached. Then two server-rendered page types with proper URLs:
- `/kelayakan/[slug]` — "I have SPM, what now?"
- `/laluan/[from]/[to]` — the programmatic SEO workhorse

Tag `v0.1` when a stranger can land on a pathway page and get a correct, sourced answer.

### Weeks 5–6 — Coverage + interactive layer
Grind institutions from 5 → 20. In parallel, build the guided flow (enter actual results → filtered eligible pathways) and comparison views.

This fortnight needs deliberate alternation between data-entry days and build days, or one of them eats the other. Also build the **re-verification queue** here — every rule carries a recheck-due date, and that queue is what keeps the dataset from silently rotting.

### Weeks 7–8 — Trust, SEO, launch
Source citations rendered on every claim. Disclaimers (port directly from the predecessor project's legal pages). Schema.org markup, sitemap generation from pathway combinations, performance pass, deploy.

### Weeks 9–10 — Buffer + case study
Weeks 1–8 will slip; this is where that lands. Then README, screenshots, and the written case study — the recruiter-facing artifact, same as Week 8 of the marketplace project.

## Technical decisions worth making now

- **Reuse the stack** — Next.js + Neon + Vercel. Its failure modes are already known and every gotcha in the marketplace's `AGENTS.md` still applies. Project 2 shouldn't spend novelty budget on infrastructure; spend it on the graph logic and data pipeline.
- **Version rules, don't overwrite them.** When an institution changes its cap next intake, history matters — both for correctness and because "rules as of intake 2026/1" is genuinely useful to someone who applied earlier.
- **Static generation where possible.** Pathway pages change rarely; ISR with a long revalidate window stays fast and inside free tiers even under an SPM-results traffic spike.

## Launch timing

Traffic here is strongly seasonal around SPM results release. Launch **6–8 weeks before** a results release so pages are indexed and aged when the wave arrives. The off-season is for data expansion, not for wondering why traffic died. Confirm the exact results date and work backwards from it — see [SEO strategy](./seo.md).

Related: the Prisma schema (`prisma/schema.prisma`), [data sources & limits](./data-sources.md)
