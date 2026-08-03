import { evaluateTargetRoadmapBenchmark } from "./evaluateTargetRoadmap";
import { targetRoadmapBenchmarkFixtures } from "./targetRoadmapFixtures";

const report = evaluateTargetRoadmapBenchmark(targetRoadmapBenchmarkFixtures);

console.log("DSA Sheet Target Roadmap Benchmark");
console.log(`Fixtures: ${report.fixtureCount}`);
console.log(`Topic accuracy: ${(report.topicAccuracy * 100).toFixed(1)}%`);
console.log(`Concept recall: ${(report.conceptRecall * 100).toFixed(1)}%`);
console.log(`Alternate coverage: ${(report.alternateCoverage * 100).toFixed(1)}%`);

const failures = report.fixtureResults.filter(
  (result) => !result.topicMatched || result.missingExpectedConceptIds.length > 0
);

if (failures.length) {
  console.log("\nFixture gaps:");
  failures.forEach((result) => {
    console.log(`- ${result.id}`);
    if (!result.topicMatched) {
      console.log(`  Topic mismatch: expected ${result.expectedTopicId}, got ${result.actualTopicId ?? "none"}`);
    }
    if (result.missingExpectedConceptIds.length) {
      console.log(`  Missing expected concepts: ${result.missingExpectedConceptIds.join(", ")}`);
    }
  });
}

if (report.topicAccuracy < 0.8 || report.conceptRecall < 0.75 || report.alternateCoverage < 1) {
  process.exitCode = 1;
}
