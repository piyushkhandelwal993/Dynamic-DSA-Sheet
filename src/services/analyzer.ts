import fs from "fs";
import { AnalysisResult, Problem, ProgrammingLanguage } from "../types";
import { analyzeCodeFacts } from "./analysis-engine/analyzeCode";
import { CodeFacts, hasFact } from "./analysis-engine/facts";
import { createEmptyAnalysisResult } from "./analysisUtils";
import { analyzeBitJavaContent } from "./topics/bitManipulationHooks";
import { analyzeRecursionJavaContent } from "./topics/recursionHooks";
import { analyzeJavaContentForProblem } from "./topicHooks";

export function analyzeJavaFile(filePath: string): AnalysisResult {
  const content = fs.readFileSync(filePath, "utf-8");
  return analyzeBitJavaContent(content);
}

export function analyzeJavaFileForProblem(problem: Problem, filePath: string): AnalysisResult {
  const content = fs.readFileSync(filePath, "utf-8");
  return analyzeJavaContentForProblem(problem, content);
}

export function analyzeJavaContent(content: string): AnalysisResult {
  return analyzeBitJavaContent(content);
}

export function analyzeRecursionContent(content: string): AnalysisResult {
  return analyzeRecursionJavaContent(content);
}

export function analyzeFileForProblem(problem: Problem, filePath: string, language: ProgrammingLanguage): AnalysisResult {
  if (language === "java") {
    return analyzeJavaFileForProblem(problem, filePath);
  }
  return analysisResultFromFacts(problem, analyzeCodeFacts(language, fs.readFileSync(filePath, "utf-8")));
}

