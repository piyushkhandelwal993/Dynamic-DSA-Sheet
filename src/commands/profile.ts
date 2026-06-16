import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getConceptById, getGameProfile, getProfile, getSkillProfile, getTopicMeta } from "../services/storage";
import { buildXpBar, getTopicTitle } from "../services/game";
import { getMasterySummary } from "../services/progression";
import { formatMasteryTier } from "../services/theme";

export function profileCommand(): void {
  ensureInitialized();
  const profile = getProfile();
  const gameProfile = getGameProfile();
  const mastery = getMasterySummary(getSkillProfile()).slice(0, 5);

  console.log(chalk.cyan("Player Card"));
  console.log(`${chalk.white(profile?.name ?? "Player")} | ${chalk.yellow(gameProfile.rankTitle)}`);
  console.log(`Level ${chalk.green(gameProfile.level)} | XP ${chalk.cyan(gameProfile.xp)}`);
  if (profile?.activeTopicId) {
    console.log(`Active Topic: ${chalk.cyan(getTopicMeta(profile.activeTopicId)?.name ?? profile.activeTopicId)}`);
    const topicTitle = getTopicTitle(gameProfile, profile.activeTopicId);
    if (topicTitle) {
      console.log(`Active Title: ${chalk.magenta(topicTitle)}`);
    }
  }
  console.log(chalk.cyan(buildXpBar(gameProfile.xp)));
  console.log(`Streak: ${chalk.magenta(`${gameProfile.streakDays} day(s)`)}`);
  console.log(`Quests Cleared: ${gameProfile.questsCompleted}`);
  console.log("");
  console.log("Mastery:");
  if (mastery.length === 0) {
    console.log("- No concept mastery yet");
  } else {
    mastery.forEach((item) => {
      const concept = getConceptById(item.conceptId);
      console.log(`- ${concept?.name ?? item.conceptId}: ${formatMasteryTier(item.tier)} (${chalk.cyan(item.score)})`);
    });
  }
  console.log("");
  console.log("Badges:");
  if (gameProfile.badges.length === 0) {
    console.log("- None yet");
    return;
  }

  gameProfile.badges.forEach((badge) => {
    console.log(`- ${chalk.yellow(badge.name)}: ${badge.description}`);
  });
}
