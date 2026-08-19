import "dotenv/config";
// ^ REQUIRED. Without this, DATABASE_URL silently falls back to localhost:5432
//   in standalone scripts. See AGENTS.md §6.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
 * VERIFY THESE BEFORE TRUSTING THEM. They were drafted from research notes,
 * not read directly off the current MQF document. Cross-check against MQA's
 * published framework and record the verification date in docs/decision-log.md.
 */
const qualifications = [
  {
    slug: "spm",
    nameEn: "Malaysian Certificate of Education (SPM)",
    nameMs: "Sijil Pelajaran Malaysia (SPM)",
    mqfLevel: 2,
    category: "SCHOOL",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 60,
    typicalDurationMonthsMax: 60,
  },
  {
    slug: "stpm",
    nameEn: "Malaysian Higher School Certificate (STPM)",
    nameMs: "Sijil Tinggi Persekolahan Malaysia (STPM)",
    mqfLevel: 3,
    category: "PRE_UNIVERSITY",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 18,
    typicalDurationMonthsMax: 18,
  },
  {
    slug: "matrikulasi",
    nameEn: "Matriculation",
    nameMs: "Matrikulasi",
    mqfLevel: 3,
    category: "PRE_UNIVERSITY",
    awardingBodyType: "MOE",
    typicalDurationMonthsMin: 12,
    typicalDurationMonthsMax: 24,
  },
  {
    slug: "asasi",
    nameEn: "Foundation",
    nameMs: "Asasi",
    mqfLevel: 3,
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
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "skm-2",
    nameEn: "Malaysian Skills Certificate Level 2",
    nameMs: "Sijil Kemahiran Malaysia Tahap 2",
    mqfLevel: 2,
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "skm-3",
    nameEn: "Malaysian Skills Certificate Level 3",
    nameMs: "Sijil Kemahiran Malaysia Tahap 3",
    mqfLevel: 3,
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "dkm",
    nameEn: "Malaysian Skills Diploma (Level 4)",
    nameMs: "Diploma Kemahiran Malaysia (Tahap 4)",
    mqfLevel: 4,
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "dlkm",
    nameEn: "Malaysian Advanced Skills Diploma (Level 5)",
    nameMs: "Diploma Lanjutan Kemahiran Malaysia (Tahap 5)",
    mqfLevel: 5,
    category: "SKILLS_CERT",
    awardingBodyType: "DSD",
  },
  {
    slug: "diploma",
    nameEn: "Diploma",
    nameMs: "Diploma",
    mqfLevel: 4,
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
    console.log(`  ✓ ${q.slug} (MQF ${q.mqfLevel})`);
  }

  const count = await prisma.qualification.count();
  console.log(`\nDone. ${count} qualifications in database.`);
  console.log(
    "\nReminder: these MQF levels were drafted from research notes, not read\n" +
      "off the current MQF document. Verify before building rules on top of them."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
