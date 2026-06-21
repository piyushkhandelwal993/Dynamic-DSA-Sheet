import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeBinarySearchJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 2 && !hasFact(facts, "answer-space-search"),
    hasHardcoding: hasFact(facts, "hardcoded-output") && !hasFact(facts, "binary-search"),
    missingEdgeCaseHandling: !hasFact(facts, "empty-or-null-check") && !/(left\s*>\s*right|low\s*>\s*high)/.test(content),
    usesBinarySearch: hasFact(facts, "binary-search"),
    usesLowerUpperBoundPattern: hasFact(facts, "lower-upper-bound"),
    usesAnswerBinarySearch: hasFact(facts, "answer-space-search"),
    usesSortedMidCheck: hasFact(facts, "sorted-mid-check"),
    usesPartitionBinarySearch: hasFact(facts, "partition-binary-search")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "ans", "temp"].includes(name) && variableNames.length > 3);

  if (signals.usesBinarySearch) detected.push("Used binary-search loop");
  if (signals.usesLowerUpperBoundPattern) detected.push("Tracked boundary answer for lower/upper bound style search");
  if (signals.usesAnswerBinarySearch) detected.push("Used answer-space binary search");
  if (signals.usesPartitionBinarySearch) detected.push("Used partition-based binary search");
  if (signals.usesSortedMidCheck) detected.push("Compared against middle element in sorted data");

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

export function detectBinarySearchConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "binary-search-intro") return analysis.signals.usesBinarySearch;
    if (concept === "sorted-mid-check") return analysis.signals.usesSortedMidCheck || analysis.signals.usesBinarySearch;
    if (concept === "lower-bound") return analysis.signals.usesLowerUpperBoundPattern;
    if (concept === "upper-bound") return analysis.signals.usesLowerUpperBoundPattern;
    if (concept === "first-last-occurrence") return analysis.signals.usesLowerUpperBoundPattern;
    if (concept === "search-insert-position") return analysis.signals.usesLowerUpperBoundPattern || analysis.signals.usesBinarySearch;
    if (concept === "rotated-array-search") return analysis.signals.usesBinarySearch && analysis.signals.usesSortedMidCheck;
    if (concept === "peak-element") return analysis.signals.usesBinarySearch;
    if (concept === "answer-binary-search") return analysis.signals.usesAnswerBinarySearch;
    if (concept === "sqrt-binary-search") return analysis.signals.usesBinarySearch;
    if (concept === "capacity-search") return analysis.signals.usesAnswerBinarySearch;
    if (concept === "partition-binary-search") return analysis.signals.usesPartitionBinarySearch;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
