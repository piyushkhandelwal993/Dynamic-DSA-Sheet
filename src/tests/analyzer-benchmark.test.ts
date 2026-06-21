import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAnalyzerBenchmark } from "../benchmarks/evaluate";
import { analyzerBenchmarkFixtures } from "../benchmarks/fixtures";

test("analyzer benchmark meets the release quality floor", () => {
  const report = evaluateAnalyzerBenchmark(analyzerBenchmarkFixtures);

  assert.ok(report.fixtureCount >= 18);
  assert.ok(report.precision >= 0.95, `precision ${(report.precision * 100).toFixed(1)}%`);
  assert.ok(report.recall >= 0.9, `recall ${(report.recall * 100).toFixed(1)}%`);
  assert.ok(report.parity >= 0.9, `parity ${(report.parity * 100).toFixed(1)}%`);
});
