import { ExecutionResult, Problem, ScoreBreakdown } from "../../types";
import { CodeFacts, hasFact } from "./facts";
import { ProblemExpectationResult } from "./matcher";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const scorers: Record<
    string,
    (problem: Problem, facts: CodeFacts, expectation: ProblemExpectationResult, execution?: ExecutionResult) => ScoreBreakdown
  > = {
    "Bit Manipulation": scoreBitSubmissionFromFacts,
    Arrays: scoreArraySubmissionFromFacts,
    Stack: scoreStackSubmissionFromFacts,
    "Linked List": scoreLinkedListSubmissionFromFacts,
    Queue: scoreQueueSubmissionFromFacts,
    "Binary Search": scoreBinarySearchSubmissionFromFacts,
    Trees: scoreTreeSubmissionFromFacts,
    Graphs: scoreGraphSubmissionFromFacts,
    "Dynamic Programming": scoreDpSubmissionFromFacts,
    Recursion: scoreRecursionSubmissionFromFacts
  };
  const scorer = scorers[problem.topic];
  if (!scorer) {
    throw new Error(`Facts-native scoring is not implemented for topic: ${problem.topic}`);
  }
  return scorer(problem, facts, expectation, execution);
}

export function scoreBitSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasBitEvidence = [
    "bitwise-and",
    "bitwise-or",
    "bitwise-xor",
    "left-shift",
    "right-shift",
    "bitwise-not",
    "clear-lowest-set-bit",
    "binary-string-conversion",
    "modulo-division-by-two"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasBitEvidence;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 45;
  } else if (!execution?.usedTestCases && hasFact(facts, "binary-string-conversion") && problem.expectedComplexity === "O(1)") {
    correctnessScore = 55;
  } else if (!execution?.usedTestCases && facts.metrics.loopCount > 0 && problem.expectedComplexity === "O(1)") {
    correctnessScore = 60;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output") || hasFact(facts, "bit-hardcoding")) qualityScore -= 15;
  if (facts.metrics.loopCount > 0 && problem.expectedComplexity === "O(1)") qualityScore -= 10;
  if (!hasFact(facts, "bit-edge-check")) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 85;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (
    problem.expectedComplexity === "O(1)" &&
    (facts.metrics.loopCount > 0 || hasFact(facts, "binary-string-conversion") || hasFact(facts, "modulo-division-by-two"))
  ) {
    complexityScore = 45;
  } else if (problem.expectedComplexity.includes("log") && hasFact(facts, "binary-string-conversion")) {
    complexityScore = 65;
  } else if (conceptMatchScore === 100) {
    complexityScore = 90;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreArraySubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasArrayEvidence = ["array", "array-traversal", "indexed-access"].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasArrayEvidence;
  const hasQuadraticWork =
    (hasFact(facts, "quadratic-candidate") || facts.metrics.nestedLoopDepth >= 2) &&
    !hasFact(facts, "linear-amortized");
  const usesUnnecessarySorting =
    hasFact(facts, "sorting") &&
    !problem.expectedConcepts.some((concept) => concept === "frequency-counting");

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "empty-or-null-check")) qualityScore -= 5;
  if (hasQuadraticWork) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (hasQuadraticWork && problem.expectedComplexity === "O(n)") {
    complexityScore = 35;
  } else if (usesUnnecessarySorting && problem.expectedComplexity === "O(n)") {
    complexityScore = 55;
  } else if (conceptMatchScore === 100 && (hasFact(facts, "single-pass") || hasFact(facts, "linear-amortized"))) {
    complexityScore = 92;
  } else if (conceptMatchScore === 100) {
    complexityScore = 88;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreStackSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasStackEvidence = ["stack-like", "stack-array-implementation", "stack-operations"].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasStackEvidence;
  const amortizedLinear = hasFact(facts, "linear-amortized") || hasFact(facts, "monotonic-stack");
  const hasQuadraticWork =
    (hasFact(facts, "quadratic-candidate") || facts.metrics.nestedLoopDepth >= 2) &&
    !amortizedLinear;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "empty-or-null-check") && !hasFact(facts, "queue-edge-check")) qualityScore -= 5;
  if (hasQuadraticWork) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (hasQuadraticWork && problem.expectedComplexity.includes("O(n")) {
    complexityScore = 35;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("monotonic-stack") && !hasFact(facts, "monotonic-stack")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("min-stack") && !hasFact(facts, "min-stack")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("stack-array-implementation") && !hasFact(facts, "stack-array-implementation")) {
    complexityScore = 50;
  } else if (conceptMatchScore === 100 && (amortizedLinear || hasFact(facts, "single-pass"))) {
    complexityScore = 92;
  } else if (conceptMatchScore === 100) {
    complexityScore = 88;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreLinkedListSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasListEvidence = [
    "linked-list-traversal",
    "head-tail-update",
    "node-deletion",
    "linked-list-reversal",
    "fast-slow-pointers",
    "dummy-node"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasListEvidence;
  const hasQuadraticWork = hasFact(facts, "quadratic-candidate") || facts.metrics.nestedLoopDepth >= 2;
  const constantTimeExpected = problem.expectedComplexity === "O(1)";

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "linked-list-edge-check")) qualityScore -= 10;
  if (hasQuadraticWork) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (hasQuadraticWork && problem.expectedComplexity.includes("O(n")) {
    complexityScore = 35;
  } else if (constantTimeExpected && facts.metrics.loopCount > 0) {
    complexityScore = 45;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("ll-fast-slow") && !hasFact(facts, "fast-slow-pointers")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("ll-merge-sorted") && !hasFact(facts, "merge-sorted-linked-lists")) {
    complexityScore = 50;
  } else if (conceptMatchScore === 100 && (hasFact(facts, "single-pass") || hasFact(facts, "fast-slow-pointers"))) {
    complexityScore = 92;
  } else if (conceptMatchScore === 100) {
    complexityScore = 88;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreQueueSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasQueueEvidence = [
    "queue-like",
    "priority-queue",
    "queue-operations",
    "array-queue-implementation",
    "circular-queue",
    "deque-window"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasQueueEvidence;
  const amortizedLinear = hasFact(facts, "linear-amortized") || hasFact(facts, "deque-window");
  const hasQuadraticWork =
    (hasFact(facts, "quadratic-candidate") || facts.metrics.nestedLoopDepth >= 2) &&
    !amortizedLinear &&
    problem.expectedComplexity !== "O(n * m)";
  const constantTimeExpected = problem.expectedComplexity === "O(1)";

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "queue-edge-check")) qualityScore -= 5;
  if (hasQuadraticWork) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (hasQuadraticWork && problem.expectedComplexity.includes("O(n")) {
    complexityScore = 35;
  } else if (constantTimeExpected && facts.metrics.loopCount > 0) {
    complexityScore = 45;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("deque-technique") && !hasFact(facts, "deque-window")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("top-k-elements") && !hasFact(facts, "bounded-priority-queue")) {
    complexityScore = 50;
  } else if (problem.expectedConcepts.includes("bfs-on-grid") && !hasFact(facts, "bfs-grid-processing")) {
    complexityScore = 50;
  } else if (conceptMatchScore === 100 && (amortizedLinear || hasFact(facts, "single-pass"))) {
    complexityScore = 92;
  } else if (conceptMatchScore === 100) {
    complexityScore = 88;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreBinarySearchSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasSearchEvidence = [
    "binary-search",
    "lower-bound-search",
    "answer-space-search",
    "partition-binary-search"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasSearchEvidence;
  const usesLinearScan = facts.metrics.loopCount > 0 && !hasFact(facts, "logarithmic-search");
  const hasQuadraticWork = hasFact(facts, "quadratic-candidate") || facts.metrics.nestedLoopDepth >= 2;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "empty-or-null-check")) qualityScore -= 5;
  if (usesLinearScan || hasQuadraticWork) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (hasQuadraticWork) {
    complexityScore = 25;
  } else if (usesLinearScan && problem.expectedComplexity.includes("log")) {
    complexityScore = 35;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("answer-binary-search") && !hasFact(facts, "answer-space-search")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("partition-binary-search") && !hasFact(facts, "partition-binary-search")) {
    complexityScore = 45;
  } else if (conceptMatchScore === 100 && hasFact(facts, "logarithmic-search")) {
    complexityScore = 94;
  } else if (conceptMatchScore === 100) {
    complexityScore = 88;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreTreeSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasTreeEvidence = [
    "tree-node",
    "recursive-tree-traversal",
    "level-order-tree-traversal",
    "bst-logic",
    "tree-construction",
    "lowest-common-ancestor"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasTreeEvidence;
  const hasQuadraticWork = hasFact(facts, "quadratic-candidate") || hasFact(facts, "repeated-tree-height");
  const bstPathExpected = problem.expectedComplexity === "O(h)";
  const traversesWholeTree = hasFact(facts, "recursive-tree-traversal") && !hasFact(facts, "bst-search") && !hasFact(facts, "bst-mutation");

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "tree-edge-check")) qualityScore -= 10;
  if (hasQuadraticWork) qualityScore -= 15;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (hasQuadraticWork && problem.expectedComplexity === "O(n)") {
    complexityScore = 35;
  } else if (bstPathExpected && traversesWholeTree) {
    complexityScore = 45;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("level-order-traversal") && !hasFact(facts, "level-order-tree-traversal")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("tree-construction") && !hasFact(facts, "tree-construction")) {
    complexityScore = 45;
  } else if (conceptMatchScore === 100 && !hasQuadraticWork) {
    complexityScore = 92;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreGraphSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasGraphEvidence = [
    "graph-adjacency",
    "graph-traversal",
    "topological-sort",
    "shortest-path-relaxation",
    "disjoint-set-union",
    "minimum-spanning-tree"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasGraphEvidence;
  const wrongShortestPathTraversal =
    problem.expectedConcepts.includes("shortest-path-unweighted") &&
    !problem.expectedConcepts.includes("dijkstra") &&
    hasFact(facts, "graph-dfs") &&
    !hasFact(facts, "graph-bfs");

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) correctnessScore = 0;
  else if (!execution?.usedTestCases && noConceptEvidence) correctnessScore = 20;
  else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) correctnessScore = 35;

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "graph-edge-check")) qualityScore -= 5;
  if (wrongShortestPathTraversal) qualityScore -= 15;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (wrongShortestPathTraversal) {
    complexityScore = 35;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("dijkstra") && !hasFact(facts, "dijkstra")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("union-find") && !hasFact(facts, "disjoint-set-union")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("mst") && !hasFact(facts, "minimum-spanning-tree")) {
    complexityScore = 45;
  } else if (conceptMatchScore === 100) {
    complexityScore = 92;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreDpSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const hasDpEvidence = [
    "dp-memoization",
    "bottom-up-dp",
    "dp-state-transition",
    "grid-dp",
    "knapsack-dp",
    "sequence-dp",
    "string-dp",
    "interval-dp"
  ].some((id) => hasFact(facts, id));
  const noConceptEvidence = !hasConceptEvidence && !hasDpEvidence;
  const usesExponentialRecursion = hasFact(facts, "exponential-dp-recursion");

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) correctnessScore = 0;
  else if (!execution?.usedTestCases && noConceptEvidence) correctnessScore = 20;
  else if (!execution?.usedTestCases && hasFact(facts, "hardcoded-output")) correctnessScore = 35;

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 20;
  if (!hasFact(facts, "dp-edge-check")) qualityScore -= 5;
  if (usesExponentialRecursion) qualityScore -= 20;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (usesExponentialRecursion) {
    complexityScore = 25;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("space-optimization") && !hasFact(facts, "dp-space-optimization")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("knapsack-dp") && !hasFact(facts, "knapsack-dp")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("lis-dp") && !hasFact(facts, "sequence-dp")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("string-dp") && !hasFact(facts, "string-dp")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("interval-dp") && !hasFact(facts, "interval-dp")) {
    complexityScore = 45;
  } else if (conceptMatchScore === 100) {
    complexityScore = hasFact(facts, "reduced-dp-space") ? 95 : 92;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 35);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}

