#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { topicsCommand } from "./commands/topics";
import { nextCommand } from "./commands/next";
import { startCommand } from "./commands/start";
import { submitCommand } from "./commands/submit";
import { doneCommand } from "./commands/done";
import { reviseCommand } from "./commands/revise";
import { statsCommand } from "./commands/stats";
import { gapsCommand } from "./commands/gaps";
import { learnCommand } from "./commands/learn";
import { resetCommand } from "./commands/reset";
import { profileCommand } from "./commands/profile";
import { questsCommand } from "./commands/quests";
import { worldCommand } from "./commands/world";
import { topicShowCommand, topicUseCommand } from "./commands/topic";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("dsa")
    .description("Adaptive DSA learning CLI")
    .version("1.0.0");

  program.command("init").description("Initialize local student profile").action(initCommand);
  program.command("topics [topicId]").description("Show topic worlds or a topic roadmap").action(topicsCommand);
  program.command("next").description("Recommend the next problem").option("--topic <topicId>", "Override the active topic").action(nextCommand);
  program.command("start <problemId>").description("Start a problem").action(startCommand);
  program.command("submit <problemId> [filePath]").description("Submit a Java solution file").action(submitCommand);
  program.command("done <problemId>").description("Manually mark a problem done").action(doneCommand);
  program.command("revise").description("Show revision-due problems").action(reviseCommand);
  program.command("stats").description("Show overall progress stats").option("--topic <topicId>", "Override the active topic").action(statsCommand);
  program.command("profile").description("Show player profile and rewards").action(profileCommand);
  program.command("quests").description("Show active quests").option("--topic <topicId>", "Override the active topic").action(questsCommand);
  program.command("world").description("Show the world map and zone unlocks").option("--topic <topicId>", "Override the active topic").action(worldCommand);
  const topicProgram = program.command("topic").description("Manage the active topic");
  topicProgram.command("show").description("Show the active topic").action(topicShowCommand);
  topicProgram.command("use <topicId>").description("Switch the active topic").action(topicUseCommand);
  program.command("gaps").description("Show concept gaps").action(gapsCommand);
  program
    .command("learn <conceptId>")
    .description("Learn a concept")
    .option("--problem <problemId>", "Show the concept in the context of a problem")
    .option("--mini", "Show a short retry-focused tutorial")
    .action(learnCommand);
  program.command("reset").description("Reset local CLI data").action(resetCommand);

  await program.parseAsync(process.argv);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
