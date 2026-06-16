import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeArraysJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const arrayAccessCount = content.match(/\[[^\]]+\]/g)?.length ?? 0;
  const prefixPatterns = /(prefix|pref)\s*\[|runningSum|sum\s*\+=\s*\w+\s*\[/;
  const twoPointerPatterns = /\b(left|right|low|high|i|j)\b[\s\S]{0,180}\b(left|right|low|high|i|j)\b/;
  const slidingWindowPatterns = /(windowSum|currSum|while\s*\(\s*sum\s*>|sum\s*-=|sum\s*\+=)/;
  const enhancedForLoop = /for\s*\(\s*(?:int|long)\s+\w+\s*:\s*\w+\s*\)/.test(content);
  const scannerDrivenLoop = /sc\.nextInt\(\)/.test(content) && loopCount > 0;
  const traversalPatterns = arrayAccessCount > 0 || enhancedForLoop || scannerDrivenLoop;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 1 && !/O\(n\)/.test(content),
    hasHardcoding: /\breturn\s+\d+\s*;/.test(content) && arrayAccessCount === 0,
    missingEdgeCaseHandling: !/(n\s*==\s*0|arr\.length\s*==\s*0|nums\.length\s*==\s*0|null)/.test(content),
    usesArrayTraversal: loopCount > 0 && traversalPatterns,
    usesSorting: /(Arrays\.sort|Collections\.sort)/.test(content),
    usesHashMap: /(HashMap|Map<|HashSet|Set<)/.test(content),
    usesPrefixSum: prefixPatterns.test(content),
    usesTwoPointers: twoPointerPatterns.test(content) && /(left\s*[+-]{2}|right\s*[+-]{2}|low\s*[+-]{2}|high\s*[+-]{2}|i\+\+.*j--|j--.*i\+\+)/s.test(content),
    usesSlidingWindow: slidingWindowPatterns.test(content) && loopCount > 0
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);

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
