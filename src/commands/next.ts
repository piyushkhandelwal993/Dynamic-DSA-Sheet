import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getActiveTopicId, getProgress, getSkillProfile, getTopicMeta, getTopicProblems } from "../services/storage";
import { recommendNextProblem } from "../services/recommendation";
import { formatDifficulty, formatRecommendationType } from "../services/theme";

export function nextCommand(options?: { topic?: string }): void {
  ensureInitialized();
  const topicId = options?.topic ?? getActiveTopicId();
  const topicMeta = getTopicMeta(topicId);
  const recommendation = recommendNextProblem(getTopicProblems(topicId), getProgress(), getSkillProfile());
  const isRetryFlow =
    recommendation.type === "revise-prerequisite" && recommendation.suggestedProblemIds[0] === recommendation.problem?.id;

  console.log(chalk.cyan(recommendation.message));
  if (topicMeta) {
    console.log(`Topic World: ${chalk.yellow(topicMeta.name)}`);
  }
  console.log(`Quest Type: ${formatRecommendationType(recommendation.type)}`);
  if (recommendation.problem) {
    console.log(`Problem: ${recommendation.problem.id} - ${recommendation.problem.title}`);
    console.log(`Difficulty: ${formatDifficulty(recommendation.problem.difficulty)}`);
    console.log(`Subtopic: ${recommendation.problem.subtopic}`);
  }
  console.log("Reasons:");
  recommendation.reasons.forEach((reason) => console.log(`- ${reason}`));
  if (isRetryFlow) {
    console.log("What this means:");
    console.log("- Your earlier answer may be correct, but it did not yet demonstrate the required concept.");
    console.log("- The CLI is asking for a same-problem retry before unlocking a new problem.");
  }
  if (recommendation.suggestedProblemIds.length > 0) {
    console.log(`Suggested IDs: ${chalk.cyan(recommendation.suggestedProblemIds.join(", "))}`);
  }
}
