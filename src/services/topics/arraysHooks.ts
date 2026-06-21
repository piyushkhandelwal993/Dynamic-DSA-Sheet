import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeArraysJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const enhancedForLoop = /for\s*\(\s*(?:int|long)\s+\w+\s*:\s*\w+\s*\)/.test(content);
  const scannerDrivenLoop = /sc\.nextInt\(\)/.test(content) && facts.metrics.loopCount > 0;
  const traversalPatterns = hasFact(facts, "array") || enhancedForLoop || scannerDrivenLoop;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 1 && !/O\(n\)/.test(content),
    hasHardcoding: hasFact(facts, "hardcoded-output"),
    missingEdgeCaseHandling: !hasFact(facts, "empty-or-null-check"),
    usesArrayTraversal: facts.metrics.loopCount > 0 && traversalPatterns,
    usesSorting: hasFact(facts, "sorting"),
    usesHashMap: hasFact(facts, "hash-map") || hasFact(facts, "hash-set"),
    usesPrefixSum: hasFact(facts, "prefix-sum"),
    usesTwoPointers: hasFact(facts, "two-pointers"),
    usesSlidingWindow: hasFact(facts, "sliding-window")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);

  if (signals.usesArrayTraversal) detected.push("Used array traversal");
  if (signals.usesSorting) detected.push("Used sorting");
  if (signals.usesHashMap) detected.push("Used HashMap/HashSet");
  if (signals.usesPrefixSum) detected.push("Used prefix-sum style accumulation");
  if (signals.usesTwoPointers) detected.push("Used two pointers");
  if (signals.usesSlidingWindow) detected.push("Used sliding window");

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

export function detectArraysConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "array-traversal") return analysis.signals.usesArrayTraversal;
    if (concept === "min-max-array") return analysis.signals.usesArrayTraversal;
    if (concept === "sorted-check") return analysis.signals.usesArrayTraversal;
    if (concept === "reverse-array") return analysis.signals.usesTwoPointers || analysis.signals.usesArrayTraversal;
    if (concept === "second-largest") return analysis.signals.usesArrayTraversal;
    if (concept === "frequency-counting") return analysis.signals.usesHashMap || analysis.signals.usesArrayTraversal;
    if (concept === "prefix-sum") return analysis.signals.usesPrefixSum;
    if (concept === "kadane-algorithm") return analysis.signals.usesArrayTraversal;
    if (concept === "two-pointers") return analysis.signals.usesTwoPointers;
    if (concept === "in-place-array-update") return analysis.signals.usesTwoPointers || analysis.signals.usesArrayTraversal;
    if (concept === "sliding-window") return analysis.signals.usesSlidingWindow;
    if (concept === "stock-profit") return analysis.signals.usesArrayTraversal;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