function analysisResultFromFacts(problem: Problem, facts: CodeFacts): AnalysisResult {
  const result = createEmptyAnalysisResult();
  const edgeFactByTopic: Record<string, string> = {
    "Bit Manipulation": "bit-edge-check",
    Arrays: "empty-or-null-check",
    "Binary Search": "empty-or-null-check",
    Recursion: "recursive-base-case",
    "Linked List": "linked-list-edge-check",
    Stack: "empty-or-null-check",
    Queue: "queue-edge-check",
    Trees: "tree-edge-check",
    Graphs: "graph-edge-check",
    "Dynamic Programming": "dp-edge-check"
  };

  result.signals = {
    ...result.signals,
    usesAnd: hasFact(facts, "bitwise-and"),
    usesOr: hasFact(facts, "bitwise-or"),
    usesXor: hasFact(facts, "bitwise-xor"),
    usesLeftShift: hasFact(facts, "left-shift"),
    usesRightShift: hasFact(facts, "right-shift"),
    usesNot: hasFact(facts, "bitwise-not"),
    usesPowerOfTwoPattern: hasFact(facts, "clear-lowest-set-bit"),
    usesStringConversion: hasFact(facts, "binary-string-conversion"),
    usesModuloDivision: hasFact(facts, "modulo-division-by-two"),
    hasUnnecessaryLoop: problem.expectedComplexity === "O(1)" && facts.metrics.loopCount > 0,
    hasHardcoding: hasFact(facts, "hardcoded-output") || hasFact(facts, "bit-hardcoding"),
    hasPoorVariableNames: hasFact(facts, "poor-variable-names"),
    missingEdgeCaseHandling: !hasFact(facts, edgeFactByTopic[problem.topic] ?? "empty-or-null-check"),
    hasRecursiveCall: hasFact(facts, "recursive-call"),
    hasBaseCase: hasFact(facts, "base-case"),
    hasMultipleRecursiveCalls: hasFact(facts, "multiple-recursive-calls"),
    usesMemoization: hasFact(facts, "memoization"),
    usesBacktrackingUndo: hasFact(facts, "backtracking-undo"),
    usesDivideAndConquer: hasFact(facts, "divide-and-conquer"),
    missingRecursiveProgress: hasFact(facts, "missing-recursive-progress"),
    usesArrayTraversal: hasFact(facts, "array") && hasFact(facts, "loop"),
    usesSorting: hasFact(facts, "sorting"),
    usesHashMap: hasFact(facts, "hash-map"),
    usesPrefixSum: hasFact(facts, "prefix-sum"),
    usesTwoPointers: hasFact(facts, "two-pointers"),
    usesSlidingWindow: hasFact(facts, "sliding-window"),
    usesLinkedListTraversal: hasFact(facts, "linked-list-traversal"),
    usesHeadUpdate: hasFact(facts, "head-update"),
    usesNodeDeletion: hasFact(facts, "node-deletion"),
    usesLinkedListReverse: hasFact(facts, "linked-list-reversal"),
    usesFastSlowPointers: hasFact(facts, "fast-slow-pointers"),
    usesDummyNode: hasFact(facts, "dummy-node"),
    usesStackStructure: hasFact(facts, "stack-like"),
    usesPushPop: hasFact(facts, "stack-operations"),
    usesMonotonicStack: hasFact(facts, "monotonic-stack"),
    usesParenthesisMatching: hasFact(facts, "parenthesis-matching"),
    usesExpressionConversion: hasFact(facts, "expression-conversion"),
    usesMinStackPattern: hasFact(facts, "min-stack"),
    usesQueueStructure: hasFact(facts, "queue-like") || hasFact(facts, "priority-queue"),
    usesEnqueueDequeue: hasFact(facts, "queue-operations"),
    usesCircularQueuePattern: hasFact(facts, "circular-queue"),
    usesDequeWindowPattern: hasFact(facts, "deque-window"),
    usesBfsStyleQueue: hasFact(facts, "bfs-queue-processing"),
    usesPriorityQueue: hasFact(facts, "priority-queue"),
    usesBinarySearch: hasFact(facts, "binary-search"),
    usesLowerUpperBoundPattern: hasFact(facts, "lower-upper-bound"),
    usesAnswerBinarySearch: hasFact(facts, "answer-space-search"),
    usesSortedMidCheck: hasFact(facts, "sorted-mid-check"),
    usesPartitionBinarySearch: hasFact(facts, "partition-binary-search"),
    usesTreeNodePattern: hasFact(facts, "tree-node"),
    usesRecursiveTraversal: hasFact(facts, "recursive-tree-traversal"),
    usesQueueTraversal: hasFact(facts, "level-order-tree-traversal"),
    usesBstLogic: hasFact(facts, "bst-logic"),
    usesTreeConstruction: hasFact(facts, "tree-construction"),
    usesLcaPattern: hasFact(facts, "lowest-common-ancestor"),
    usesGraphAdjacency: hasFact(facts, "graph-adjacency"),
    usesGraphTraversal: hasFact(facts, "graph-traversal"),
    usesTopologicalSort: hasFact(facts, "topological-sort"),
    usesShortestPath: hasFact(facts, "shortest-path-relaxation"),
    usesDisjointSet: hasFact(facts, "disjoint-set-union"),
    usesMstLogic: hasFact(facts, "minimum-spanning-tree"),
    usesMemoTable: hasFact(facts, "dp-memoization"),
    usesBottomUpDp: hasFact(facts, "bottom-up-dp"),
    usesStateTransition: hasFact(facts, "dp-state-transition"),
    usesSpaceOptimization: hasFact(facts, "dp-space-optimization"),
    usesKnapsackPattern: hasFact(facts, "knapsack-dp"),
    usesIntervalDp: hasFact(facts, "interval-dp")
  };

  const allFacts = [
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals
  ];
  result.detected = allFacts.map((fact) => fact.id.replace(/-/g, " "));
  if (result.signals.hasHardcoding) result.warnings.push("Contains hardcoded output or logic.");
  if (result.signals.hasPoorVariableNames) result.warnings.push("Variable names could be clearer.");
  if (result.signals.missingEdgeCaseHandling) result.warnings.push("Did not handle edge cases clearly.");
  return result;
}
