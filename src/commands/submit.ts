import fs from "fs";
import path from "path";
import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getConceptById, getProblemById } from "../services/storage";
import { buildMiniTutorial } from "../services/tutorial";
import { buildXpBar } from "../services/game";
import { formatBreakdownScore, formatDifficulty, formatQuestBanner, formatScore, formatXp } from "../services/theme";
import { resolveSubmissionPath } from "../services/workspace";
import { AnalysisResult, ConceptDetectionResult, ExecutionResult, Problem } from "../types";
import { submitProblemSolution } from "../services/submission";

function printRecommendationSteps(
  problemId: string,
  recommendation: { suggestedProblemIds: string[]; conceptIds: string[]; message: string; type: string },
  revisionDays: number
): void {
  const isRetryFlow = recommendation.type === "revise-prerequisite" && recommendation.suggestedProblemIds[0] === problemId;

  if (isRetryFlow) {
    const retryConcept = recommendation.conceptIds[0];
    if (retryConcept) {
      console.log(`1. Learn ${retryConcept} and focus on the missing idea`);
    }
    if (recommendation.suggestedProblemIds[0]) {
      console.log(`2. Retry ${recommendation.suggestedProblemIds[0]} using the required concept`);
    }
    console.log("3. Resubmit after updating your approach");
    return;
  }

  const conceptSuggestion = recommendation.conceptIds[0];
  if (conceptSuggestion) {
    console.log(`1. Learn ${conceptSuggestion}`);
  }
  if (recommendation.suggestedProblemIds[0]) {
    console.log(`2. Solve ${recommendation.suggestedProblemIds[0]}`);
  }
  if (recommendation.suggestedProblemIds[1]) {
    console.log(`3. Solve ${recommendation.suggestedProblemIds[1]}`);
  } else {
    console.log(`3. Revise ${problemId} after ${revisionDays} days`);
  }
}

function collectLikelyCauses(
  problem: Problem,
  execution: ExecutionResult,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult
): string[] {
  const hints: string[] = [];
  const compileError = execution.compileError ?? "";
  const failedCase = execution.failedCases[0];
  const runtimeError = failedCase?.error ?? "";

  if (compileError) {
    if (compileError.includes("';' expected")) {
      hints.push("A statement is probably missing a semicolon.");
    }
    if (compileError.includes("cannot find symbol")) {
      hints.push("A variable or method name may be misspelled or used before being declared.");
    }
    if (compileError.includes("class Main is public")) {
      hints.push("Keep the public class name as Main in the generated starter file.");
    }
    if (compileError.includes("reached end of file while parsing")) {
      hints.push("A closing brace or bracket is probably missing.");
    }
  }

  if (runtimeError) {
    if (runtimeError.includes("InputMismatchException")) {
      hints.push("The program may be reading input in the wrong type or order.");
    }
    if (runtimeError.includes("NullPointerException")) {
      hints.push("A variable may be null before you use it.");
    }
    if (runtimeError.includes("ArrayIndexOutOfBoundsException")) {
      hints.push("An index is going outside the valid range.");
    }
    if (runtimeError.includes("StackOverflowError")) {
      hints.push("The recursion may not be reaching its base case.");
    }
  }

  if (failedCase && !runtimeError) {
    hints.push("The output does not match the expected result for at least one test case.");
    if (analysis.signals.hasRecursiveCall && !analysis.signals.hasBaseCase) {
      hints.push("The recursive logic is missing a clear base case.");
    }
    if (!analysis.signals.hasRecursiveCall && problem.topic === "Recursion") {
      hints.push("This recursion problem still needs an actual recursive call.");
    }
    if (detection.missingConcepts.length > 0) {
      hints.push(`The intended concept is still missing: ${detection.missingConcepts[0]}.`);
    }
    if (analysis.signals.usesModuloDivision && problem.topic === "Bit Manipulation") {
      hints.push("The arithmetic approach may be correct for some cases, but this track expects direct bitwise reasoning.");
    }
    if (analysis.signals.hasUnnecessaryLoop && problem.expectedComplexity === "O(1)") {
      hints.push("A loop is being used where a constant-time trick is expected.");
    }
  }

  if (analysis.signals.missingEdgeCaseHandling) {
    hints.push("Edge cases are not handled clearly yet.");
  }

  return Array.from(new Set(hints)).slice(0, 4);
}

