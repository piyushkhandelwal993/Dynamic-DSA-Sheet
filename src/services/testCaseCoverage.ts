import { topicOrder, topicPacks } from "../data/topics";
import { Problem } from "../types";
import {
  getCuratedBoundaryCases,
  getExecutionTestCases,
  getTestCaseCoverageSource,
  TestCaseCoverageSource
} from "./problemTestCases";

export type TestCaseCoverageStatus = "strong" | "basic" | "weak" | "missing";

export interface ProblemTestCaseCoverage {
  problemId: string;
  topicId: string;
  source: TestCaseCoverageSource;
  configuredCount: number;
  curatedCount: number;
  effectiveCount: number;
  hiddenCount: number;
  declaredEdgeCaseCount: number;
  status: TestCaseCoverageStatus;
}

export interface TopicTestCaseCoverage {
  topicId: string;
  totalProblems: number;
  configuredProblems: number;
  curatedProblems: number;
  exampleOnlyProblems: number;
  hiddenProblems: number;
  strongProblems: number;
  basicProblems: number;
  weakProblems: number;
  missingProblems: number;
}

export interface TestCaseCoverageReport {
  totalProblems: number;
  configuredProblems: number;
  curatedProblems: number;
  exampleOnlyProblems: number;
  executableProblems: number;
  hiddenProblems: number;
  strongProblems: number;
  basicProblems: number;
  weakProblems: number;
  missingProblems: number;
  executableCoverage: number;
  hiddenCoverage: number;
  topics: TopicTestCaseCoverage[];
  problems: ProblemTestCaseCoverage[];
}

export const testCaseReleaseFloor = {
  executableCoverage: 1,
  hiddenCoverage: 0.82,
  missingProblems: 0
} as const;

function coverageStatus(source: TestCaseCoverageSource, effectiveCount: number, hiddenCount: number): TestCaseCoverageStatus {
  if (source === "none") {
    return "missing";
  }
  if (hiddenCount >= 2 && effectiveCount >= 3) {
    return "strong";
  }
  if (hiddenCount >= 1 && effectiveCount >= 2) {
    return "basic";
  }
  return "weak";
}

function auditProblem(problem: Problem, topicId: string): ProblemTestCaseCoverage {
  const configuredCount = problem.testCases?.length ?? 0;
  const curatedCount = getCuratedBoundaryCases(problem.id).length;
  const effectiveCases = getExecutionTestCases(problem);
  const hiddenCount = effectiveCases.filter((testCase) => testCase.visibility === "hidden").length;
  const source = getTestCaseCoverageSource(problem);

  return {
    problemId: problem.id,
    topicId,
    source,
    configuredCount,
    curatedCount,
    effectiveCount: effectiveCases.length,
    hiddenCount,
    declaredEdgeCaseCount: problem.edgeCases?.length ?? 0,
    status: coverageStatus(source, effectiveCases.length, hiddenCount)
  };
}

export function buildTestCaseCoverageReport(): TestCaseCoverageReport {
  const problems = topicOrder.flatMap((topicId) =>
    topicPacks[topicId].problems.map((problem) => auditProblem(problem, topicId))
  );

  const topics = topicOrder.map((topicId) => {
    const topicProblems = problems.filter((problem) => problem.topicId === topicId);
    return {
      topicId,
      totalProblems: topicProblems.length,
      configuredProblems: topicProblems.filter((problem) => problem.source === "configured").length,
      curatedProblems: topicProblems.filter((problem) => problem.source === "curated").length,
      exampleOnlyProblems: topicProblems.filter((problem) => problem.source === "examples").length,
      hiddenProblems: topicProblems.filter((problem) => problem.hiddenCount > 0).length,
      strongProblems: topicProblems.filter((problem) => problem.status === "strong").length,
      basicProblems: topicProblems.filter((problem) => problem.status === "basic").length,
      weakProblems: topicProblems.filter((problem) => problem.status === "weak").length,
      missingProblems: topicProblems.filter((problem) => problem.status === "missing").length
    };
  });

  const totalProblems = problems.length;
  const executableProblems = problems.filter((problem) => problem.effectiveCount > 0).length;
  const hiddenProblems = problems.filter((problem) => problem.hiddenCount > 0).length;

  return {
    totalProblems,
    configuredProblems: problems.filter((problem) => problem.source === "configured").length,
    curatedProblems: problems.filter((problem) => problem.source === "curated").length,
    exampleOnlyProblems: problems.filter((problem) => problem.source === "examples").length,
    executableProblems,
    hiddenProblems,
    strongProblems: problems.filter((problem) => problem.status === "strong").length,
    basicProblems: problems.filter((problem) => problem.status === "basic").length,
    weakProblems: problems.filter((problem) => problem.status === "weak").length,
    missingProblems: problems.filter((problem) => problem.status === "missing").length,
    executableCoverage: totalProblems ? executableProblems / totalProblems : 0,
    hiddenCoverage: totalProblems ? hiddenProblems / totalProblems : 0,
    topics,
    problems
  };
}

export function testCaseCoverageMeetsReleaseFloor(report: TestCaseCoverageReport): boolean {
  return (
    report.executableCoverage >= testCaseReleaseFloor.executableCoverage &&
    report.hiddenCoverage >= testCaseReleaseFloor.hiddenCoverage &&
    report.missingProblems <= testCaseReleaseFloor.missingProblems
  );
}
