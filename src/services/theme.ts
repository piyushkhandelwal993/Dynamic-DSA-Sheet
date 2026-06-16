import chalk from "chalk";
import { Difficulty, MasteryTier, RecommendationResult, ScoreBreakdown, WorldZone } from "../types";

export function formatDifficulty(difficulty: Difficulty): string {
  if (difficulty === "Easy") return chalk.green(difficulty);
  if (difficulty === "Medium") return chalk.yellow(difficulty);
  return chalk.red(difficulty);
}

export function formatMasteryTier(tier: MasteryTier): string {
  if (tier === "Unseen") return chalk.gray(tier);
  if (tier === "Training") return chalk.red(tier);
  if (tier === "Comfortable") return chalk.yellow(tier);
  if (tier === "Strong") return chalk.cyan(tier);
  return chalk.green(tier);
}

export function formatZoneStatus(status: WorldZone["status"]): string {
  if (status === "cleared") return chalk.cyanBright(`[${status.toUpperCase()}]`);
  if (status === "unlocked") return chalk.green(`[${status.toUpperCase()}]`);
  return chalk.red(`[${status.toUpperCase()}]`);
}

export function formatQuestStatus(status: "active" | "locked" | "ready"): string {
  if (status === "active") return chalk.magenta(`[${status.toUpperCase()}]`);
  if (status === "ready") return chalk.green(`[${status.toUpperCase()}]`);
  return chalk.gray(`[${status.toUpperCase()}]`);
}

export function formatRecommendationType(type: RecommendationResult["type"]): string {
  if (type === "move-forward") return chalk.cyan(type);
  if (type === "extra-practice") return chalk.yellow(type);
  if (type === "skip-basics") return chalk.green(type);
  return chalk.magenta(type);
}

export function formatScore(value: number): string {
  if (value >= 85) return chalk.green(String(value));
  if (value >= 60) return chalk.yellow(String(value));
  return chalk.red(String(value));
}

export function formatBreakdownScore(label: string, value: number): string {
  return `${label}: ${formatScore(value)}`;
}

export function formatQuestBanner(questStatus: "quest-complete" | "training-quest"): string {
  return questStatus === "quest-complete"
    ? chalk.greenBright("=== QUEST COMPLETE ===")
    : chalk.magentaBright("=== TRAINING QUEST ===");
}

export function formatXp(value: number): string {
  return chalk.cyan(`+${value}`);
}
