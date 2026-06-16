import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getActiveTopicId, getGameProfile, getProgress, getSkillProfile, getTopicMeta, getTopicProblems } from "../services/storage";
import { buildXpBar, getTopicTitle } from "../services/game";
import { buildActiveQuests, buildWorldZones, getMasterySummary } from "../services/progression";
import { recommendNextProblem } from "../services/recommendation";
import { formatMasteryTier } from "../services/theme";

export function statsCommand(options?: { topic?: string }): void {
  ensureInitialized();
  const topicId = options?.topic ?? getActiveTopicId();
  const topicMeta = getTopicMeta(topicId);
  const problems = getTopicProblems(topicId);
  const progress = getProgress();
  const skillProfile = getSkillProfile();
  const gameProfile = getGameProfile();
  const quests = buildActiveQuests(problems, progress, skillProfile, topicId);
  const zones = buildWorldZones(problems, progress, skillProfile, topicId);
  const mastery = getMasterySummary(skillProfile);

  const solved = Object.values(progress.problems).filter((problem) => problem.status === "solved").length;
  const skipped = Object.values(progress.problems).filter((problem) => problem.status === "skipped").length;
  const pending = problems.length - solved - skipped;
  const recommended = recommendNextProblem(problems, progress, skillProfile);

  console.log(chalk.cyan("Progress Stats"));
  if (topicMeta) {
    console.log(`Topic World: ${chalk.cyan(topicMeta.name)}`);
  }
  console.log(`Rank: ${chalk.yellow(gameProfile.rankTitle)} | Level ${chalk.green(gameProfile.level)} | XP ${chalk.cyan(gameProfile.xp)}`);
  const topicTitle = getTopicTitle(gameProfile, topicId);
  if (topicTitle) {
    console.log(`Topic Title: ${chalk.magenta(topicTitle)}`);
  }
  console.log(chalk.cyan(buildXpBar(gameProfile.xp)));
  console.log(`Streak: ${chalk.magenta(`${gameProfile.streakDays} day(s)`)} | Badges: ${chalk.yellow(gameProfile.badges.length)}`);
  console.log(`Total problems: ${problems.length}`);
  console.log(`Solved: ${solved}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Pending: ${pending}`);
  console.log("");
  console.log("Skill scores:");
  Object.entries(skillProfile.conceptScores)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([concept, value]) => console.log(`- ${concept}: ${value}`));

  console.log("");
  console.log(`Weak concepts: ${skillProfile.weakConcepts.length > 0 ? skillProfile.weakConcepts.join(", ") : "None"}`);
  console.log(`Strong concepts: ${skillProfile.strongConcepts.length > 0 ? skillProfile.strongConcepts.join(", ") : "None"}`);
  console.log(`Recommended next problems: ${recommended.suggestedProblemIds.join(", ")}`);
  console.log(`Active quests: ${quests.length}`);
  console.log(`Unlocked zones: ${zones.filter((zone) => zone.status !== "locked").length}/${zones.length}`);
  if (mastery.length > 0) {
    console.log(`Top mastery tier: ${formatMasteryTier(mastery[0].tier)}`);
  }
}
