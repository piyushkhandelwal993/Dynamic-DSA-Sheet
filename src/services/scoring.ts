import { AnalysisResult, ExecutionResult, Problem, ScoreBreakdown } from "../types";
import { ConceptDetectionResult } from "../types";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasBitEvidence(analysis: AnalysisResult): boolean {
  return (
    analysis.signals.usesAnd ||
    analysis.signals.usesOr ||
    analysis.signals.usesXor ||
    analysis.signals.usesLeftShift ||
    analysis.signals.usesRightShift ||
    analysis.signals.usesNot ||
    analysis.signals.usesPowerOfTwoPattern ||
    analysis.signals.usesStringConversion ||
    analysis.signals.usesModuloDivision
  );
}

export function scoreSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  if (problem.topic === "Linked List") {
    return scoreLinkedListSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Arrays") {
    return scoreArraysSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Binary Search") {
    return scoreBinarySearchSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Dynamic Programming") {
    return scoreDpSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Graphs") {
    return scoreGraphSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Recursion") {
    return scoreRecursionSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Queue") {
    return scoreQueueSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Stack") {
    return scoreStackSubmission(problem, analysis, detection, execution);
  }
  if (problem.topic === "Trees") {
    return scoreTreeSubmission(problem, analysis, detection, execution);
  }

  const noConceptEvidence = detection.matchedConcepts.length === 0 && !hasBitEvidence(analysis);
  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding && !analysis.signals.usesAnd && !analysis.signals.usesXor && !analysis.signals.usesOr) {
    correctnessScore = 45;
  } else if (!execution?.usedTestCases && analysis.signals.usesStringConversion && problem.expectedComplexity === "O(1)") {
    correctnessScore = 55;
  } else if (!execution?.usedTestCases && analysis.signals.hasUnnecessaryLoop && problem.expectedComplexity === "O(1)") {
    correctnessScore = 60;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.hasUnnecessaryLoop && problem.expectedComplexity === "O(1)") qualityScore -= 10;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 85;
  const constantTimeExpected = problem.expectedComplexity === "O(1)";
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (constantTimeExpected && (analysis.signals.hasUnnecessaryLoop || analysis.signals.usesStringConversion || analysis.signals.usesModuloDivision)) {
    complexityScore = 45;
  } else if (problem.expectedComplexity.includes("log") && analysis.signals.usesStringConversion) {
    complexityScore = 65;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 90;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreStackSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesStackStructure &&
    !analysis.signals.usesPushPop &&
    !analysis.signals.usesMonotonicStack &&
    !analysis.signals.usesParenthesisMatching &&
    !analysis.signals.usesExpressionConversion &&
    !analysis.signals.usesMinStackPattern;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("monotonic-stack") && !analysis.signals.usesMonotonicStack) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("stock-span") && !analysis.signals.usesMonotonicStack) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("next-greater-element") && !analysis.signals.usesMonotonicStack) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("balanced-parentheses") && !analysis.signals.usesParenthesisMatching) {
    complexityScore = 60;
  } else if (problem.expectedConcepts.includes("expression-conversion") && !analysis.signals.usesExpressionConversion) {
    complexityScore = 60;
  } else if (problem.expectedConcepts.includes("min-stack") && !analysis.signals.usesMinStackPattern) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreTreeSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesTreeNodePattern &&
    !analysis.signals.usesRecursiveTraversal &&
    !analysis.signals.usesQueueTraversal &&
    !analysis.signals.usesBstLogic &&
    !analysis.signals.usesTreeConstruction &&
    !analysis.signals.usesLcaPattern;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("level-order-traversal") && !analysis.signals.usesQueueTraversal) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("bst-search") && !analysis.signals.usesBstLogic) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("bst-insert-delete") && !analysis.signals.usesBstLogic) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("tree-construction") && !analysis.signals.usesTreeConstruction) {
    complexityScore = 60;
  } else if (problem.expectedConcepts.includes("lca-binary-tree") && !analysis.signals.usesLcaPattern) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreQueueSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesQueueStructure &&
    !analysis.signals.usesEnqueueDequeue &&
    !analysis.signals.usesCircularQueuePattern &&
    !analysis.signals.usesDequeWindowPattern &&
    !analysis.signals.usesBfsStyleQueue &&
    !analysis.signals.usesPriorityQueue;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("circular-queue") && !analysis.signals.usesCircularQueuePattern) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("sliding-window-queue") && !analysis.signals.usesDequeWindowPattern) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("deque-technique") && !analysis.signals.usesDequeWindowPattern) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("bfs-on-grid") && !analysis.signals.usesBfsStyleQueue) {
    complexityScore = 60;
  } else if (problem.expectedConcepts.includes("top-k-elements") && !analysis.signals.usesPriorityQueue) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreBinarySearchSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesBinarySearch &&
    !analysis.signals.usesLowerUpperBoundPattern &&
    !analysis.signals.usesAnswerBinarySearch &&
    !analysis.signals.usesSortedMidCheck &&
    !analysis.signals.usesPartitionBinarySearch;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("lower-bound") && !analysis.signals.usesLowerUpperBoundPattern) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("upper-bound") && !analysis.signals.usesLowerUpperBoundPattern) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("answer-binary-search") && !analysis.signals.usesAnswerBinarySearch) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("capacity-search") && !analysis.signals.usesAnswerBinarySearch) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("partition-binary-search") && !analysis.signals.usesPartitionBinarySearch) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreGraphSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesGraphAdjacency &&
    !analysis.signals.usesGraphTraversal &&
    !analysis.signals.usesTopologicalSort &&
    !analysis.signals.usesShortestPath &&
    !analysis.signals.usesDisjointSet &&
    !analysis.signals.usesMstLogic;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("topological-sort") && !analysis.signals.usesTopologicalSort) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("dijkstra") && !analysis.signals.usesShortestPath) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("union-find") && !analysis.signals.usesDisjointSet) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("mst") && !analysis.signals.usesMstLogic) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("grid-bfs") && !analysis.signals.usesGraphTraversal) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreDpSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesMemoTable &&
    !analysis.signals.usesBottomUpDp &&
    !analysis.signals.usesStateTransition &&
    !analysis.signals.usesSpaceOptimization &&
    !analysis.signals.usesKnapsackPattern &&
    !analysis.signals.usesIntervalDp;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("memoization") && !analysis.signals.usesMemoTable) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("tabulation") && !analysis.signals.usesBottomUpDp) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("space-optimization") && !analysis.signals.usesSpaceOptimization) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("knapsack-dp") && !analysis.signals.usesKnapsackPattern) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("interval-dp") && !analysis.signals.usesIntervalDp) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreLinkedListSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesLinkedListTraversal &&
    !analysis.signals.usesHeadUpdate &&
    !analysis.signals.usesNodeDeletion &&
    !analysis.signals.usesLinkedListReverse &&
    !analysis.signals.usesFastSlowPointers &&
    !analysis.signals.usesDummyNode;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("ll-fast-slow") && !analysis.signals.usesFastSlowPointers) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("ll-middle") && !analysis.signals.usesFastSlowPointers) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("ll-merge-sorted") && !analysis.signals.usesDummyNode) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreArraysSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence =
    detection.matchedConcepts.length === 0 &&
    !analysis.signals.usesArrayTraversal &&
    !analysis.signals.usesPrefixSum &&
    !analysis.signals.usesTwoPointers &&
    !analysis.signals.usesSlidingWindow &&
    !analysis.signals.usesHashMap &&
    !analysis.signals.usesSorting;

  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 20;
  } else if (!execution?.usedTestCases && analysis.signals.hasHardcoding) {
    correctnessScore = 35;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 15;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("prefix-sum") && !analysis.signals.usesPrefixSum) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("two-pointers") && !analysis.signals.usesTwoPointers) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("sliding-window") && !analysis.signals.usesSlidingWindow) {
    complexityScore = 55;
  } else if (problem.expectedConcepts.includes("frequency-counting") && !analysis.signals.usesHashMap) {
    complexityScore = 60;
  } else if (detection.matchedConcepts.length === problem.expectedConcepts.length) {
    complexityScore = 88;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 35);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}

