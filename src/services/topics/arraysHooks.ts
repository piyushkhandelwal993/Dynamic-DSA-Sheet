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
  const usesOppositeEndPointers = /\bleft\b/.test(content) && /\bright\b/.test(content) && /left\+\+/.test(content) && /right--/.test(content);
  const usesPartitionPointers = /(low|mid|high|write|read)/.test(content) && /\[[^\]]+\]\s*=/.test(content);
  const usesFixedWindow = /i\s*>=\s*k\b/.test(content) || /right\s*-\s*left\s*\+\s*1\s*==\s*k/.test(content);
  const usesVariableWindow = /while\s*\([^)]*(?:sum|zero|zeros|count|distinct)[^)]*(?:>|>=|<|<=)[^)]*\)/.test(content) || /while\s*\([^)]*\)\s*\{[\s\S]{0,160}(?:left\+\+|left\s*\+=\s*1)/.test(content);
  const usesSlidingWindowPattern = hasFact(facts, "sliding-window") || usesFixedWindow || usesVariableWindow;
  const usesWindowAuxStructure = (hasFact(facts, "queue") || /Deque|LinkedList|ArrayDeque/.test(content)) && (usesFixedWindow || usesSlidingWindowPattern);
  const usesPrefixSuffixProduct = /prefix/i.test(content) && /suffix/i.test(content) && /(product|prod)/i.test(content);
  const usesPrefixBalance = /leftSum|rightSum|totalSum/.test(content) || (/prefix/.test(content) && /total/.test(content));
  const usesModuloPrefix = (hasFact(facts, "prefix-sum") || /prefix/i.test(content) || /running/i.test(content)) && (hasFact(facts, "hash-map") || hasFact(facts, "hash-set")) && /%/.test(content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 1 && !/O\(n\)/.test(content),
    hasHardcoding: hasFact(facts, "hardcoded-output"),
    missingEdgeCaseHandling: !hasFact(facts, "empty-or-null-check"),
    usesArrayTraversal: facts.metrics.loopCount > 0 && traversalPatterns,
    usesSorting: hasFact(facts, "sorting"),
    usesHashMap: hasFact(facts, "hash-map") || hasFact(facts, "hash-set"),
    usesPrefixSum: hasFact(facts, "prefix-sum") || /prefix/i.test(content),
    usesTwoPointers: hasFact(facts, "two-pointers"),
    usesSlidingWindow: usesSlidingWindowPattern,
    usesOppositeEndPointers,
    usesPartitionPointers,
    usesFixedWindow,
    usesVariableWindow,
    usesWindowAuxStructure,
    usesPrefixSuffixProduct,
    usesPrefixBalance,
    usesModuloPrefix
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);

  if (signals.usesArrayTraversal) detected.push("Used array traversal");
  if (signals.usesSorting) detected.push("Used sorting");
  if (signals.usesHashMap) detected.push("Used HashMap/HashSet");
  if (signals.usesPrefixSum) detected.push("Used prefix-sum style accumulation");
  if (signals.usesTwoPointers) detected.push("Used two pointers");
  if (signals.usesSlidingWindow) detected.push("Used sliding window");
  if (signals.usesOppositeEndPointers) detected.push("Used opposite-end pointers");
  if (signals.usesFixedWindow) detected.push("Used a fixed-size window");
  if (signals.usesVariableWindow) detected.push("Used a shrinking variable window");
  if (signals.usesModuloPrefix) detected.push("Used modulo buckets on prefix sums");

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
    if (concept === "opposite-end-pointers") return analysis.signals.usesOppositeEndPointers || analysis.signals.usesTwoPointers;
    if (concept === "partition-two-pointers") return analysis.signals.usesPartitionPointers;
    if (concept === "fixed-size-window") return analysis.signals.usesFixedWindow;
    if (concept === "variable-size-window") return analysis.signals.usesVariableWindow;
    if (concept === "window-auxiliary-structure") return analysis.signals.usesWindowAuxStructure;
    if (concept === "prefix-suffix-product") return analysis.signals.usesPrefixSuffixProduct || analysis.signals.usesPrefixSum;
    if (concept === "prefix-balance") return analysis.signals.usesPrefixBalance || analysis.signals.usesPrefixSum;
    if (concept === "prefix-modulo") return analysis.signals.usesModuloPrefix;
    if (concept === "stock-profit") return analysis.signals.usesArrayTraversal;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
