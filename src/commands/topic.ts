import chalk from "chalk";
import { ensureInitialized } from "./shared";
import { getActiveTopicId, getTopicMeta, setActiveTopicId } from "../services/storage";

export function topicUseCommand(topicId: string): void {
  ensureInitialized();
  const topicMeta = getTopicMeta(topicId);
  if (!topicMeta) {
    throw new Error(`Unknown topic: ${topicId}`);
  }
  if (topicMeta.status !== "active") {
    throw new Error(`Topic is not active yet: ${topicId}`);
  }

  setActiveTopicId(topicId);
  console.log(chalk.green(`Active topic set to ${topicMeta.name}.`));
}

export function topicShowCommand(): void {
  ensureInitialized();
  const topicMeta = getTopicMeta(getActiveTopicId());
  if (!topicMeta) {
    console.log("No active topic selected.");
    return;
  }
  console.log(chalk.cyan(`Active Topic: ${topicMeta.name} (${topicMeta.id})`));
  console.log(topicMeta.description);
}
