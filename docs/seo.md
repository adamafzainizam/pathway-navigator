
# Pathway Navigator — SEO Strategy

Part of this project — see the main [README](../README.md) and [AGENTS.md](../AGENTS.md). This is a programmatic-SEO project as much as a software one — the dataset is only valuable if people find it.

> ⚠️ No verified search volumes here. These are clusters to validate in Google Keyword Planner (free with an Ads account) or Ahrefs' free tools before committing. Treat as hypotheses.

## The core finding: Bahasa Melayu is the opening

The English keyword space is dominated by institution marketing blogs with real SEO budgets. The BM and colloquial space is large and served mostly by low-quality content sites.

The phrasings students and parents actually use are visible in existing BM content: *"Selepas SPM, hendak sambung belajar di mana?"*, *"Pilihan yang mana yang lebih baik, adakah asasi, STPM, matrikulasi atau diploma?"*, *"Apakah syarat kemasukan universiti bagi lepasan SPM?"* — and the emotional driver behind the search, described in one BM article as students and parents being *buntu* (stuck/at a loss) over the choice.

**Parents are a second audience** with different phrasing and better ad economics than students. Worth targeting explicitly.

**Decision: build bilingual from day one, not as a later port.** Route-level i18n (`/ms/` and `/en/`) over the same underlying data. Retrofitting i18n is painful, and the data model is already language-agnostic (structured rules, not prose), so only presentation layers need translating. See the Prisma schema (`prisma/schema.prisma`).

## Keyword tiers

**Tier 1 — Head terms.** *"lepasan SPM"*, *"apa nak buat lepas SPM"*, *"options after SPM"*, *"sambung belajar lepas SPM"*. High volume, brutal competition — every institution in Malaysia is bidding here. Don't fight for these initially; earn them later via accumulated authority.

**Tier 2 — Comparison terms.** *"matrikulasi vs diploma"*, *"asasi vs STPM"*, *"foundation vs diploma"*, *"diploma politeknik vs IPTS"*. Currently answered with prose articles. An interactive side-by-side with real requirements, durations, costs and onward pathways beats an article decisively.

**Tier 3 — Programmatic long-tail.** The engine. Low volume each, enormous in aggregate:
- `/ms/laluan/diploma-teknologi-maklumat/ijazah-sains-komputer`
- `/en/pathways/diploma-information-technology/bachelor-computer-science`
- `/ms/kelayakan/spm/diploma-politeknik`

~8 qualification types × ~20 institutions × computing programmes generates hundreds of genuinely distinct pages, each answering one specific question no article covers.

**Tier 4 — Mechanism terms.** *"credit transfer vs credit exemption"*, *"APEL C maksud"*, *"MQF level 4 vs level 6"*, *"syarat pengecualian kredit"*. Low volume, high intent, near-zero competition — nobody targets these because they're unglamorous. They convert well and build topical authority.

## Page architecture

Five page types, each with one job:

1. **Qualification hub** — `/ms/kelayakan/[slug]`. "I have SPM." All onward routes with real requirements. Targets Tiers 1–2.
2. **Pathway page** — `/ms/laluan/[from]/[to]`. The programmatic workhorse: one qualification pair, full rules, caps, transfer type, caveats, sources, last-verified date. Targets Tier 3.
3. **Institution page** — `/ms/institusi/[slug]`. That institution's programmes, accreditation status, specific transfer policy and caps.
4. **Comparison page** — `/ms/banding/[a]-vs-[b]`. The interactive Tier 2 play.
5. **Concept page** — `/ms/panduan/[topic]`. Mechanism explainers. Tier 4.

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
