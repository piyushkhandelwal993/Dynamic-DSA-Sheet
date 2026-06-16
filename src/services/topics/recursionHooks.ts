import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
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

  const methodNames = detectRecursiveMethodNames(content);
  const recursiveCalls = methodNames.filter((name) => new RegExp(`\\b${name}\\s*\\(`, "g").test(content));
  const recursiveCallCounts = methodNames.map((name) => ({
    name,
    count: content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0
  }));
  const hasRecursiveCall = recursiveCallCounts.some((item) => item.count >= 2);
  const hasMultipleRecursiveCalls = recursiveCallCounts.some((item) => item.count >= 3);
  const hasBaseCase = /(if\s*\([^)]*(==|<=|>=|<|>)\s*[^)]*\)\s*(return|{|System\.out\.print)|return\s+\w+\s*;)/.test(content);
  const usesMemoization = /(dp\s*\[|memo|HashMap|Map<)/.test(content);
  const usesBacktrackingUndo = /(\.remove\s*\(|used\s*\[\w+\]\s*=\s*false|swap\s*\([^)]*\)\s*;[\s\S]*swap\s*\([^)]*\)\s*;)/.test(content);
  const usesDivideAndConquer = /(mid\s*=|\(l\s*\+\s*r\)\s*\/\s*2|merge\s*\(|partition\s*\()/.test(content) && hasMultipleRecursiveCalls;
  const missingRecursiveProgress = hasRecursiveCall && !/(\w+\s*-\s*1|\w+\s*\+\s*1|mid|left|right|start|end|idx|index)/.test(content);

  const signals = {
    ...base.signals,
    hasRecursiveCall,
    hasBaseCase,
    hasMultipleRecursiveCalls,
    usesMemoization,
    usesBacktrackingUndo,
    usesDivideAndConquer,
    missingRecursiveProgress,
    hasPoorVariableNames: /\b(?:int|long|boolean|String)\s+(a|b|x|y|temp)\b/.test(content),
    missingEdgeCaseHandling: !/(n\s*<=?\s*0|n\s*==\s*0|if\s*\(\s*\w+\s*<\s*0|\bnull\b|length\s*==\s*0)/.test(content)
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
