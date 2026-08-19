# Contributing

This is a personal portfolio project, but **corrections to the dataset are genuinely welcome** — arguably more valuable than code contributions. If a rule here is wrong or out of date, that directly misleads a student making a real decision.

## Reporting bad data

Open an issue with:

1. Which pathway / institution / rule is wrong
2. What the correct information is
3. **A link to the current source document** — an institution's own PDF or page

Every rule in the database already carries a source URL and a verification date, both shown in the UI. If the source has changed since the verification date, that alone is worth reporting.

## Code contributions

Read `AGENTS.md` first. It's the living status document — current state, constraints, gotchas, and data-entry discipline.

**Non-negotiable rules:**

- **One feature = one branch.** Branch *before* writing code, not after.
- **Never enter a rule without its source URL and document date.** The schema enforces this; don't work around it.
- **Never render "not found" as "not accredited."** A missing MQA register record is ambiguous — see `docs/data-sources.md`.
- **Never render a promised credit count.** Per-course decisions are discretionary. See `AGENTS.md` §5.
- **Keep rules logic pure and separate from I/O**, in `src/lib/`. This is what makes it testable.
- Return typed results from server actions; never throw for validation failures. Next.js masks thrown errors in production builds.

## Data entry

If you're adding institutional rules, read `AGENTS.md` §7 first. The discipline there is what keeps the dataset trustworthy — particularly the distinction between `NOT_IN_REGISTER` and `UNKNOWN`, and setting `recheckDueOn` on every rule.
