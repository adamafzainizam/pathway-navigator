/**
 * First real institution: Universiti Tun Hussein Onn Malaysia (UTHM).
 *
 * Purpose is to test whether the schema can actually hold a real published
 * credit transfer policy — not to start bulk data entry. Everything below is
 * transcribed from the source document; nothing is inferred or rounded.
 *
 * SOURCE
 *   UTHM Credit Transfer Guidelines
 *   https://amo.uthm.edu.my/images/UPPP/Credit_Transfer_Guidelines.pdf
 *   Published by the Centre for Academic Development and Training & the Office
 *   of Academic Management, UTHM.
 *
 * PROVENANCE
 *   The document carries NO printed date anywhere in its text. The only date
 *   available is PDF file metadata (CreationDate 2022-06-02), so the rules
 *   below record sourceDateBasis = FILE_METADATA. Always run `pdfinfo` and
 *   record which kind of date you got — a bare date cannot say how it is known.
 *
 * Run:  npx tsx scripts/import-uthm.ts
 * Idempotent — upserts on natural keys, safe to re-run.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const SOURCE_URL =
  "https://amo.uthm.edu.my/images/UPPP/Credit_Transfer_Guidelines.pdf";

/** PDF metadata CreationDate. NOT a date printed in the document. */
const SOURCE_DOCUMENT_DATE = new Date("2022-06-02T00:00:00Z");

/**
 * Says so explicitly, rather than leaving the date looking authoritative.
 * `pdfinfo` reported CreationDate 2022-06-02; the document text has no date.
 */
const SOURCE_DATE_BASIS = "FILE_METADATA" as const;

/** Today. A human (with an AI agent) read the document on this date. */
const VERIFIED_ON = new Date("2026-08-19T00:00:00Z");

/** Policies change per intake; six months is a deliberate floor, not a guess. */
const RECHECK_DUE_ON = new Date("2027-02-19T00:00:00Z");