function printExecutionFeedback(
  problem: Problem,
  execution: ExecutionResult,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult
): void {
  console.log("Execution:");
  if (!execution.compileSucceeded) {
    console.log("- Compilation failed.");
    if (execution.compileError) {
      console.log("");
      console.log("Compiler Output:");
      console.log(execution.compileError);
    }
  } else if (execution.failedCases.length === 0) {
    console.log(`- All ${execution.totalCount} test cases passed.`);
  } else {
    execution.failedCases.slice(0, 3).forEach((failedCase, index) => {
      console.log(`- Failed Case ${index + 1} (${failedCase.visibility})`);
      console.log(`  Input: ${failedCase.input}`);
      console.log(`  Expected: ${failedCase.expectedOutput}`);
      console.log(`  Got: ${failedCase.actualOutput || "<no output>"}`);
      if (failedCase.error) {
        console.log(`  Error: ${failedCase.error}`);
      }
    });
  }

  const shouldExplainFailure = !execution.compileSucceeded || execution.failedCases.length > 0;
  const likelyCauses = shouldExplainFailure ? collectLikelyCauses(problem, execution, analysis, detection) : [];
  if (likelyCauses.length > 0) {
    console.log("");
    console.log("Likely Cause:");
    likelyCauses.forEach((hint) => console.log(`- ${hint}`));
  }
}

export function submitCommand(problemId: string, filePath?: string): void {
  ensureInitialized();

  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Problem not found: ${problemId}`);
  }

  const resolvedPath = resolveSubmissionPath(problem, filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Java file not found: ${resolvedPath}. Run dsa start ${problemId} first or pass a custom file path.`);
  }

  if (path.extname(resolvedPath) !== ".java") {
    throw new Error("MVP currently supports Java submissions only.");
  }

  const outcome = submitProblemSolution(problemId, resolvedPath);
  const { execution, analysis, detection, score, recommendation, rewardResult, revisionDays } = outcome;

  console.log(formatQuestBanner(rewardResult.questStatus));
  console.log(`Problem: ${problem.title}`);
  console.log(`Difficulty: ${formatDifficulty(problem.difficulty)}`);
  console.log(`Final Score: ${formatScore(score.finalScore)}/100`);
  if (execution.usedTestCases) {
    console.log(
      `Test Results: ${execution.compileSucceeded ? `${execution.passedCount}/${execution.totalCount} passed` : "Compilation failed"}`
    );
  }
  console.log(`XP Gained: ${formatXp(rewardResult.xpGained)}`);
  console.log(`Rank: ${chalk.yellow(rewardResult.updatedProfile.rankTitle)}`);
  console.log(`Level: ${chalk.green(rewardResult.updatedProfile.level)}`);
  console.log(chalk.cyan(buildXpBar(rewardResult.updatedProfile.xp)));
  if (rewardResult.leveledUp) {
    console.log(chalk.green(`Level Up! You reached Level ${rewardResult.updatedProfile.level}.`));
  }
  if (rewardResult.earnedBadges.length > 0) {
    console.log(`Badges Unlocked: ${chalk.yellow(rewardResult.earnedBadges.map((badge) => badge.name).join(", "))}`);
  }
  console.log("");
  console.log("Breakdown:");
  console.log(formatBreakdownScore("Correctness", score.correctnessScore));
  console.log(formatBreakdownScore("Concept Match", score.conceptMatchScore));
  console.log(formatBreakdownScore("Code Quality", score.qualityScore));
  console.log(formatBreakdownScore("Complexity", score.complexityScore));
  console.log("");
  if (execution.usedTestCases) {
    printExecutionFeedback(problem, execution, analysis, detection);
    console.log("");
  }
  console.log("Detected:");
  const detectedLines = [...analysis.detected, ...analysis.warnings];
  detectedLines.forEach((line) => console.log(`- ${line}`));
  console.log("");
  console.log("Missing Concepts:");
  detection.missingConcepts.forEach((concept) => console.log(`- ${concept}`));
  if (detection.missingConcepts.length === 0) {
    console.log("- None");
  }
  console.log("");
  console.log("Recommended Next:");
  console.log(recommendation.message);
  recommendation.reasons.forEach((reason) => console.log(`- ${reason}`));
  const shouldShowMiniTutorial = recommendation.type === "revise-prerequisite" && recommendation.suggestedProblemIds[0] === problem.id;
  if (shouldShowMiniTutorial) {
    const tutorialConceptId = recommendation.conceptIds[0];
    const concept = tutorialConceptId ? getConceptById(tutorialConceptId) : undefined;
    if (concept) {
      console.log("");
      console.log("Mini Tutorial:");
      buildMiniTutorial(concept, problem).forEach((line) => console.log(`- ${line}`));
    }
  }
  printRecommendationSteps(problem.id, recommendation, revisionDays);
}
