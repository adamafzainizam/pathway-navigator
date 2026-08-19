/**
 * Second real institution: Universiti Malaya (UM).
 *
 * Chosen because its policy is shaped differently from UTHM's in three ways
 * that were expected to stress the model, and did:
 *   1. it publishes the programme's graduating credit total, so percentage caps
 *      resolve into absolute ceilings (UTHM's do not);
 *   2. its document carries a printed version year, so sourceDateBasis is
 *      PRINTED_ON_DOCUMENT rather than FILE_METADATA;
 *   3. it defines "course exemption" in a way that directly contradicts UTHM's
 *      definition of the same phrase. See the terminology caveat below.
 *
 * SOURCE
 *   Universiti Malaya Guidelines on the Management of Application for Transfer
 *   of Credit and Course Exemption, "(LATEST VERSION 2022)"
 *   https://fsktm.um.edu.my/fsktm/doc/undergraduate/TK-2UNIVERSITI%20MALAYA%20GUIDELINES%20ON%20THE%20MANAGEMENT%20OF%20APPLICATION%20FOR%20TRANSFER%20OF%20CREDIT%20AND%20COURSE%20EXEMPTION.pdf
 *
 * Run:  npx tsx scripts/import-um.ts   (idempotent)
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const SOURCE_URL =
  "https://fsktm.um.edu.my/fsktm/doc/undergraduate/TK-2UNIVERSITI%20MALAYA%20GUIDELINES%20ON%20THE%20MANAGEMENT%20OF%20APPLICATION%20FOR%20TRANSFER%20OF%20CREDIT%20AND%20COURSE%20EXEMPTION.pdf";

/**
 * The document prints "(LATEST VERSION 2022)" on its title page — a real date
 * claim by the institution, unlike UTHM's. But it states a YEAR only, so the
 * day and month here are padding, not evidence. A caveat says so.
 */
const SOURCE_DOCUMENT_DATE = new Date("2022-01-01T00:00:00Z");
const SOURCE_DATE_BASIS = "PRINTED_ON_DOCUMENT" as const;

const VERIFIED_ON = new Date("2026-08-19T00:00:00Z");
const RECHECK_DUE_ON = new Date("2027-02-19T00:00:00Z");

/**
 * Rendered as a visible warning, not fine print. This is the single most
 * useful thing in the whole dataset so far: two Malaysian public universities
 * use "exemption" to mean opposite things, and a student reading UTHM's
 * glossary would draw exactly the wrong conclusion about UM.
 */
const TERMINOLOGY_CAVEAT = {
  textEn:
    "Beware the word \"exemption\" — it does not mean the same thing at every " +
    "university. At UM, a COURSE EXEMPTION gives you no credit at all: the " +
    "guidelines state it \"will not result in a student obtaining credit for " +
    "the course which is exempted\", and the exempted course must be replaced " +
    "with another course if you would otherwise fall short of graduating " +
    "credits. At UTHM the phrase \"credit exemption\" means the opposite — " +
    "there it is defined as credit transfer without grade, and the credit " +
    "does count toward graduation. The route described here is UM's transfer " +
    "of credit WITHOUT GRADE, which does count toward graduation but not " +
    "toward your GPA or CGPA.",
  textMs:
    "Berhati-hati dengan perkataan \"pengecualian\" — maknanya tidak sama di " +
    "setiap universiti. Di UM, PENGECUALIAN KURSUS tidak memberi kredit " +
    "langsung: garis panduan menyatakan ia tidak menghasilkan kredit bagi " +
    "kursus yang dikecualikan, dan kursus itu perlu diganti dengan kursus " +
    "lain jika kredit bergraduat tidak mencukupi. Di UTHM pula, " +
    "\"pengecualian kredit\" bermaksud sebaliknya — di sana ia ditakrifkan " +
    "sebagai pemindahan kredit tanpa gred, dan kredit itu dikira untuk " +
    "pengijazahan. Laluan yang diterangkan di sini ialah pemindahan kredit " +
    "TANPA GRED di UM, yang dikira untuk pengijazahan tetapi tidak untuk " +
    "GPA atau CGPA anda.",
  severity: 3,
};

