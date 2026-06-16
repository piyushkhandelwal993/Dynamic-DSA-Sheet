import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getProblems, getProgress } from "../services/storage";
import { isRevisionDue } from "../services/revision";

export function reviseCommand(): void {
  ensureInitialized();
  const progress = getProgress();
  const problems = getProblems().filter((problem) => isRevisionDue(progress.problems[problem.id]?.nextRevisionDate));

  console.log(chalk.cyan("Revision Due"));
  if (problems.length === 0) {
    console.log("No problems are due for revision today.");
    return;
  }

  problems.forEach((problem) => {
    const state = progress.problems[problem.id];
    console.log(`- ${problem.id} ${problem.title} (due ${state.nextRevisionDate})`);
  });
}
