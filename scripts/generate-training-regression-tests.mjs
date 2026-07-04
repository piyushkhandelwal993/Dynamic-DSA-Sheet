import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { generateTrainingRegressionTests } = require("../dist/services/analyzerTraining.js");

function main() {
  const result = generateTrainingRegressionTests();
  console.log(`Generated regression tests at ${result.outputPath}`);
  console.log(`- Active tests: ${result.activeTests}`);
  console.log(`- Todo tests: ${result.todoTests}`);
}

main();