async function main() {
  const institution = await prisma.institution.upsert({
    where: { slug: "um" },
    update: {},
    create: {
      slug: "um",
      nameEn: "Universiti Malaya",
      nameMs: "Universiti Malaya", // genuinely identical in both languages
      type: "PUBLIC_UNI",
      state: "Kuala Lumpur",
      mqrProviderRef: null,
      policySourceUrl: SOURCE_URL,
      policyDocumentDate: SOURCE_DOCUMENT_DATE,
      policyDateBasis: SOURCE_DATE_BASIS,
    },
  });

  const bachelor = await prisma.qualification.findUniqueOrThrow({ where: { slug: "bachelor" } });
  const diploma = await prisma.qualification.findUniqueOrThrow({ where: { slug: "diploma" } });

  const programme = await prisma.programme.upsert({
    where: { institutionId_slug: { institutionId: institution.id, slug: "bcs-software-engineering" } },
    update: {},
    create: {
      slug: "bcs-software-engineering",
      institutionId: institution.id,
      qualificationId: bachelor.id,
      nameEn: "Bachelor of Computer Science (Software Engineering)",
      // NOT VERIFIED. The faculty page publishes no Malay name, and inventing a
      // translation of an official award title would be fabrication. The English
      // string stands in until the Malay name is sourced. See docs/decision-log.md.
      nameMs: "Bachelor of Computer Science (Software Engineering)",
      field: "computing",
      accreditationStatus: "UNKNOWN",
      mqrRecordUrl: null,
      // Published by the faculty: 128 credits (20 university + 17 faculty core
      // + 6 faculty elective + 55 programme core + 30 specialisation elective).
      totalCredits: 128,
      // The page lists seven semesters but does not state a duration in years.
      durationMonths: null,
    },
  });

  const provenance = {
    sourceUrl: SOURCE_URL,
    sourceDocumentDate: SOURCE_DOCUMENT_DATE,
    sourceDateBasis: SOURCE_DATE_BASIS,
    verifiedOn: VERIFIED_ON,
    recheckDueOn: RECHECK_DUE_ON,
    effectiveFrom: SOURCE_DOCUMENT_DATE,
    effectiveTo: null,
  };

  /**
   * Table (A), "Vertical credit transfer", row (b): "Transfer of credit without
   * grade for qualification of Diploma — Maximum of 50% of the total programme
   * credits that have been taken with the following provisions: 1%-30%
   * (Minimum course Grade is C), 31%-50% (Minimum course Grade is B)".
   *
   * Modelled as CREDIT_TRANSFER, not CREDIT_EXEMPTION, despite being called
   * "without grade": UM §5(2)(c) says the credit "will be taken into account
   * for the purpose of completion requirements for graduation". Our
   * CREDIT_EXEMPTION means credits that do NOT count toward graduation, which
   * is UM's separate §6 "course exemption".
   */
  const tiers = [
    {
      key: "1-30",
      maxTransferPercent: "30.00",
      requirements: {
        tier: "1%-30% (UM Table A, vertical, diploma)",
        minCourseGrade: "C",
        minCourseGradePoint: 2.0,
        minMarks: 50,
        minSyllabusOverlapPercent: 80,
        sourceCourseCreditsMustBeAtLeastTarget: true,
        countsTowardGraduation: true,
        countsTowardGpa: false,
      },
    },
    {
      key: "31-50",
      maxTransferPercent: "50.00",
      requirements: {
        tier: "31%-50% (UM Table A, vertical, diploma)",
        minCourseGrade: "B",
        minCourseGradePoint: 3.0,
        minSyllabusOverlapPercent: 80,
        sourceCourseCreditsMustBeAtLeastTarget: true,
        countsTowardGraduation: true,
        countsTowardGpa: false,
      },
    },
  ] as const;

  for (const tier of tiers) {
    const existing = await prisma.progressionRule.findFirst({
      where: {
        fromQualificationId: diploma.id,
        toProgrammeId: programme.id,
        effectiveTo: null,
        requirements: { path: ["tier"], equals: tier.requirements.tier },
      },
    });
    if (existing) {
      console.log(`  · ${tier.key} already present, skipped`);
      continue;
    }

    const rule = await prisma.progressionRule.create({
      data: {
        fromQualificationId: diploma.id,
        fromProgrammeId: null,
        toProgrammeId: programme.id,
        transferType: "CREDIT_TRANSFER",
        maxTransferPercent: tier.maxTransferPercent,
        maxTransferCredits: null,
        minimumCgpa: null,
        requirements: tier.requirements,
        ...provenance,
      },
    });

    await prisma.caveat.createMany({
      data: [
        TERMINOLOGY_CAVEAT,
        {
          textEn:
            "Transferred credit is recorded as grade K and does NOT count toward " +
            "your GPA or CGPA. It counts only toward graduating credits.",
          textMs:
            "Kredit yang dipindahkan direkodkan sebagai gred K dan TIDAK dikira " +
            "dalam GPA atau CGPA anda. Ia dikira untuk kredit pengijazahan sahaja.",
          severity: 2,
        },
        {
          textEn:
            "Transfer of credit does not automatically apply to the pre-requisite " +
            "courses of a course you transfer. You may still have to take them.",
          textMs:
            "Pemindahan kredit tidak terpakai secara automatik kepada kursus " +
            "prasyarat bagi kursus yang dipindahkan. Anda mungkin masih perlu " +
            "mengambilnya.",
          severity: 2,
        },
        {
          textEn:
            "A combined ceiling applies across academic qualifications, MOOCs, " +
            "micro-credentials and APEL(C) together — transferring near the " +
            "maximum by one route reduces what remains available via the others.",
          textMs:
            "Had gabungan terpakai merentas kelayakan akademik, MOOC, " +
            "mikro-kredensial dan APEL(C) — memindahkan hampir maksimum melalui " +
            "satu laluan mengurangkan baki yang ada melalui laluan lain.",
          severity: 2,
        },
        {
          textEn:
            "The source document states only a version year (2022), not a full " +
            "date. The day and month shown are padding, not evidence.",
          textMs:
            "Dokumen sumber menyatakan tahun versi (2022) sahaja, bukan tarikh " +
            "penuh. Hari dan bulan yang dipaparkan adalah pengisi, bukan bukti.",
          severity: 2,
        },
      ].map((c) => ({ ...c, ruleId: rule.id })),
    });
    console.log(`  ✓ ${tier.key}: ${tier.maxTransferPercent}% of ${programme.totalCredits} credits`);
  }

  console.log(
    `\n${institution.nameEn}\n  programme: ${programme.nameEn} (${programme.totalCredits} credits)\n` +
      `  rules: ${await prisma.progressionRule.count({ where: { toProgrammeId: programme.id } })}`,
  );
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
