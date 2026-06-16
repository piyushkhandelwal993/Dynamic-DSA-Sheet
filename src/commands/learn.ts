import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getConceptById, getProblemById } from "../services/storage";
import { buildMiniTutorial } from "../services/tutorial";

export function learnCommand(conceptId: string, options?: { problem?: string; mini?: boolean }): void {
  ensureInitialized();
  const concept = getConceptById(conceptId);
  if (!concept) {
    throw new Error(`Concept not found: ${conceptId}`);
  }
  const problem = options?.problem ? getProblemById(options.problem) : undefined;

  console.log(chalk.cyan(`${concept.name} (${concept.id})`));
  if (options?.mini) {
    buildMiniTutorial(concept, problem).forEach((line) => console.log(line));
    return;
  }
  console.log(concept.description);
  console.log("");
  console.log("Example:");
  console.log(concept.exampleJava);
  console.log("");
  console.log("Common mistakes:");
  concept.commonMistakes.forEach((mistake) => console.log(`- ${mistake}`));
  console.log("");
  console.log("Practice problems:");
  concept.practiceProblems.forEach((problemId) => {
    const problem = getProblemById(problemId);
    console.log(`- ${problemId}${problem ? ` ${problem.title}` : ""}`);
  });
}
