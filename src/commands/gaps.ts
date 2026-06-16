import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getConceptById, getSkillProfile } from "../services/storage";

export function gapsCommand(): void {
  ensureInitialized();
  const skillProfile = getSkillProfile();
  const weakConcepts = skillProfile.weakConcepts;

  console.log(chalk.cyan("Concept Gaps"));
  if (weakConcepts.length === 0) {
    console.log("No concept gaps detected yet.");
    return;
  }

  weakConcepts.forEach((conceptId) => {
    const concept = getConceptById(conceptId);
    const score = skillProfile.conceptScores[conceptId] ?? 0;
    console.log(`- ${concept?.name ?? conceptId}: score ${score}`);
    console.log(`  Why weak: low matched concept evidence across submissions.`);
  });
}
