import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getActiveTopicId, getGameProfile, getProgress, getSkillProfile, getTopicMeta, getTopicProblems } from "../services/storage";
import { buildWorldZones } from "../services/progression";
import { getTopicTitle } from "../services/game";
import { formatZoneStatus } from "../services/theme";

export function worldCommand(options?: { topic?: string }): void {
  ensureInitialized();
  const topicId = options?.topic ?? getActiveTopicId();
  const topicMeta = getTopicMeta(topicId);
  const topicTitle = getTopicTitle(getGameProfile(), topicId);
  const zones = buildWorldZones(getTopicProblems(topicId), getProgress(), getSkillProfile(), topicId);

  console.log(chalk.cyan(`${topicMeta?.worldName ?? "World Map"}`));
  if (topicTitle) {
    console.log(`Active Title: ${chalk.magenta(topicTitle)}`);
  }
  zones.forEach((zone, index) => {
    console.log(`${index + 1}. ${zone.name} ${formatZoneStatus(zone.status)}`);
    console.log(`   ${zone.description}`);
    console.log(`   Progress: ${zone.solvedCount}/${zone.totalProblems}`);
    if (zone.gate) {
      console.log(`   Gate: ${chalk.red(zone.gate)}`);
    }
  });
}
