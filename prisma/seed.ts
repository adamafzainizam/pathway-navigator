import "dotenv/config";
// ^ REQUIRED. Without this, DATABASE_URL silently falls back to localhost:5432
//   in standalone scripts. See AGENTS.md §6.

// Relative, not "@/lib/db": this file runs under tsx outside Next's resolver.
// src/lib/db.ts is the only place a PrismaClient is constructed.
import { prisma } from "../src/lib/db";

/**
 * The qualification / MQF backbone.
 *
 * This is a curated list, not user-generated data — it changes rarely and only
 * when the national framework changes. Seeded rather than admin-managed for the
 * same reason categories were seeded in the predecessor project.
 *
 * MQF levels are the spine of the entire system: every progression rule is
 * ultimately a statement about moving between levels, and every eligibility
 * check resolves against them.
 *
 * Every row carries an `mqfStatus` saying how far its MQF level has actually
 * been checked. Do not add a row without setting it honestly.
 *
 *   ASSIGNED         verified against the MQF document itself
 *   NOT_IN_FRAMEWORK verified, and MQA deliberately assigns no level
 *   UNKNOWN          drafted from research notes, nobody has checked it
 *
 * Verified 2026-08-19 against the Malaysian Qualifications Framework 2nd
 * Edition (MQA). See docs/decision-log.md for the quotes.
 *
 * The TVET rows below keep their drafted levels while marked UNKNOWN. The
 * numbers are probably right, but the MQF names no TVET qualification anywhere
 * — they need a JPK source before they can be called verified.
 */
const qualifications = [
  {
    slug: "spm",
    nameEn: "Malaysian Certificate of Education (SPM)",
    nameMs: "Sijil Pelajaran Malaysia (SPM)",
    // MQF 2nd Ed. para 74: explicitly not included in the Framework.
    mqfLevel: null,
    mqfStatus: "NOT_IN_FRAMEWORK",
    category: "SCHOOL",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 60,
    typicalDurationMonthsMax: 60,
  },
  {
    slug: "stpm",
    nameEn: "Malaysian Higher School Certificate (STPM)",
    nameMs: "Sijil Tinggi Persekolahan Malaysia (STPM)",
    // MQF 2nd Ed. para 74: explicitly not included in the Framework.
    mqfLevel: null,
    mqfStatus: "NOT_IN_FRAMEWORK",
    category: "PRE_UNIVERSITY",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 18,
    typicalDurationMonthsMax: 18,
  },
  {
    slug: "matrikulasi",
    nameEn: "Matriculation",
    nameMs: "Matrikulasi",
    // MQF 2nd Ed. para 74: explicitly not included in the Framework.
    mqfLevel: null,
    mqfStatus: "NOT_IN_FRAMEWORK",
    category: "PRE_UNIVERSITY",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 12,
    typicalDurationMonthsMax: 24,
  },
  {
    slug: "asasi",
    nameEn: "Foundation",
    nameMs: "Asasi",
    // MQF 2nd Ed. para 74: explicitly not included in the Framework.
    mqfLevel: null,
    mqfStatus: "NOT_IN_FRAMEWORK",
    category: "PRE_UNIVERSITY",
    awardingBodyType: "INSTITUTION",
    typicalDurationMonthsMin: 12,
    typicalDurationMonthsMax: 24,
  },
  {
    slug: "kv",
    nameEn: "Vocational College Diploma",
    nameMs: "Diploma Vokasional Malaysia (Kolej Vokasional)",
    mqfLevel: 4,
    mqfStatus: "UNKNOWN",
    category: "SKILLS_CERT",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 24,
    typicalDurationMonthsMax: 48,
  },
  {
    slug: "skm-1",
    nameEn: "Malaysian Skills Certificate Level 1",
    nameMs: "Sijil Kemahiran Malaysia Tahap 1",
    mqfLevel: 1,
    mqfStatus: "UNKNOWN",
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "skm-2",
    nameEn: "Malaysian Skills Certificate Level 2",
    nameMs: "Sijil Kemahiran Malaysia Tahap 2",
    mqfLevel: 2,
    mqfStatus: "UNKNOWN",
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "skm-3",
    nameEn: "Malaysian Skills Certificate Level 3",
    nameMs: "Sijil Kemahiran Malaysia Tahap 3",
    mqfLevel: 3,
    mqfStatus: "UNKNOWN",
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "dkm",
    nameEn: "Malaysian Skills Diploma (Level 4)",
    nameMs: "Diploma Kemahiran Malaysia (Tahap 4)",
    mqfLevel: 4,
    mqfStatus: "UNKNOWN",
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "dlkm",
    nameEn: "Malaysian Advanced Skills Diploma (Level 5)",
    nameMs: "Diploma Lanjutan Kemahiran Malaysia (Tahap 5)",
    mqfLevel: 5,
    mqfStatus: "UNKNOWN",
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "diploma",
    nameEn: "Diploma",
    nameMs: "Diploma",
    mqfLevel: 4,
    mqfStatus: "ASSIGNED",
    category: "DIPLOMA",
    awardingBodyType: "INSTITUTION",
    typicalDurationMonthsMin: 24,
    typicalDurationMonthsMax: 36,
  },
  {
    slug: "advanced-diploma",
    nameEn: "Advanced Diploma",
    nameMs: "Diploma Lanjutan",
    mqfLevel: 5,
    mqfStatus: "ASSIGNED",
    category: "DIPLOMA",
    awardingBodyType: "INSTITUTION",
    typicalDurationMonthsMin: 12,
    typicalDurationMonthsMax: 24,
  },
  {
    slug: "bachelor",
    nameEn: "Bachelor's Degree",
    nameMs: "Ijazah Sarjana Muda",
    mqfLevel: 6,
    mqfStatus: "ASSIGNED",
    category: "DEGREE",
    awardingBodyType: "INSTITUTION",
    typicalDurationMonthsMin: 36,
    typicalDurationMonthsMax: 48,
  },
] as const;

async function main() {
  console.log("Seeding qualification / MQF backbone...");

  for (const q of qualifications) {
    await prisma.qualification.upsert({
      where: { slug: q.slug },
      update: q,
      create: q,
    });
    const level =
      q.mqfStatus === "NOT_IN_FRAMEWORK"
        ? "not in the MQF"
        : `MQF ${q.mqfLevel}${q.mqfStatus === "UNKNOWN" ? " (unverified)" : ""}`;
    console.log(`  ✓ ${q.slug} — ${level}`);
  }

  const count = await prisma.qualification.count();
  console.log(`\nDone. ${count} qualifications in database.`);
  const unverified = await prisma.qualification.count({
    where: { mqfStatus: "UNKNOWN" },
  });
  if (unverified > 0) {
    console.log(
      `\n${unverified} qualification(s) still marked UNKNOWN — their MQF level is\n` +
        "drafted, not verified against a source document. The MQF names no TVET\n" +
        "qualification, so these need a JPK citation. Do not render them as fact."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