function scoreRecursionSubmission(
  problem: Problem,
  analysis: AnalysisResult,
  detection: ConceptDetectionResult,
  execution?: ExecutionResult
): ScoreBreakdown {
  const noConceptEvidence = detection.matchedConcepts.length === 0 && !analysis.signals.hasRecursiveCall && !analysis.signals.hasBaseCase;
  let correctnessScore = execution?.usedTestCases
    ? clamp((execution.passedCount / Math.max(execution.totalCount, 1)) * 100)
    : 70;
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    correctnessScore = 0;
  } else if (!execution?.usedTestCases && noConceptEvidence) {
    correctnessScore = 15;
  } else if (!execution?.usedTestCases && !analysis.signals.hasRecursiveCall) {
    correctnessScore = 35;
  } else if (!execution?.usedTestCases && !analysis.signals.hasBaseCase) {
    correctnessScore = 50;
  } else if (!execution?.usedTestCases && analysis.signals.missingRecursiveProgress) {
    correctnessScore = 55;
  }

  const conceptMatchScore = clamp((detection.matchedConcepts.length / problem.expectedConcepts.length) * 100);

  let qualityScore = 85;
  if (noConceptEvidence) qualityScore -= 20;
  if (execution?.usedTestCases && !execution.compileSucceeded) qualityScore -= 15;
  if (analysis.signals.hasPoorVariableNames) qualityScore -= 15;
  if (analysis.signals.hasHardcoding) qualityScore -= 10;
  if (analysis.signals.missingEdgeCaseHandling) qualityScore -= 10;
  if (!analysis.signals.hasBaseCase) qualityScore -= 15;
  if (analysis.signals.missingRecursiveProgress) qualityScore -= 10;
  qualityScore = clamp(qualityScore);

  let complexityScore = 80;
  if (!execution?.usedTestCases && noConceptEvidence) {
    complexityScore = 25;
  } else if (problem.expectedConcepts.includes("memoization")) {
    complexityScore = analysis.signals.usesMemoization ? 90 : 45;
  } else if (problem.expectedConcepts.includes("divide-and-conquer")) {
    complexityScore = analysis.signals.usesDivideAndConquer ? 90 : 55;
  } else if (problem.expectedConcepts.includes("backtracking-basics") || problem.expectedConcepts.includes("permutations")) {
    complexityScore = analysis.signals.usesBacktrackingUndo ? 85 : 55;
  } else if (analysis.signals.hasRecursiveCall && analysis.signals.hasBaseCase) {
    complexityScore = 85;
  }

  const finalWeights = execution?.usedTestCases
    ? correctnessScore * 0.55 + conceptMatchScore * 0.2 + qualityScore * 0.15 + complexityScore * 0.1
    : correctnessScore * 0.4 + conceptMatchScore * 0.3 + qualityScore * 0.2 + complexityScore * 0.1;

  let finalScore = clamp(finalWeights);
  if (execution?.usedTestCases && !execution.compileSucceeded) {
    finalScore = Math.min(finalScore, 20);
  } else if (execution?.usedTestCases && execution.passedCount === 0) {
    finalScore = Math.min(finalScore, 30);
  }

  return {
    correctnessScore,
    conceptMatchScore,
    qualityScore,
    complexityScore,
    finalScore
  };
}
