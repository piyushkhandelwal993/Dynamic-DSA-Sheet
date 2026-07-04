import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { importTrainingCandidates } = require("../dist/services/analyzerTraining.js");

function parseArgs(argv) {
  const options = {
    input: null,
    problemId: undefined,
    language: undefined,
    practiceMode: undefined,
    model: "manual-import",
    promptVersion: "v1"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      options.input = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--problem") {
      options.problemId = argv[index + 1] ?? undefined;
      index += 1;
    } else if (arg === "--language") {
      options.language = argv[index + 1] ?? undefined;
      index += 1;
    } else if (arg === "--mode") {
      options.practiceMode = argv[index + 1] ?? undefined;
      index += 1;
    } else if (arg === "--model") {
      options.model = argv[index + 1] ?? options.model;
      index += 1;
    } else if (arg === "--prompt-version") {
      options.promptVersion = argv[index + 1] ?? options.promptVersion;
      index += 1;
    }
  }

  if (!options.input) {
    throw new Error("Provide --input <path-to-json>.");
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const sourcePath = path.resolve(options.input);
  const jsonText = fs.readFileSync(sourcePath, "utf-8");
  const result = importTrainingCandidates({
    jsonText,
    problemId: options.problemId,
    language: options.language,
    practiceMode: options.practiceMode,
    model: options.model,
    promptVersion: options.promptVersion,
    sourceLabel: path.relative(process.cwd(), sourcePath)
  });

  console.log(`Imported ${result.imported.length} candidate(s).`);
  result.imported.forEach((candidate) => console.log(`- training/generated/${candidate.problemId}/${candidate.id}.json`));
}

main();
