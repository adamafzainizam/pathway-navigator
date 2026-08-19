
# Pathway Navigator — SEO Strategy

Part of this project — see the main [README](../README.md) and [AGENTS.md](../AGENTS.md). This is a programmatic-SEO project as much as a software one — the dataset is only valuable if people find it.

> ⚠️ No verified search volumes here. These are clusters to validate in Google Keyword Planner (free with an Ads account) or Ahrefs' free tools before committing. Treat as hypotheses.

## The core finding: Bahasa Melayu is the opening

The English keyword space is dominated by institution marketing blogs with real SEO budgets. The BM and colloquial space is large and served mostly by low-quality content sites.

The phrasings students and parents actually use are visible in existing BM content: *"Selepas SPM, hendak sambung belajar di mana?"*, *"Pilihan yang mana yang lebih baik, adakah asasi, STPM, matrikulasi atau diploma?"*, *"Apakah syarat kemasukan universiti bagi lepasan SPM?"* — and the emotional driver behind the search, described in one BM article as students and parents being *buntu* (stuck/at a loss) over the choice.

**Parents are a second audience** with different phrasing and better ad economics than students. Worth targeting explicitly.

**Decision: build bilingual from day one, not as a later port.** Route-level i18n (`/ms/` and `/en/`) over the same underlying data. Retrofitting i18n is painful, and the data model is already language-agnostic (structured rules, not prose), so only presentation layers need translating. See the Prisma schema (`prisma/schema.prisma`).

## Keyword tiers

> **Revised 2026-08-19.** Tiers 3 and 4 have swapped importance. Tier 3
> (programmatic long-tail) was written as "the engine" on the assumption that
> each institution's rules differ. Three institutions showed the caps are a
> national MOHE/MQA baseline they all restate — so a `/laluan/[from]/[to]` page
> generated for institution A and one for institution B would carry
> substantially the same answer. Hundreds of near-identical pages is the
> textbook definition of thin and doorway content, which Google demotes rather
> than rewards, and it would be a self-inflicted wound.
>
> Tier 4 was already described below as high-intent, near-zero competition, and
> unglamorous enough that nobody targets it. It is now the engine. See
> `docs/decision-log.md` 2026-08-19.

**Tier 1 — Head terms.** *"lepasan SPM"*, *"apa nak buat lepas SPM"*, *"options after SPM"*, *"sambung belajar lepas SPM"*. High volume, brutal competition — every institution in Malaysia is bidding here. Don't fight for these initially; earn them later via accumulated authority.

**Tier 2 — Comparison terms.** *"matrikulasi vs diploma"*, *"asasi vs STPM"*, *"foundation vs diploma"*, *"diploma politeknik vs IPTS"*. Currently answered with prose articles. An interactive side-by-side with real requirements, durations, costs and onward pathways beats an article decisively.

**Tier 3 — Programmatic long-tail.** *Demoted — see the revision note above.*
Still worth building, but only where a pair genuinely has a distinct answer, and
never generated exhaustively across the institution × qualification matrix. A
pathway page earns its existence when it carries something specific: a
terminology difference, a deadline, an accreditation gap, a figure the
institution declines to publish. Where three institutions would say the same
thing, that is one page about the national baseline, not three pages.
- `/ms/laluan/diploma-teknologi-maklumat/ijazah-sains-komputer`
- `/en/pathways/diploma-information-technology/bachelor-computer-science`
- `/ms/kelayakan/spm/diploma-politeknik`

~8 qualification types × ~20 institutions × computing programmes generates hundreds of genuinely distinct pages, each answering one specific question no article covers.

**Tier 4 — Mechanism terms. Now the engine.** *"credit transfer vs credit
exemption"*, *"APEL C maksud"*, *"MQF level 4 vs level 6"*, *"syarat pengecualian
kredit"*, *"beza pemindahan kredit dan pengecualian kredit"*. Low volume each,
high intent, near-zero competition — nobody targets these because they are
unglamorous.

This tier is where the dataset's actual findings live. "Credit transfer vs credit
exemption" is not a definitional question with one answer: UM and UTHM define the
terms in contradictory ways, and a page that shows both institutions' own words
side by side answers a question no existing page in either language answers
correctly. That is a genuinely defensible piece of content, and unlike a
generated pathway matrix it cannot be duplicated by anyone unwilling to read the
source documents.

## Page architecture

Five page types, each with one job:

1. **Concept / decoder page** — `/ms/panduan/[topic]`. **Build first.** Mechanism
   explainers showing each institution's own definition side by side with source
   quotes. Targets Tier 4, which is now the engine.
2. **Pathway page** — `/ms/laluan/[from]/[to]`. One qualification pair: rules,
   caps, transfer type, caveats, sources, last-verified date. Built selectively
   where a pair has a distinct answer, **not** generated across the full matrix.
   Targets Tier 3.
3. **Institution page** — `/ms/institusi/[slug]`. That institution's programmes, accreditation status, specific transfer policy and caps.
4. **Comparison page** — `/ms/banding/[a]-vs-[b]`. The interactive Tier 2 play.
5. **Qualification hub** — `/ms/kelayakan/[slug]`. "I have SPM." All onward
   routes with real requirements. Targets Tiers 1–2. Needs breadth the dataset
   does not yet have — build after the decoder pages.

Plus **one interactive tool** at `/ms/semak` — enter your actual results, get filtered eligible pathways. This is the shareable thing that earns links and social traffic, but it must not be the only entry point: tools don't rank, pages do.

## Technical SEO essentials

- **Static-generate every pathway page**, ISR with long revalidate — free-tier-safe under a results-season spike.
- **`hreflang` between BM and EN versions.** Critical for bilingual; get it right early rather than debugging it later.
- **Schema.org:** `FAQPage` on concept pages, `EducationalOccupationalProgram` on programme pages, `BreadcrumbList` throughout.
- **Sitemap generated from the database**, never hand-maintained.
- **Internal linking is the biggest lever.** Every pathway page links to its qualification hub, both institutions, and 3–5 sibling pathways. This is how programmatic sites build authority without backlinks.
- **Surface "last verified" dates prominently.** Both a trust signal to students and a freshness signal to search — and the genuine differentiator against stale institutional blogs.

## Seasonality

SPM results release drives an annual traffic spike. Launch 6–8 weeks ahead of it so pages are indexed and aged when the wave hits. Off-season is for data expansion. Confirm the exact upcoming results date and work backwards.

Related: [scope & milestones](./scope.md), study-abroad expansion (see AGENTS.md)
