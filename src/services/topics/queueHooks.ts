import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|char|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeQueueJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const queueStructurePattern = /(Queue<|Deque<|ArrayDeque<|LinkedList<|PriorityQueue<)/;
  const enqueueDequeuePattern = /\.(offer|poll|add|remove|peek|addLast|removeFirst|offerLast|pollFirst|peekFirst)\s*\(/;
  const circularQueuePattern = /(front|rear|size|capacity|count)[\s\S]{0,140}%|rear\s*=\s*\(rear\s*\+\s*1\)\s*%|front\s*=\s*\(front\s*\+\s*1\)\s*%/;
  const dequeWindowPattern = /(while\s*\(\s*!?\w+\.isEmpty\(\)\s*&&[\s\S]{0,120}(peekFirst|peekLast)\s*\(\)|removeFirst\(\)|removeLast\(\)|pollFirst\(\)|pollLast\(\))/;
  const bfsStylePattern = /(levelSize|while\s*\(\s*!?\w+\.isEmpty\(\)\s*\)|poll\(\)|offer\(\))/;
  const priorityQueuePattern = /PriorityQueue</;
  const hardcodedReturnPattern = /\breturn\s+(true|false|\d+|"[^"]*")\s*;/;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 2 && !dequeWindowPattern.test(content),
    hasHardcoding: hardcodedReturnPattern.test(content) && !queueStructurePattern.test(content),
    missingEdgeCaseHandling: !/(isEmpty\(\)|n\s*==\s*0|length\(\)\s*==\s*0|arr\.length\s*==\s*0|null|size\s*==\s*0)/.test(content),
    usesQueueStructure: queueStructurePattern.test(content),
    usesEnqueueDequeue: enqueueDequeuePattern.test(content),
    usesCircularQueuePattern: circularQueuePattern.test(content),
    usesDequeWindowPattern: dequeWindowPattern.test(content) && /(Deque<|ArrayDeque<)/.test(content),
    usesBfsStyleQueue: bfsStylePattern.test(content) && /(Queue<|Deque<|ArrayDeque<|LinkedList<)/.test(content),
    usesPriorityQueue: priorityQueuePattern.test(content)
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "q", "ans", "temp"].includes(name) && variableNames.length > 3);

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
