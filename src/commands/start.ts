import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getProblemById, getProgress, saveProgress } from "../services/storage";
import { formatDifficulty } from "../services/theme";
import { ensureProblemWorkspace } from "../services/workspace";

export function startCommand(problemId: string): void {
  ensureInitialized();
  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Problem not found: ${problemId}`);
  }

  const progress = getProgress();
  const current = progress.problems[problemId] ?? {
    problemId,
    status: "started" as const,
    attempts: 0,
    bestScore: 0
  };

  progress.problems[problemId] = {
    ...current,
    status: current.status === "solved" ? current.status : "started",
    startedAt: current.startedAt ?? new Date().toISOString()
  };
  saveProgress(progress);
  const workspace = ensureProblemWorkspace(problem);

  console.log(chalk.cyan(`${problem.title} (${problem.id})`));
  console.log(`Difficulty: ${formatDifficulty(problem.difficulty)}`);
  console.log(`Subtopic: ${problem.subtopic}`);
  if (problem.description) {
    console.log("");
    console.log("Description:");
    console.log(problem.description);
  }
  if (problem.constraints && problem.constraints.length > 0) {
    console.log("");
    console.log("Constraints:");
    problem.constraints.forEach((constraint) => console.log(`- ${constraint}`));
  }
  if (problem.inputFormat && problem.inputFormat.length > 0) {
    console.log("");
    console.log("Input Format:");
    problem.inputFormat.forEach((line) => console.log(`- ${line}`));
  }
  if (problem.outputFormat && problem.outputFormat.length > 0) {
    console.log("");
    console.log("Output Format:");
    problem.outputFormat.forEach((line) => console.log(`- ${line}`));
  }
  console.log(`Expected concept: ${problem.expectedConcepts.join(", ")}`);
  console.log(`Prerequisite concepts: ${problem.prerequisiteConcepts.length > 0 ? problem.prerequisiteConcepts.join(", ") : "None"}`);
  console.log(`Expected complexity: ${problem.expectedComplexity}`);
  if (problem.intendedApproachSummary) {
    console.log("");
    console.log("Intended Approach:");
    console.log(problem.intendedApproachSummary);
  }
  console.log("Examples:");
  problem.examples.forEach((example) => {
    console.log(`- Input: ${example.input} | Output: ${example.output}`);
    if (example.explanation) {
      console.log(`  Explanation: ${example.explanation}`);
    }
  });
  if (problem.edgeCases && problem.edgeCases.length > 0) {
    console.log("");
    console.log("Edge Cases To Think About:");
    problem.edgeCases.forEach((edgeCase) => console.log(`- ${edgeCase}`));
  }
  if (problem.wrongApproachHints && problem.wrongApproachHints.length > 0) {
    console.log("");
    console.log("If You Are Missing Something:");
    problem.wrongApproachHints.forEach((hint) => console.log(`- ${hint}`));
  }
  console.log("");
  console.log("Hints:");
  problem.hints.forEach((hint) => console.log(`- ${hint}`));
  console.log("");
  console.log("Workspace:");
  console.log(`${workspace.created ? "Created" : "Using"} starter file: ${workspace.filePath}`);
  console.log(`Edit that file, then run: dsa submit ${problem.id}`);
}
