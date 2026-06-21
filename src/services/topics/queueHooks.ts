import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|char|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeQueueJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 2 && !hasFact(facts, "deque-window"),
    hasHardcoding: hasFact(facts, "hardcoded-output") && !hasFact(facts, "queue-like"),
    missingEdgeCaseHandling: !hasFact(facts, "queue-edge-check"),
    usesQueueStructure: hasFact(facts, "queue-like") || hasFact(facts, "priority-queue"),
    usesEnqueueDequeue: hasFact(facts, "queue-operations"),
    usesCircularQueuePattern: hasFact(facts, "circular-queue"),
    usesDequeWindowPattern: hasFact(facts, "deque-window"),
    usesBfsStyleQueue: hasFact(facts, "bfs-queue-processing"),
    usesPriorityQueue: hasFact(facts, "priority-queue")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "q", "ans", "temp"].includes(name) && variableNames.length > 3);

  if (signals.usesQueueStructure) detected.push("Used queue-style data structure");
  if (signals.usesEnqueueDequeue) detected.push("Used enqueue/dequeue style operations");
  if (signals.usesCircularQueuePattern) detected.push("Used circular queue index management");
  if (signals.usesDequeWindowPattern) detected.push("Used deque-based sliding window pattern");
  if (signals.usesBfsStyleQueue) detected.push("Used BFS-style queue processing");
  if (signals.usesPriorityQueue) detected.push("Used priority queue");

  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle edge cases clearly.");

  return { detected, warnings, signals };
}

function extractVariableNames(content: string): string[] {
  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  return variableNames;
}

export function detectQueueConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "queue-intro") return analysis.signals.usesQueueStructure || analysis.signals.usesEnqueueDequeue;
    if (concept === "queue-operations") return analysis.signals.usesEnqueueDequeue;
    if (concept === "array-queue-implementation") return analysis.signals.usesQueueStructure || analysis.signals.usesEnqueueDequeue;
    if (concept === "circular-queue") return analysis.signals.usesCircularQueuePattern;
    if (concept === "queue-simulation") return analysis.signals.usesEnqueueDequeue || analysis.signals.usesQueueStructure;
    if (concept === "generate-binary-numbers") return analysis.signals.usesEnqueueDequeue;
    if (concept === "bfs-on-grid") return analysis.signals.usesBfsStyleQueue;
    if (concept === "sliding-window-queue") return analysis.signals.usesDequeWindowPattern;
    if (concept === "deque-technique") return analysis.signals.usesDequeWindowPattern;
    if (concept === "top-k-elements") return analysis.signals.usesPriorityQueue;
    if (concept === "task-scheduling-queue") return analysis.signals.usesQueueStructure || analysis.signals.usesPriorityQueue;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
