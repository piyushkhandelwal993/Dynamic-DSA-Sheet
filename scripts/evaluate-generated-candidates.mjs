import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateTrainingCandidates } = require("../dist/services/analyzerTraining.js");

function parseArgs(argv) {
  const options = {
    problemId: undefined,
    candidateId: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--problem") {
      options.problemId = argv[index + 1] ?? undefined;
      index += 1;
    } else if (arg === "--candidate") {
      options.candidateId = argv[index + 1] ?? undefined;
      index += 1;
    }
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = evaluateTrainingCandidates(options);
  console.log(`Evaluated ${result.evaluated.length} candidate(s).`);
  console.log(`Flagged ${result.suspiciousCount} suspicious candidate(s) into training/review-queue.`);
}

main();
