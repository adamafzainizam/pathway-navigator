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