export function scoreRecursionSubmissionFromFacts(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const hasRecursion = hasFact(facts, "recursive-call");
  const hasBaseCase = hasFact(facts, "base-case");
  const hasConceptEvidence = expectation.matches.some((match) => match.matched);
  const noConceptEvidence = !hasConceptEvidence && !hasRecursion;
  const missingProgress = hasFact(facts, "missing-recursive-progress");

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) correctnessScore = 0;
  else if (!execution?.usedTestCases && noConceptEvidence) correctnessScore = 15;
  else if (!execution?.usedTestCases && !hasRecursion) correctnessScore = 35;
  else if (!execution?.usedTestCases && !hasBaseCase) correctnessScore = 50;
  else if (!execution?.usedTestCases && missingProgress) correctnessScore = 55;

  const conceptMatchScore = clamp(expectation.conceptMatchScore);
  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (hasFact(facts, "poor-variable-names")) qualityScore -= 15;
  if (hasFact(facts, "hardcoded-output")) qualityScore -= 15;
  if (!hasBaseCase) qualityScore -= 15;
  if (missingProgress) qualityScore -= 15;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (missingProgress) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("memoization") && !hasFact(facts, "memoization") && !hasFact(facts, "dp-memoization")) {
    complexityScore = 45;
  } else if (problem.expectedConcepts.includes("divide-and-conquer") && !hasFact(facts, "divide-and-conquer")) {
    complexityScore = 50;
  } else if (
    (problem.expectedConcepts.includes("backtracking-basics") || problem.expectedConcepts.includes("permutations")) &&
    !hasFact(facts, "backtracking-undo")
  ) {
    complexityScore = 50;
  } else if (conceptMatchScore === 100) {
    complexityScore = 90;
  } else if (conceptMatchScore < 50) {
    complexityScore = 55;
  }

  const weighted = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;
  let finalScore = clamp(weighted);
  if (execution?.usedTestCases && !execution.compileSucceeded) finalScore = Math.min(finalScore, 20);
  else if (execution?.usedTestCases && execution.passedCount === 0) finalScore = Math.min(finalScore, 30);

  return { correctnessScore, conceptMatchScore, qualityScore, complexityScore, finalScore };
}
