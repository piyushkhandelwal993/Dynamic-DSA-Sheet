import inquirer from "inquirer";
import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getProblemById, getProgress, saveProgress } from "../services/storage";
import { chooseRevisionDays, buildRevisionDate } from "../services/revision";

export async function doneCommand(problemId: string): Promise<void> {
  ensureInitialized();
  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Problem not found: ${problemId}`);
  }

  const answers = await inquirer.prompt([
    {
      type: "number",
      name: "attempts",
      message: "Attempts:",
      default: 1
    },
    {
      type: "number",
      name: "timeTakenMinutes",
      message: "Time taken (minutes):",
      default: problem.estimatedMinutes
    },
    {
      type: "number",
      name: "confidence",
      message: "Confidence (1-10):",
      default: 7
    },
    {
      type: "input",
      name: "notes",
      message: "Notes:",
      default: ""
    }
  ]);

  const progress = getProgress();
  const current = progress.problems[problemId] ?? {
    problemId,
    status: "pending" as const,
    attempts: 0,
    bestScore: 0
  };

  progress.problems[problemId] = {
    ...current,
    status: "solved",
    attempts: Number(answers.attempts || 1),
    timeTakenMinutes: Number(answers.timeTakenMinutes || problem.estimatedMinutes),
    confidence: Number(answers.confidence || 7),
    notes: answers.notes,
    completedAt: new Date().toISOString(),
    nextRevisionDate: buildRevisionDate(chooseRevisionDays(current.bestScore || 70))
  };

  saveProgress(progress);
  console.log(chalk.green(`Marked ${problemId} as done.`));
}
