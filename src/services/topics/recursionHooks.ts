import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const recursionMethodRegex = /\b(?:public|private|protected|static|\s)*\s*(?:int|long|boolean|String|void|List<[^>]+>|ArrayList<[^>]+>|char|double)\s+([a-zA-Z_]\w*)\s*\(/g;

function detectRecursiveMethodNames(content: string): string[] {
  const names: string[] = [];
  let match = recursionMethodRegex.exec(content);
  while (match) {
    names.push(match[1]);
    match = recursionMethodRegex.exec(content);
  }
  return Array.from(new Set(names));
}

export function analyzeRecursionJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasRecursiveCall: hasFact(facts, "recursive-call"),
    hasBaseCase: hasFact(facts, "base-case"),
    hasMultipleRecursiveCalls: hasFact(facts, "multiple-recursive-calls"),
    usesMemoization: hasFact(facts, "memoization"),
    usesBacktrackingUndo: hasFact(facts, "backtracking-undo"),
    usesDivideAndConquer: hasFact(facts, "divide-and-conquer"),
    missingRecursiveProgress: hasFact(facts, "missing-recursive-progress"),
    hasPoorVariableNames: hasFact(facts, "poor-variable-names") || /\b(?:int|long|boolean|String)\s+(a|b|x|y|temp)\b/.test(content),
    missingEdgeCaseHandling: !hasFact(facts, "empty-or-null-check") && !hasFact(facts, "recursive-base-case")
  };

  if (signals.hasRecursiveCall) detected.push("Used recursion");
  if (signals.hasBaseCase) detected.push("Defined a base case");
  if (signals.hasMultipleRecursiveCalls) detected.push("Used tree recursion or branching recursion");
  if (signals.usesMemoization) detected.push("Used memoization");
  if (signals.usesBacktrackingUndo) detected.push("Used backtracking undo step");
  if (signals.usesDivideAndConquer) detected.push("Used divide and conquer structure");

  if (!signals.hasRecursiveCall) warnings.push("Did not clearly use recursion.");
  if (!signals.hasBaseCase) warnings.push("Did not clearly define a base case.");
  if (signals.missingRecursiveProgress) warnings.push("Recursive call does not clearly move toward a smaller state.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle edge cases clearly.");

  return { detected, warnings, signals };
}

export function detectRecursionConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "recursion-intro") return analysis.signals.hasRecursiveCall;
    if (concept === "base-case") return analysis.signals.hasBaseCase;
    if (concept === "parameterized-recursion") return analysis.signals.hasRecursiveCall;
    if (concept === "functional-recursion") return analysis.signals.hasRecursiveCall && analysis.signals.hasBaseCase;
    if (concept === "recursion-on-strings") return analysis.signals.hasRecursiveCall;
    if (concept === "recursion-on-arrays") return analysis.signals.hasRecursiveCall;
    if (concept === "tree-recursion") return analysis.signals.hasMultipleRecursiveCalls;
    if (concept === "backtracking-basics") return analysis.signals.hasRecursiveCall && analysis.signals.usesBacktrackingUndo;
    if (concept === "subsequence-generation") return analysis.signals.hasMultipleRecursiveCalls;
    if (concept === "permutations") return analysis.signals.usesBacktrackingUndo && analysis.signals.hasMultipleRecursiveCalls;
    if (concept === "memoization") return analysis.signals.usesMemoization;
    if (concept === "divide-and-conquer") return analysis.signals.usesDivideAndConquer;
    if (concept === "recursive-search") return analysis.signals.hasRecursiveCall && (analysis.signals.usesBacktrackingUndo || analysis.signals.hasMultipleRecursiveCalls);
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
