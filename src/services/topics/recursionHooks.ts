import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const recursionMethodRegex = /\b(?:public|private|protected|static|\s)*\s*(?:int|long|boolean|String|void|List<[^>]+>|ArrayList<[^>]+>|char|double)\s+([a-zA-Z_]\w*)\s*\(/g;
const boardResetRegex = /[A-Za-z_]\w*\s*\[[^\]]+\]\s*\[[^\]]+\]\s*=\s*(?:'\.'|0|false)\s*;/;
const boardPlaceRegex = /[A-Za-z_]\w*\s*\[[^\]]+\]\s*\[[^\]]+\]\s*=\s*(?:digit|'Q'|[A-Za-z_]\w+)\s*;/;
const swapUndoRegex = /swap\s*\([^)]*\)\s*;[\s\S]*swap\s*\([^)]*\)\s*;/;
const recursionHardcodingRegex = new RegExp("(return\\s+|System\\.out\\.print|System\\.out\\.println|answer\\.add\\s*\\(|Arrays\\.asList\\s*\\()");
const hardcodedBranchRegex = /if\s*\([^)]*==\s*\d+[^)]*\)/g;

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
  const recursiveCallCounts = methodNames.map((name) => ({
    name,
    count: content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0
  }));
  const hasRecursiveCall = recursiveCallCounts.some((item) => item.count >= 2);
  const hasMultipleRecursiveCalls = recursiveCallCounts.some((item) => item.count >= 3);
  const hasBaseCase = /(if\s*\([^)]*(==|<=|>=|<|>)\s*[^)]*\)\s*(return|{|System\.out\.print)|return\s+\w+\s*;)/.test(content);
  const usesMemoization = /(dp\s*\[|memo|HashMap|Map<)/.test(content);
  const usesBacktrackingUndo = /(\.remove\s*\(|used\s*\[[^\]]+\]\s*=\s*false)/.test(content) || swapUndoRegex.test(content) || boardResetRegex.test(content);
  const usesDivideAndConquer = /(mid\s*=|\(l\s*\+\s*r\)\s*\/\s*2|merge\s*\(|partition\s*\(|pivot\s*=)/.test(content) && hasMultipleRecursiveCalls;
  const missingRecursiveProgress = hasRecursiveCall && !/(\w+\s*-\s*1|\w+\s*\+\s*1|mid|left|right|start|end|idx|index)/.test(content);
  const hardcodedBranchCount = content.match(hardcodedBranchRegex)?.length ?? 0;
  const hasHardcoding =
    !hasRecursiveCall &&
    hardcodedBranchCount >= 1 &&
    recursionHardcodingRegex.test(content);
  const usesReusableChoiceRecursion =
    /(dfs|backtrack)\s*\([^)]*\bindex\b\s*,[^)]*\bremaining\s*-\s*[^)]*\)[\s\S]{0,220}\1\s*\([^)]*\bindex\s*\+\s*1\b[^)]*\bremaining\b/.test(content);
  const usesPermutationState = /used\s*\[[^\]]+\]\s*=\s*true/.test(content) || swapUndoRegex.test(content);
  const usesSearchBoardReset = boardPlaceRegex.test(content) && boardResetRegex.test(content);
  const usesMergeStep = /merge\s*\(|Arrays\.copyOfRange\s*\(|temp\s*\[|nums\s*\[\s*left\s*\+\s*index\s*\]\s*=/.test(content);
  const usesPartitionStep = /partition\s*\(|pivot\s*=/.test(content) && /swap\s*\(|while\s*\(\s*left\s*<=\s*right\s*\)/.test(content);
  const usesJosephusShift = /return\s*\(\s*\w+\s*\(\s*n\s*-\s*1\s*,\s*k\s*\)\s*\+\s*k\s*\)\s*%\s*n\s*;/.test(content);
  const usesClimbingStairsBaseCases = /if\s*\(\s*n\s*<=\s*2\s*\)\s*\{?\s*return\s+n\s*;/.test(content);
  const usesTribonacciBaseCases =
    /if\s*\(\s*n\s*==\s*0\s*\)\s*\{?\s*return\s+0\s*;/.test(content) &&
    /if\s*\(\s*n\s*==\s*1\s*\|\|\s*n\s*==\s*2\s*\)\s*\{?\s*return\s+1\s*;/.test(content);
  const exploresColumnChoices =
    /for\s*\([^)]*col\s*=/.test(content) &&
    (/isSafe\s*\(/.test(content) || /columns\.contains\s*\(|diag1\.contains\s*\(|diag2\.contains\s*\(/.test(content));
  const usesSudokuConstraintValidation =
    /board\s*\[\s*row\s*\]\s*\[\s*index\s*\]\s*==\s*digit/.test(content) &&
    /board\s*\[\s*index\s*\]\s*\[\s*col\s*\]\s*==\s*digit/.test(content) &&
    /row\s*\/\s*3/.test(content) &&
    /col\s*\/\s*3/.test(content);
  const usesTowerOfHanoiTransferPattern =
    /([A-Za-z_]\w*)\s*\(\s*n\s*-\s*1\s*,\s*source\s*,\s*destination\s*,\s*auxiliary\b[\s\S]{0,120}\1\s*\(\s*n\s*-\s*1\s*,\s*auxiliary\s*,\s*source\s*,\s*destination\b/.test(content);

  const signals = {
    ...base.signals,
    hasRecursiveCall,
    hasBaseCase,
    hasMultipleRecursiveCalls,
    usesMemoization,
    usesBacktrackingUndo,
    usesDivideAndConquer,
    missingRecursiveProgress,
    hasHardcoding,
    hasPoorVariableNames: /\b(?:int|long|boolean|String)\s+(a|b|x|y|temp)\b/.test(content),
    missingEdgeCaseHandling: !/(n\s*<=?\s*0|n\s*==\s*0|if\s*\(\s*\w+\s*<\s*0|\bnull\b|length\s*==\s*0)/.test(content)
  };

  if (signals.hasRecursiveCall) detected.push("Used recursion");
  if (signals.hasBaseCase) detected.push("Defined a base case");
  if (signals.hasMultipleRecursiveCalls) detected.push("Used tree recursion or branching recursion");
  if (signals.usesMemoization) detected.push("Used memoization");
  if (signals.usesBacktrackingUndo) detected.push("Used backtracking undo step");
  if (signals.usesDivideAndConquer) detected.push("Used divide and conquer structure");
  if (signals.hasHardcoding) detected.push("Used hardcoded output or branch-specific logic");
  if (usesReusableChoiceRecursion) detected.push("Reused the current choice before skipping ahead");
  if (usesPermutationState) detected.push("Tracked permutation state while exploring branches");
  if (usesSearchBoardReset) detected.push("Reset board state while backtracking");
  if (usesMergeStep) detected.push("Merged sorted halves");
  if (usesPartitionStep) detected.push("Partitioned around a pivot");
  if (usesJosephusShift) detected.push("Used Josephus recurrence shift");
  if (usesClimbingStairsBaseCases) detected.push("Handled climbing stairs base cases");
  if (usesTribonacciBaseCases) detected.push("Handled tribonacci base cases");
  if (exploresColumnChoices) detected.push("Explored column choices row by row");
  if (usesSudokuConstraintValidation) detected.push("Validated Sudoku row, column, and box constraints");
  if (usesTowerOfHanoiTransferPattern) detected.push("Used Tower of Hanoi transfer pattern");

  if (!signals.hasRecursiveCall) warnings.push("Did not clearly use recursion.");
  if (!signals.hasBaseCase) warnings.push("Did not clearly define a base case.");
  if (signals.missingRecursiveProgress) warnings.push("Recursive call does not clearly move toward a smaller state.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle edge cases clearly.");

  return { detected, warnings, signals };
}

export function detectRecursionConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "recursion-intro") {
      if (problem.id === "rec-017") {
        return analysis.detected.includes("Used Tower of Hanoi transfer pattern");
      }
      return analysis.signals.hasRecursiveCall;
    }
    if (concept === "base-case") return analysis.signals.hasBaseCase;
    if (concept === "parameterized-recursion") return analysis.signals.hasRecursiveCall;
    if (concept === "functional-recursion") {
      if (problem.id === "rec-018") {
        return analysis.detected.includes("Used Josephus recurrence shift");
      }
      return analysis.signals.hasRecursiveCall && analysis.signals.hasBaseCase;
    }
    if (concept === "recursion-on-strings") return analysis.signals.hasRecursiveCall;
    if (concept === "recursion-on-arrays") return analysis.signals.hasRecursiveCall;
    if (concept === "tree-recursion") return analysis.signals.hasMultipleRecursiveCalls;
    if (concept === "backtracking-basics") {
      if (problem.id === "rec-015") {
        return analysis.signals.usesBacktrackingUndo && analysis.detected.includes("Reused the current choice before skipping ahead");
      }
      if (problem.id === "rec-016") {
        return analysis.signals.usesBacktrackingUndo && analysis.detected.includes("Tracked permutation state while exploring branches");
      }
      if (problem.id === "rec-023" || problem.id === "rec-024") {
        return analysis.signals.hasRecursiveCall && (analysis.signals.usesBacktrackingUndo || analysis.detected.includes("Reset board state while backtracking"));
      }
      return analysis.signals.hasRecursiveCall && analysis.signals.usesBacktrackingUndo;
    }
    if (concept === "subsequence-generation") {
      if (problem.id === "rec-015") {
        return analysis.detected.includes("Reused the current choice before skipping ahead");
      }
      return analysis.signals.hasMultipleRecursiveCalls;
    }
    if (concept === "permutations") {
      if (problem.id === "rec-016") {
        return analysis.detected.includes("Tracked permutation state while exploring branches");
      }
      if (problem.id === "rec-024") {
        return analysis.detected.includes("Explored column choices row by row") && (analysis.signals.usesBacktrackingUndo || analysis.detected.includes("Reset board state while backtracking"));
      }
      return analysis.signals.usesBacktrackingUndo && analysis.signals.hasMultipleRecursiveCalls;
    }
    if (concept === "memoization") {
      if (problem.id === "rec-019") {
        return analysis.signals.usesMemoization && analysis.detected.includes("Handled climbing stairs base cases");
      }
      if (problem.id === "rec-020") {
        return analysis.signals.usesMemoization && analysis.detected.includes("Handled tribonacci base cases");
      }
      return analysis.signals.usesMemoization;
    }
    if (concept === "divide-and-conquer") {
      if (problem.id === "rec-021") {
        return analysis.signals.usesDivideAndConquer && analysis.detected.includes("Merged sorted halves");
      }
      if (problem.id === "rec-022") {
        return analysis.signals.usesDivideAndConquer && analysis.detected.includes("Partitioned around a pivot");
      }
      return analysis.signals.usesDivideAndConquer;
    }
    if (concept === "recursive-search") {
      if (problem.id === "rec-023" || problem.id === "rec-024") {
        if (problem.id === "rec-023") {
          return analysis.signals.hasRecursiveCall && analysis.detected.includes("Validated Sudoku row, column, and box constraints");
        }
        return analysis.signals.hasRecursiveCall && (analysis.signals.usesBacktrackingUndo || analysis.detected.includes("Reset board state while backtracking") || analysis.detected.includes("Explored column choices row by row"));
      }
      return analysis.signals.hasRecursiveCall && (analysis.signals.usesBacktrackingUndo || analysis.signals.hasMultipleRecursiveCalls);
    }
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
