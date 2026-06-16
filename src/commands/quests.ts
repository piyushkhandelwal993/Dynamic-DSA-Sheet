import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getActiveTopicId, getGameProfile, getProgress, getSkillProfile, getTopicMeta, getTopicProblems } from "../services/storage";
import { buildActiveQuests } from "../services/progression";
import { getTopicTitle } from "../services/game";
import { formatQuestStatus } from "../services/theme";

export function questsCommand(options?: { topic?: string }): void {
  ensureInitialized();
  const topicId = options?.topic ?? getActiveTopicId();
  const topicMeta = getTopicMeta(topicId);
  const topicTitle = getTopicTitle(getGameProfile(), topicId);
  const quests = buildActiveQuests(getTopicProblems(topicId), getProgress(), getSkillProfile(), topicId);

  console.log(chalk.cyan(`Quest Log${topicMeta ? ` - ${topicMeta.name}` : ""}`));
  if (topicTitle) {
    console.log(`Active Title: ${chalk.magenta(topicTitle)}`);
  }
  if (quests.length === 0) {
    console.log("No active quests right now. Clear a few more submissions to spawn new challenges.");
    return;
  }

  quests.forEach((quest, index) => {
    console.log(`${index + 1}. ${quest.title} ${formatQuestStatus(quest.status)}`);
    console.log(`   ${quest.description}`);
    if (quest.problemId) console.log(`   Target Problem: ${quest.problemId}`);
    if (quest.conceptId) console.log(`   Focus Concept: ${quest.conceptId}`);
    if (quest.rewardXp) console.log(`   Reward: ${chalk.cyan(`+${quest.rewardXp} XP`)}`);
  });
}
