import chalk from "chalk";
import { getTopicMeta, getTopicMetas, getTopicRoadmap } from "../services/storage";

export function topicsCommand(topicId?: string): void {
  if (!topicId) {
    console.log(chalk.cyan("Available Topic Worlds"));
    getTopicMetas().forEach((topicMeta) => {
      console.log(`- ${topicMeta.name} (${topicMeta.id}) [${topicMeta.status}]`);
    });
    console.log("");
    console.log("Use `dsa topics <topicId>` to view a topic roadmap.");
    return;
  }

  const topicMeta = getTopicMeta(topicId);
  if (!topicMeta) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  console.log(chalk.cyan(`${topicMeta.name} Roadmap`));
  console.log(topicMeta.description);
  getTopicRoadmap(topicId).forEach((topic, index) => {
    console.log(`${index + 1}. ${topic}`);
  });
}
