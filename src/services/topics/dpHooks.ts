import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer|List|ArrayList)\s+([a-zA-Z_]\w*)/g;

export function analyzeDpJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 3 && !hasFact(facts, "interval-dp"),
    hasHardcoding: hasFact(facts, "hardcoded-output") && !hasFact(facts, "dp-memoization") && !hasFact(facts, "bottom-up-dp"),
    missingEdgeCaseHandling: !hasFact(facts, "dp-edge-check"),
    usesMemoTable: hasFact(facts, "dp-memoization"),
    usesBottomUpDp: hasFact(facts, "bottom-up-dp"),
    usesStateTransition: hasFact(facts, "dp-state-transition"),
    usesSpaceOptimization: hasFact(facts, "dp-space-optimization"),
    usesKnapsackPattern: hasFact(facts, "knapsack-dp"),
    usesIntervalDp: hasFact(facts, "interval-dp")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "ans", "temp", "res"].includes(name) && variableNames.length > 4);

  if (signals.usesMemoTable) detected.push("Used memoization table");
  if (signals.usesBottomUpDp) detected.push("Used bottom-up DP table");
  if (signals.usesStateTransition) detected.push("Used explicit DP state transition");
  if (signals.usesSpaceOptimization) detected.push("Used DP space optimization");
  if (signals.usesKnapsackPattern) detected.push("Used knapsack-style DP pattern");
  if (signals.usesIntervalDp) detected.push("Used interval DP style iteration");

  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle DP edge cases clearly.");

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

export function detectDpConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "dp-intro") return analysis.signals.usesMemoTable || analysis.signals.usesBottomUpDp;
    if (concept === "memoization") return analysis.signals.usesMemoTable;
    if (concept === "tabulation") return analysis.signals.usesBottomUpDp;
    if (concept === "state-transition") return analysis.signals.usesStateTransition;
    if (concept === "space-optimization") return analysis.signals.usesSpaceOptimization;
    if (concept === "grid-dp") return analysis.signals.usesBottomUpDp || analysis.signals.usesMemoTable;
    if (concept === "knapsack-dp") return analysis.signals.usesKnapsackPattern;
    if (concept === "lis-dp") return analysis.signals.usesStateTransition;
    if (concept === "interval-dp") return analysis.signals.usesIntervalDp;
    if (concept === "string-dp") return analysis.signals.usesBottomUpDp || analysis.signals.usesMemoTable;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
