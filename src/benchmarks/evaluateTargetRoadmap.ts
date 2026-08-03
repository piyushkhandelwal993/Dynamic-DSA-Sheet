import { assessTargetProblemReadiness } from "../services/targetRoadmap";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";
import { TargetRoadmapBenchmarkFixture } from "./targetRoadmapFixtures";

export interface TargetRoadmapBenchmarkFixtureResult {
  id: string;
  expectedTopicId: string;
  actualTopicId?: string;
  topicMatched: boolean;
  matchedConceptIds: string[];
  missingExpectedConceptIds: string[];
  alternateMatched: boolean;
}

export interface TargetRoadmapBenchmarkReport {
  fixtureCount: number;
  topicAccuracy: number;
  conceptRecall: number;
  alternateCoverage: number;
  fixtureResults: TargetRoadmapBenchmarkFixtureResult[];
}

export function evaluateTargetRoadmapBenchmark(fixtures: TargetRoadmapBenchmarkFixture[]): TargetRoadmapBenchmarkReport {
  const fixtureResults = fixtures.map((fixture) => {
    const assessment = assessTargetProblemReadiness(
      fixture.inputUrl,
      fixture.problemStatement,
      createInitialProgress(),
      createInitialSkillProfile()
    );
    const actualConceptIds = new Set([
      ...(assessment.inferredConceptIds ?? []),
      ...assessment.strengthConceptIds,
      ...assessment.missingConceptIds
    ]);
    const matchedConceptIds = fixture.expectedConceptIds.filter((conceptId) => actualConceptIds.has(conceptId));
    const missingExpectedConceptIds = fixture.expectedConceptIds.filter((conceptId) => !actualConceptIds.has(conceptId));
    const alternateMatched = Boolean(
      fixture.allowedAlternateTopicIds?.some((topicId) =>
        assessment.alternateHypotheses?.some((hypothesis) => hypothesis.topicId === topicId)
      )
    );

    return {
      id: fixture.id,
      expectedTopicId: fixture.expectedTopicId,
      actualTopicId: assessment.inferredTopicId ?? assessment.matchedProblem?.topicId,
      topicMatched: (assessment.inferredTopicId ?? assessment.matchedProblem?.topicId) === fixture.expectedTopicId,
      matchedConceptIds,
      missingExpectedConceptIds,
      alternateMatched
    };
  });

  const topicMatchCount = fixtureResults.filter((result) => result.topicMatched).length;
  const expectedConceptTotal = fixtures.reduce((sum, fixture) => sum + fixture.expectedConceptIds.length, 0);
  const conceptMatchCount = fixtureResults.reduce((sum, result) => sum + result.matchedConceptIds.length, 0);
  const alternateEligible = fixtures.filter((fixture) => (fixture.allowedAlternateTopicIds?.length ?? 0) > 0).length;
  const alternateMatched = fixtureResults.filter((result) => result.alternateMatched).length;

  return {
    fixtureCount: fixtures.length,
    topicAccuracy: ratio(topicMatchCount, fixtures.length),
    conceptRecall: ratio(conceptMatchCount, expectedConceptTotal),
    alternateCoverage: ratio(alternateMatched, alternateEligible),
    fixtureResults
  };
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : numerator / denominator;
}
