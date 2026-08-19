/**
 * Third real institution: Multimedia University (MMU) — the first private one.
 *
 * SOURCE
 *   MMU Credit Transfer Policy. Approving Authority: Senate.
 *   "Date Last Amendment: Senate Meeting No 225 dated 3 March 2022"
 *   https://creative.mmu.edu.my/wp-content/uploads/2022/11/i649_Credit-Transfer-Policy_03032022-1.pdf
 *
 * First document so far with a genuinely PRINTED date — MMU records its whole
 * amendment history on page 1 (Special Senate no. 90, 25 Nov 2016; Senate 207,
 * 5 Mar 2020; Senate Circulation 210/3/2020, 12 Sep 2020; Senate 225, 3 Mar
 * 2022). That is what good provenance looks like and it is unfortunately rare.
 *
 * WARNING for anyone re-fetching this PDF: its metadata Title is
 * "MEDICAL CERTIFICATION/REPORT SUBMISSION (FOR FINAL /SUPPLEMENTARY
 * EXAMINATION)" — the file was produced from a reused template. Tools that
 * trust PDF metadata will mis-identify this document entirely. Read the body.
 *
 * Run:  npx tsx scripts/import-mmu.ts   (idempotent)
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const SOURCE_URL =
  "https://creative.mmu.edu.my/wp-content/uploads/2022/11/i649_Credit-Transfer-Policy_03032022-1.pdf";
/** Printed on page 1: "Date Last Amendment: Senate Meeting No 225 dated 3 March 2022". */
const SOURCE_DOCUMENT_DATE = new Date("2022-03-03T00:00:00Z");
const SOURCE_DATE_BASIS = "PRINTED_ON_DOCUMENT" as const;
const VERIFIED_ON = new Date("2026-08-19T00:00:00Z");
const RECHECK_DUE_ON = new Date("2027-02-19T00:00:00Z");

async function main() {
  const institution = await prisma.institution.upsert({
    where: { slug: "mmu" },
    update: {},
    create: {
      slug: "mmu",
      nameEn: "Multimedia University",
      nameMs: "Multimedia University",
      type: "PRIVATE_UNI",
      // Null deliberately: MMU operates campuses in Cyberjaya (Selangor) and
      // Melaka. A single `state` column cannot represent a multi-campus
      // institution, and picking one would assert something false.
      state: null,
      mqrProviderRef: null,
      policySourceUrl: SOURCE_URL,
      policyDocumentDate: SOURCE_DOCUMENT_DATE,
      policyDateBasis: SOURCE_DATE_BASIS,
    },
  });

  const bachelor = await prisma.qualification.findUniqueOrThrow({ where: { slug: "bachelor" } });
  const diploma = await prisma.qualification.findUniqueOrThrow({ where: { slug: "diploma" } });

  const programme = await prisma.programme.upsert({
    where: { institutionId_slug: { institutionId: institution.id, slug: "bcs-hons" } },
    update: {},
    create: {
      slug: "bcs-hons",
      institutionId: institution.id,
      qualificationId: bachelor.id,
      nameEn: "Bachelor of Computer Science (Honours)",
      // Not published by MMU. Not invented — see docs/decision-log.md.
      nameMs: "Bachelor of Computer Science (Honours)",
      field: "computing",
      accreditationStatus: "UNKNOWN",
      mqrRecordUrl: null,
      totalCredits: null,  // not published; the 50% cap cannot be resolved
      durationMonths: null, // not stated on an official MMU page
    },
  });

  /**
   * §3.1.2: "Diploma (MQF Level 4) to Bachelor's degree (MQF Level 6). The
   * maximum transferrable credit is 50% (i.e. approximately one year and half
   * of Bachelor's degree duration) of the total programme's credit with the
   * following conditions: 1-30 Grade C, 31-50 Grade B".
   *
   * Structurally identical to UM's rule. MMU states why on page 1: the policy
   * exists "to be in line with the Ministry of Higher Education (MOHE)'s
   * policy". See docs/decision-log.md — this convergence matters strategically.
   */
  const tiers = [
    { key: "1-30", pct: "30.00", grade: "C" },
    { key: "31-50", pct: "50.00", grade: "B" },
  ] as const;

  for (const tier of tiers) {
    const label = `${tier.key}% (MMU §3.1.2)`;
    const existing = await prisma.progressionRule.findFirst({
      where: {
        fromQualificationId: diploma.id, toProgrammeId: programme.id,
        effectiveTo: null, requirements: { path: ["tier"], equals: label },
      },
    });
    if (existing) { console.log(`  · ${tier.key} already present, skipped`); continue; }

    const rule = await prisma.progressionRule.create({
      data: {
        fromQualificationId: diploma.id,
        fromProgrammeId: null,
        toProgrammeId: programme.id,
        transferType: "CREDIT_TRANSFER",
        maxTransferPercent: tier.pct,
        maxTransferCredits: null,
        minimumCgpa: null,
        requirements: { tier: label, minCourseGrade: tier.grade },
        sourceUrl: SOURCE_URL,
        sourceDocumentDate: SOURCE_DOCUMENT_DATE,
        sourceDateBasis: SOURCE_DATE_BASIS,
        verifiedOn: VERIFIED_ON,
        recheckDueOn: RECHECK_DUE_ON,
        effectiveFrom: SOURCE_DOCUMENT_DATE,
        effectiveTo: null,
      },
    });

    await prisma.caveat.createMany({
      data: [
        {
          textEn:
            "MMU does not publish this programme's total graduating credits, so " +
            "the 50% ceiling cannot be shown as a number of credits. Ask the " +
            "faculty for the programme structure before planning around it.",
          textMs:
            "MMU tidak menerbitkan jumlah kredit pengijazahan program ini, jadi " +
            "had 50% tidak boleh ditunjukkan sebagai bilangan kredit. Tanya " +
            "fakulti untuk struktur program sebelum membuat perancangan.",
          severity: 2,
        },
        {
          textEn:
            "This policy has been amended repeatedly (Senate 2016, 2020, 2020, " +
            "2022). The figures here are from the 3 March 2022 amendment and may " +
            "have been revised since — check for a newer version.",
          textMs:
            "Dasar ini telah dipinda berulang kali (Senat 2016, 2020, 2020, " +
            "2022). Angka di sini adalah daripada pindaan 3 Mac 2022 dan mungkin " +
            "telah disemak semula — semak versi yang lebih baharu.",
          severity: 2,
        },
      ].map((c) => ({ ...c, ruleId: rule.id })),
    });
    console.log(`  ✓ ${tier.key}: ${tier.pct}% cap, min grade ${tier.grade}`);
  }

  console.log(`\n${institution.nameEn} (${institution.type})\n  programme: ${programme.nameEn}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
