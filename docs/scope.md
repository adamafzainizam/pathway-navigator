
# Pathway Navigator — Scope & Milestones

Part of this project — see the main [README](../README.md) and [AGENTS.md](../AGENTS.md). Roughly 8–10 weeks at 10–20 hrs/week, matching the pace of the campus-marketplace project.

## The v1 slice

**Revised 2026-08-19.** The original slice targeted 15–20 institutions. That was
built on the assumption that credit transfer caps vary per institution, which
three institutions disproved — the caps descend from MOHE/MQA policy and are
largely uniform. See [decision log](./decision-log.md).

Still ruthless, still **one field only: Computing / IT / Software Engineering.**

**Coverage target, restated:** roughly **5–8 institutions, documented
exhaustively**, rather than 15–20 documented shallowly. The metric is no longer
institutions covered. It is:

- **terms disambiguated** — every place two institutions use the same word to
  mean different things, with both source quotes;
- **process traps documented** — deadlines, non-transferring prerequisites,
  discretionary overrides;
- **published gaps recorded** — what an institution does not state, made visible
  rather than silently absent.

**Both query directions still matter** (*"I have X, where can I go?"* and *"I
want Y, how do I get there?"*), but they are now secondary to *"what does this
actually mean and what will trip me up?"*.

**What v1 explicitly does NOT do:** promise credit counts, predict admission
outcomes, or cover study abroad.

## Fortnightly plan

Weeks 0–1 are done: scaffold verified, database live, three institutions
entered, and the thesis revised on the evidence they produced.

### Next — explain what is already held, before collecting more
The terminology decoder: each term as each institution defines it, side by side,
with source quotes. Then the first bilingual public page type, with every claim
carrying its source and verification date.

**Success test:** a reader who does not know the difference between credit
transfer and course exemption can read one page and afterwards know which one
their target university means.

Data entry stays paused throughout. Three institutions already hold more
unexplained material than the site can present.

### Then — coverage, in the new shape
Resume entry toward 5–8 institutions, collecting terminology and process traps
first and caps second. Alternate deliberately between entry days and build days.
Build the **re-verification queue** in this phase, not later — every rule carries
a recheck-due date and that queue is what stops the dataset rotting.

### Then — trust, SEO, launch
Source citations rendered on every claim. Disclaimers ported from the
predecessor project. Schema.org markup, sitemap, performance pass, deploy.

### Buffer + case study
Everything above will slip. Then README, screenshots and the written case study —
the recruiter-facing artifact. The revision of the thesis belongs in that case
study: a project that tested its own premise and changed it is a better story
than one that never checked.

## Before coverage grows: answer the maintenance question

Every rule carries `recheckDueOn`, and policies change per intake. Six rules
exist today. Decide honestly how many rules one person can re-verify per intake
before deciding how many to create — a stale reference site is worse than a
small one, and this is the constraint most likely to kill the project quietly.

## Technical decisions worth making now

- **Reuse the stack** — Next.js + Neon + Vercel. Its failure modes are already known and every gotcha in the marketplace's `AGENTS.md` still applies. Project 2 shouldn't spend novelty budget on infrastructure; spend it on the graph logic and data pipeline.
- **Version rules, don't overwrite them.** When an institution changes its cap next intake, history matters — both for correctness and because "rules as of intake 2026/1" is genuinely useful to someone who applied earlier.
- **Static generation where possible.** Pathway pages change rarely; ISR with a long revalidate window stays fast and inside free tiers even under an SPM-results traffic spike.

## Launch timing

Traffic here is strongly seasonal around SPM results release. Launch **6–8 weeks before** a results release so pages are indexed and aged when the wave arrives. The off-season is for data expansion, not for wondering why traffic died. Confirm the exact results date and work backwards from it — see [SEO strategy](./seo.md).

Related: the Prisma schema (`prisma/schema.prisma`), [data sources & limits](./data-sources.md)
