/**
 * The success test from AGENTS.md §4: answer one real progression question
 * from the database, with sources attached.
 *
 * Run: npx tsx scripts/ask.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import {
  buildProgressionAnswer,
  isCurrent,
  type RuleView,
} from "../src/lib/rules/progression-answer";

const ASKED_ON = new Date();

async function main() {
  const programme = await prisma.programme.findFirstOrThrow({
    where: { slug: "bcs-software-engineering", institution: { slug: "uthm" } },
    include: { institution: true },
  });
  const diploma = await prisma.qualification.findUniqueOrThrow({
    where: { slug: "diploma" },
  });

  console.log(`Q: I hold a ${diploma.nameEn}.`);
  console.log(`   What credit transfer applies at ${programme.institution.nameEn}`);
  console.log(`   for the ${programme.nameEn}?\n`);

  const rows = await prisma.progressionRule.findMany({
    where: { fromQualificationId: diploma.id, toProgrammeId: programme.id },
    include: { caveats: true },
  });

  const rules: RuleView[] = rows
    .filter((r) => isCurrent(r, ASKED_ON))
    .map((r) => ({
      transferType: r.transferType,
      maxTransferPercent: r.maxTransferPercent === null ? null : Number(r.maxTransferPercent),
      maxTransferCredits: r.maxTransferCredits,
      targetTotalCredits: programme.totalCredits,
      requirements: r.requirements as Record<string, unknown>,
      sourceUrl: r.sourceUrl,
      sourceDocumentDate: r.sourceDocumentDate,
      verifiedOn: r.verifiedOn,
      caveats: r.caveats.map((c) => ({ textEn: c.textEn, textMs: c.textMs, severity: c.severity })),
    }));

  const answer = buildProgressionAnswer(rules);

  if (!answer.known) {
    console.log("A: No rule is on record for this pairing.");
    console.log("   That means nobody has entered one — NOT that transfer is impossible.");
    return;
  }

  console.log("A: Credit transfer is available, in two tiers:\n");
  for (const tier of answer.tiers) {
    const t = tier.requirements.tier ?? "(untiered)";
    const cap =
      tier.cap.kind === "percent"
        ? `up to ${tier.cap.percent}% of graduating credits` +
          (tier.cap.atMostCredits === null
            ? " (cannot be shown as a credit figure — UTHM does not publish this programme's graduating credit total)"
            : ` (at most ${tier.cap.atMostCredits} credits)`)
        : tier.cap.kind === "credits"
          ? `up to ${tier.cap.atMostCredits} credits`
          : "no cap stated";
    console.log(`   ${t}`);
    console.log(`     type:        ${tier.transferType}`);
    console.log(`     cap:         ${cap}`);
    console.log(`     min grade:   ${tier.requirements.minCourseGrade}`);
    console.log(`     syllabus:    ${tier.requirements.minSyllabusSimilarityPercent}% similarity required`);
    console.log(`     apply:       ${tier.requirements.applicationWindow}`);
    console.log("");
  }

  console.log("   What this does NOT tell you:");
  for (const c of answer.caveats) {
    console.log(`     [${c.severity}] ${c.textEn.replace(/\s+/g, " ")}`);
  }

  const src = answer.tiers[0].source;
  console.log("\n   Source:");
  console.log(`     ${src.url}`);
  console.log(`     document date ${src.documentDate.toISOString().slice(0, 10)}` +
    `, last verified ${src.verifiedOn.toISOString().slice(0, 10)}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