async function main() {
  const institution = await prisma.institution.upsert({
    where: { slug: "uthm" },
    update: {},
    create: {
      slug: "uthm",
      nameEn: "Universiti Tun Hussein Onn Malaysia",
      nameMs: "Universiti Tun Hussein Onn Malaysia",
      type: "PUBLIC_UNI",
      state: "Johor",
      // Not looked up. The Malaysian Qualifications Register is a frameset over
      // a POST-based ColdFusion search and could not be queried; leaving this
      // null is honest, inventing a reference would not be.
      mqrProviderRef: null,
      policySourceUrl: SOURCE_URL,
      policyDocumentDate: SOURCE_DOCUMENT_DATE,
      policyDateBasis: SOURCE_DATE_BASIS,
    },
  });

  const bachelor = await prisma.qualification.findUniqueOrThrow({
    where: { slug: "bachelor" },
  });
  const diploma = await prisma.qualification.findUniqueOrThrow({
    where: { slug: "diploma" },
  });

  const programme = await prisma.programme.upsert({
    where: {
      institutionId_slug: {
        institutionId: institution.id,
        slug: "bcs-software-engineering",
      },
    },
    update: {},
    create: {
      slug: "bcs-software-engineering",
      institutionId: institution.id,
      qualificationId: bachelor.id,
      nameEn: "Bachelor of Computer Science (Software Engineering) with Honours",
      // Verified against the faculty's own programme page, not translated.
      nameMs: "Sarjana Muda Sains Komputer (Kejuruteraan Perisian) Dengan Kepujian",
      field: "computing",
      // UNKNOWN, deliberately — NOT NOT_IN_REGISTER. No successful search was
      // performed against the MQA register, so "nobody has checked" is the
      // truthful state. See AGENTS.md §7.
      accreditationStatus: "UNKNOWN",
      mqrRecordUrl: null,
      // The programme page states duration but not graduating credits, so the
      // 30% cap below cannot yet be resolved into an absolute number.
      totalCredits: null,
      durationMonths: 42, // "3 and 1/2 Years", stated on the programme page
    },
  });

  // Shared by both tiers below.
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
   * The policy is TIERED (regulation 12 + Table 1), and maxTransferPercent is a
   * single scalar, so one rule row cannot express it. Modelled as two rows —
   * see docs/decision-log.md for why this is uncomfortable.
   */
  const tiers = [
    {
      key: "category-i",
      // Reg 12: "must not exceed 30% of total credit required for graduation"
      maxTransferPercent: "30.00",
      requirements: {
        tier: "Category I (Table 1)",
        minCourseGrade: "C+",
        minSyllabusSimilarityPercent: 80,
        sourceProgrammeMustBeAccredited: true,
        sourceCourseCreditsMustBeAtLeastTarget: true,
        sourceCourseNotAlreadyCreditTransferred: true,
        applicationWindow: "first semester of study only",
        notEligible: [
          "failed the prior programme",
          "did not complete the prior programme",
          "was terminated from the prior programme",
        ],
      },
    },
    {
      key: "category-ii",
      // Reg 12(a): "Up to 50% maximum for a student who is in a bachelor degree
      // programme that is accredited by MQA based on the details in Table 1"
      maxTransferPercent: "50.00",
      requirements: {
        tier: "Category II (Table 1)",
        minCourseGrade: "B",
        minSyllabusSimilarityPercent: 80,
        sourceProgrammeMustBeAccredited: true,
        targetProgrammeMustBeMqaAccredited: true,
        sourceCourseCreditsMustBeAtLeastTarget: true,
        sourceCourseNotAlreadyCreditTransferred: true,
        applicationWindow: "first semester of study only",
        notEligible: [
          "failed the prior programme",
          "did not complete the prior programme",
          "was terminated from the prior programme",
        ],
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
        fromProgrammeId: null, // exactly one source — see the CHECK constraint
        toProgrammeId: programme.id,
        transferType: "CREDIT_TRANSFER",
        maxTransferPercent: tier.maxTransferPercent,
        maxTransferCredits: null, // cannot resolve: totalCredits is unknown
        minimumCgpa: null, // the document sets per-course grades, never a CGPA
        requirements: tier.requirements,
        ...provenance,
      },
    });

    // Caveats render as visible warnings, not fine print. See AGENTS.md §5.
    const caveats = [
      {
        // The hard ceiling, verbatim from regulation 17.
        textEn:
          "UTHM's own guidelines state: \"the Faculty reserves the right to " +
          "determine the approval of the application for each course applied " +
          "for.\" Which of your specific courses are approved is decided " +
          "case-by-case by the faculty and is not published anywhere.",
        textMs:
          "Garis panduan UTHM sendiri menyatakan bahawa fakulti berhak " +
          "menentukan kelulusan permohonan bagi setiap kursus yang dipohon. " +
          "Kursus tertentu yang diluluskan diputuskan kes demi kes oleh " +
          "fakulti dan tidak diterbitkan di mana-mana.",
        severity: 3,
      },
      {
        textEn:
          "Applications for credit transfer from prior study must be made in " +
          "the first semester only (regulation 15). Applications after that " +
          "are not considered.",
        textMs:
          "Permohonan pemindahan kredit daripada pengajian terdahulu mesti " +
          "dibuat pada semester pertama sahaja (peraturan 15). Permohonan " +
          "selepas itu tidak akan dipertimbangkan.",
        severity: 3,
      },
      {
        textEn:
          "A faculty may, with Senate permission, require a HIGHER minimum " +
          "grade than the one shown here (regulation 10). Confirm with the " +
          "faculty before relying on this figure.",
        textMs:
          "Fakulti boleh, dengan kebenaran Senat, menetapkan gred minimum " +
          "yang LEBIH TINGGI daripada yang ditunjukkan di sini (peraturan " +
          "10). Sahkan dengan fakulti sebelum bergantung pada angka ini.",
        severity: 2,
      },
      {
        textEn:
          "The source document carries no printed date. The date shown is " +
          "taken from the PDF's file metadata, so this policy may be older or " +
          "newer than it appears.",
        textMs:
          "Dokumen sumber tidak mempunyai tarikh bercetak. Tarikh yang " +
          "dipaparkan diambil daripada metadata fail PDF, jadi dasar ini " +
          "mungkin lebih lama atau lebih baharu daripada yang dipaparkan.",
        severity: 2,
      },
    ];

    if (tier.key === "category-ii") {
      caveats.push({
        textEn:
          "This 50% tier applies only if the UTHM programme is MQA-accredited. " +
          "That has NOT been verified here — the programme's accreditation " +
          "status is recorded as unknown, not as accredited.",
        textMs:
          "Kadar 50% ini terpakai hanya jika program UTHM ini diakreditasi " +
          "MQA. Perkara itu BELUM disahkan di sini — status akreditasi " +
          "program direkodkan sebagai tidak diketahui, bukan sebagai " +
          "diakreditasi.",
        severity: 3,
      });
    }

    await prisma.caveat.createMany({
      data: caveats.map((c) => ({ ...c, ruleId: rule.id })),
    });
    console.log(`  ✓ ${tier.key}: ${tier.maxTransferPercent}% cap, ${caveats.length} caveats`);
  }

  console.log(
    `\n${institution.nameEn}\n  programme: ${programme.nameEn}\n` +
      `  rules: ${await prisma.progressionRule.count({ where: { toProgrammeId: programme.id } })}\n` +
      `  caveats: ${await prisma.caveat.count()}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
