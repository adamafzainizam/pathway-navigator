
# Pathway Navigator — Data Sources & Limits

Part of this project — see the main [README](../README.md) and [AGENTS.md](../AGENTS.md). Researched before committing to the project, because the whole thing collapses if the data turns out to be locked behind bureaucracy. It isn't — mostly.

## Tier 1 — Fully public, no gatekeeping

**The Malaysian Qualifications Register (MQR)**, run by MQA, is a publicly searchable database of providers, programmes, qualification names, fields and levels. No login, no application, no access request. Its stated purpose is explicitly to promote degree recognition and credit transfer by making this information available to students, parents, employers and funding agencies.

That solves the accreditation layer outright.

**MQF levels** are published and stable — the framework spine everything else anchors to. Diploma sits at Level 4, Bachelor's at Level 6, with the Advanced Diploma as a 40-credit Level 5 award. Diploma programmes require a minimum of 90 credits.

## Tier 2 — Public but scattered (the actual grind)

**University credit-transfer policies** are public PDFs. UTHM's, Universiti Malaya's, MMU's and UTAR's were all retrievable in a single search with no access request.

They contain the genuinely useful numbers — e.g. UTHM caps APEL(C) transfers at 30% of a programme's total passing credit. UM's rules go further, blocking transfer for research dissertations and treating final-year projects and industrial training separately.

This tier is where most of the eight weeks actually goes: finding, reading, and structuring these documents. It's a grind, not a blocker.

**APEL** is worth understanding properly as it's a route most students don't know exists. MQA-governed, it assesses work experience, professional training, workshops, seminars, MOOCs, self-directed study and even volunteering — and can grant access to a degree without SPM or a diploma. Split into **APEL(A)** for access (from 2011) and **APEL(C)** for credit award (from 2016).

## Tier 3 — The hard ceiling (not obtainable, by anyone)

**Per-course transfer decisions are discretionary and unpublished.** UTHM's own guidelines state the faculty reserves the right to determine approval for each course applied for. No dataset anywhere maps a specific diploma subject to a specific degree subject — that decision happens inside a faculty, case by case.

**This reshapes the product, and improves it.** The tool cannot promise *"you will get 12 credits."* It can deliver: which programmes are accredited (and therefore transferable at all), what MQF level everything sits at, each institution's cap, whether a route is transfer or exemption, which APEL route applies, what documents to prepare, and exactly who to ask.

Every competitor either overpromises or stays vague. A tool that states precisely where certainty ends is more useful than one that pretends otherwise — and it's honest.

## Two data traps to design around from day one

**1. A missing register record is ambiguous.** MQA states it can mean provisional accreditation not yet matured to full, the provider never applied, the programme predates 1997, or the programme failed to achieve full accreditation. Four very different meanings. **Never render "not found" as "not accredited."** This is why `accreditationStatus` is a six-value enum in the Prisma schema (`prisma/schema.prisma`) rather than a boolean.

**2. Even MQA disclaims liability** for the information it publishes — stating the Malaysian Government and MQA are not liable for any loss or damage arising from its use. If the primary source disclaims, this project certainly must: per-record "verified on" dates, links back to primary sources, and clear "confirm with the institution" framing. Port the disclaimer discipline from the predecessor project's legal pages.

## Ongoing freshness problem

Policies change per intake. Staleness kills credibility faster than gaps do — a wrong answer is worse than a missing one when someone is choosing where to spend three years and RM30,000. Hence the `recheckDueOn` field and the admin re-verification queue in [scope & milestones](./scope.md).

Related: the Prisma schema (`prisma/schema.prisma`)
