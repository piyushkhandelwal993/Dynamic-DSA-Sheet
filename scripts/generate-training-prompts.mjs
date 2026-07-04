import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { generateTrainingPrompts } = require("../dist/services/analyzerTraining.js");

function parseArgs(argv) {
  const options = {
    problemId: undefined,
    problemIds: [],
    topicId: undefined,
    languages: ["java", "cpp"],
    modes: ["beginner", "pro"],
    variants: 8,
    supportedOnly: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--problem" || arg === "--problems") {
      const ids = (argv[index + 1] ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      if (ids.length === 1 && !options.problemId) {
        options.problemId = ids[0];
      }
      options.problemIds.push(...ids);
      index += 1;
    } else if (arg === "--topic") {
      options.topicId = argv[index + 1] ?? undefined;
      index += 1;
    } else if (arg === "--languages") {
      options.languages = (argv[index + 1] ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--modes") {
      options.modes = (argv[index + 1] ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--variants") {
      options.variants = Number.parseInt(argv[index + 1] ?? "8", 10) || 8;
      index += 1;
    } else if (arg === "--supported-only") {
      options.supportedOnly = true;
    }
  }

  if (!options.problemId && !options.topicId) {
    if (options.problemIds.length > 0) {
      options.problemId = undefined;
    } else {
      throw new Error("Provide --problem/--problems or --topic.");
    }
  }

  if (options.problemIds.length === 0 && options.problemId) {
    options.problemIds = [options.problemId];
  }

  if (!options.topicId && options.problemIds.length === 0) {
    throw new Error("Provide --problem/--problems or --topic.");
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = generateTrainingPrompts(options);
  console.log(`Generated ${result.prompts.length} prompt file(s) in training/prompts`);
  result.prompts.forEach((prompt) => console.log(`- ${prompt.fileName}`));
}

main();
