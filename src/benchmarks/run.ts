import { analyzerBenchmarkFixtures } from "./fixtures";
import { evaluateAnalyzerBenchmark } from "./evaluate";

const MIN_PRECISION = 0.95;
const MIN_RECALL = 0.9;
const MIN_PARITY = 0.9;
const report = evaluateAnalyzerBenchmark(analyzerBenchmarkFixtures);

console.log("DSA Sheet Analyzer Benchmark");
console.log(`Fixtures: ${report.fixtureCount}`);
console.log(`Positive assertions: ${report.positiveAssertions}`);
console.log(`Negative assertions: ${report.negativeAssertions}`);
console.log(`Precision: ${(report.precision * 100).toFixed(1)}%`);
console.log(`Recall: ${(report.recall * 100).toFixed(1)}%`);
console.log(`Language parity: ${(report.parity * 100).toFixed(1)}%`);

const failures = report.fixtureResults.filter(
  (result) => result.falseNegatives.length || result.falsePositives.length
);
if (failures.length) {
  console.log("\nFixture failures:");
  failures.forEach((result) => {
    console.log(`- ${result.id}`);
    if (result.falseNegatives.length) console.log(`  Missed: ${result.falseNegatives.join(", ")}`);
    if (result.falsePositives.length) console.log(`  False positives: ${result.falsePositives.join(", ")}`);
  });
}
if (report.parityFailures.length) {
  console.log(`\nParity failures: ${report.parityFailures.join(", ")}`);
}

if (report.precision < MIN_PRECISION || report.recall < MIN_RECALL || report.parity < MIN_PARITY) {
  process.exitCode = 1;
}
