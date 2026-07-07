import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { getTopicProblems, createInitialProgress, createInitialSkillProfile } = require("../dist/services/storage.js");
const { recommendAfterSubmission } = require("../dist/services/recommendation.js");

function makeSignals(overrides = {}) {
  return {
    usesAnd: false,
    usesOr: false,
    usesXor: false,
    usesLeftShift: false,
    usesRightShift: false,
    usesNot: false,
    usesPowerOfTwoPattern: false,
    usesStringConversion: false,
    usesModuloDivision: false,
    hasUnnecessaryLoop: false,
    hasHardcoding: false,
    hasPoorVariableNames: false,
    missingEdgeCaseHandling: false,
    hasRecursiveCall: true,
    hasBaseCase: true,
    hasMultipleRecursiveCalls: false,
    usesMemoization: false,
    usesBacktrackingUndo: false,
    usesDivideAndConquer: false,
    missingRecursiveProgress: false,
    usesArrayTraversal: false,
    usesSorting: false,
    usesHashMap: false,
    usesPrefixSum: false,
    usesTwoPointers: false,
    usesSlidingWindow: false,
    usesLinkedListTraversal: false,
    usesHeadUpdate: false,
    usesNodeDeletion: false,
    usesLinkedListReverse: false,
    usesFastSlowPointers: false,
    usesDummyNode: false,
    usesStackStructure: false,
    usesPushPop: false,
    usesMonotonicStack: false,
    usesParenthesisMatching: false,
    usesExpressionConversion: false,
    usesMinStackPattern: false,
    usesQueueStructure: false,
    usesEnqueueDequeue: false,
    usesCircularQueuePattern: false,
    usesDequeWindowPattern: false,
    usesBfsStyleQueue: false,
    usesPriorityQueue: false,
    usesBinarySearch: false,
    usesLowerUpperBoundPattern: false,
    usesAnswerBinarySearch: false,
    usesSortedMidCheck: false,
    usesPartitionBinarySearch: false,
    usesTreeNodePattern: false,
    usesRecursiveTraversal: false,
    usesQueueTraversal: false,
    usesBstLogic: false,
    usesTreeConstruction: false,
    usesLcaPattern: false,
    usesGraphAdjacency: false,
    usesGraphTraversal: false,
    usesTopologicalSort: false,
    usesShortestPath: false,
    usesDisjointSet: false,
    usesMstLogic: false,
    usesMemoTable: false,
    usesBottomUpDp: false,
    usesStateTransition: false,
    usesSpaceOptimization: false,
    usesKnapsackPattern: false,
    usesIntervalDp: false,
    ...overrides
  };
}

function analysisFor(problem) {
  const byProblemId = {
    "rec-013": makeSignals({ hasMultipleRecursiveCalls: true, usesBacktrackingUndo: true }),
    "rec-014": makeSignals({ hasMultipleRecursiveCalls: true, usesBacktrackingUndo: true }),
    "rec-015": makeSignals({ hasMultipleRecursiveCalls: true, usesBacktrackingUndo: true }),
    "rec-016": makeSignals({ hasMultipleRecursiveCalls: true, usesBacktrackingUndo: true }),
    "rec-017": makeSignals({ hasMultipleRecursiveCalls: true }),
    "rec-018": makeSignals({}),
    "rec-019": makeSignals({ hasMultipleRecursiveCalls: true, usesMemoization: true }),
    "rec-020": makeSignals({ hasMultipleRecursiveCalls: true, usesMemoization: true }),
    "rec-021": makeSignals({ hasMultipleRecursiveCalls: true, usesDivideAndConquer: true }),
    "rec-022": makeSignals({ hasMultipleRecursiveCalls: true, usesDivideAndConquer: true }),
    "rec-023": makeSignals({ usesBacktrackingUndo: true }),
    "rec-024": makeSignals({ hasMultipleRecursiveCalls: true, usesBacktrackingUndo: true })
  };

  return {
    detected: [],
    warnings: [],
    signals: byProblemId[problem.id] ?? makeSignals()
  };
}

function buildProgressAndSkill(problems, solvedUntilIndex) {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  for (let index = 0; index <= solvedUntilIndex; index += 1) {
    const problem = problems[index];
    progress.problems[problem.id] = {
      problemId: problem.id,
      status: "solved",
      attempts: 1,
      bestScore: 92
    };

    for (const conceptId of [...problem.expectedConcepts, ...problem.prerequisiteConcepts]) {
      skillProfile.conceptScores[conceptId] = Math.max(skillProfile.conceptScores[conceptId] ?? 0, 85);
      skillProfile.conceptStrongHits[conceptId] = Math.max(skillProfile.conceptStrongHits[conceptId] ?? 0, 3);
    }
  }

  skillProfile.strongConcepts = Object.keys(skillProfile.conceptStrongHits).filter(
    (conceptId) => (skillProfile.conceptStrongHits[conceptId] ?? 0) >= 3
  );

  return { progress, skillProfile };
}

function main() {
  const problems = getTopicProblems("recursion");
  const rows = [];

  for (let index = 0; index < problems.length - 1; index += 1) {
    const problem = problems[index];
    const expectedNext = problems[index + 1];
    const { progress, skillProfile } = buildProgressAndSkill(problems, index);
    const recommendation = recommendAfterSubmission(
      problem,
      problems,
      progress,
      skillProfile,
      {
        finalScore: 92,
        conceptMatchScore: 100,
        qualityScore: 85,
        complexityScore: 90
      },
      analysisFor(problem)
    );

    rows.push({
      current: problem.id,
      currentTitle: problem.title,
      expectedNext: expectedNext.id,
      recommendedNext: recommendation.problem?.id ?? "(none)",
      match: recommendation.problem?.id === expectedNext.id ? "PASS" : "REVIEW"
    });
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const docsDir = path.resolve(scriptDir, "..", "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  const reportPath = path.join(docsDir, "recursion-progression-audit.md");

  const passCount = rows.filter((row) => row.match === "PASS").length;
  const lines = [
    "# Recursion Progression Audit",
    "",
    `Passes: ${passCount}/${rows.length}`,
    "",
    "| Current | Expected Next | Recommended Next | Status |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.current} - ${row.currentTitle} | ${row.expectedNext} | ${row.recommendedNext} | ${row.match} |`)
  ];

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote recursion progression audit to ${reportPath}`);
  console.log(`Passes: ${passCount}/${rows.length}`);
}

main();
