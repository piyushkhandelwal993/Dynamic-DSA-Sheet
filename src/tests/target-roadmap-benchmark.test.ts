import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTargetRoadmapBenchmark } from "../benchmarks/evaluateTargetRoadmap";
import { targetRoadmapBenchmarkFixtures } from "../benchmarks/targetRoadmapFixtures";

test("target roadmap benchmark meets the current quality floor", () => {
  const report = evaluateTargetRoadmapBenchmark(targetRoadmapBenchmarkFixtures);

  assert.ok(report.fixtureCount >= 16);
  assert.ok(report.topicAccuracy >= 0.8, `topicAccuracy ${(report.topicAccuracy * 100).toFixed(1)}%`);
  assert.ok(report.conceptRecall >= 0.75, `conceptRecall ${(report.conceptRecall * 100).toFixed(1)}%`);
  assert.ok(report.alternateCoverage >= 1, `alternateCoverage ${(report.alternateCoverage * 100).toFixed(1)}%`);
});
