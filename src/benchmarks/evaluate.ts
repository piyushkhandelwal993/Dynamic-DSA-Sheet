import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import { hasFact } from "../services/analysis-engine/facts";
import { AnalyzerBenchmarkFixture } from "./fixtures";

export interface FixtureBenchmarkResult {
  id: string;
  language: string;
  category: string;
  truePositives: string[];
  falseNegatives: string[];
  falsePositives: string[];
}

export interface AnalyzerBenchmarkReport {
  fixtureCount: number;
  positiveAssertions: number;
  negativeAssertions: number;
  truePositiveCount: number;
  falseNegativeCount: number;
  falsePositiveCount: number;
  precision: number;
  recall: number;
  parity: number;
  fixtureResults: FixtureBenchmarkResult[];
  parityFailures: string[];
}

export function evaluateAnalyzerBenchmark(fixtures: AnalyzerBenchmarkFixture[]): AnalyzerBenchmarkReport {
  const analyzed = fixtures.map((fixture) => ({
    fixture,
    facts: analyzeCodeFacts(fixture.language, fixture.code)
  }));
  const fixtureResults = analyzed.map(({ fixture, facts }) => ({
    id: fixture.id,
    language: fixture.language,
    category: fixture.category,
    truePositives: fixture.expectedFacts.filter((id) => hasFact(facts, id)),
    falseNegatives: fixture.expectedFacts.filter((id) => !hasFact(facts, id)),
    falsePositives: fixture.forbiddenFacts.filter((id) => hasFact(facts, id))
  }));
  const truePositiveCount = fixtureResults.reduce((sum, result) => sum + result.truePositives.length, 0);
  const falseNegativeCount = fixtureResults.reduce((sum, result) => sum + result.falseNegatives.length, 0);
  const falsePositiveCount = fixtureResults.reduce((sum, result) => sum + result.falsePositives.length, 0);
  const parityFailures = evaluateParity(analyzed);
  const parityGroups = new Set(fixtures.flatMap((fixture) => fixture.parityGroup ? [fixture.parityGroup] : [])).size;

  return {
    fixtureCount: fixtures.length,
    positiveAssertions: truePositiveCount + falseNegativeCount,
    negativeAssertions: fixtures.reduce((sum, fixture) => sum + fixture.forbiddenFacts.length, 0),
    truePositiveCount,
    falseNegativeCount,
    falsePositiveCount,
    precision: ratio(truePositiveCount, truePositiveCount + falsePositiveCount),
    recall: ratio(truePositiveCount, truePositiveCount + falseNegativeCount),
    parity: ratio(parityGroups - parityFailures.length, parityGroups),
    fixtureResults,
    parityFailures
  };
}

function evaluateParity(
  analyzed: Array<{ fixture: AnalyzerBenchmarkFixture; facts: ReturnType<typeof analyzeCodeFacts> }>
): string[] {
  const groups = new Map<string, typeof analyzed>();
  analyzed.forEach((entry) => {
    if (!entry.fixture.parityGroup) return;
    groups.set(entry.fixture.parityGroup, [...(groups.get(entry.fixture.parityGroup) ?? []), entry]);
  });

  const failures: string[] = [];
  groups.forEach((entries, group) => {
    if (entries.length < 2) return;
    const labels = Array.from(new Set(entries.flatMap((entry) => [
      ...entry.fixture.expectedFacts,
      ...entry.fixture.forbiddenFacts
    ])));
    const baseline = labels.map((id) => hasFact(entries[0].facts, id));
    if (entries.slice(1).some((entry) => labels.some((id, index) => hasFact(entry.facts, id) !== baseline[index]))) {
      failures.push(group);
    }
  });
  return failures;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : numerator / denominator;
}
