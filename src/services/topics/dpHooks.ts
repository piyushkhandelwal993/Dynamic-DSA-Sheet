import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer|List|ArrayList)\s+([a-zA-Z_]\w*)/g;

export function analyzeDpJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const memoPattern = /(memo|dp)\s*\[|HashMap<.*>\s+\w+|Map<.*>\s+\w+[\s\S]{0,180}return\s+\w+\[/;
  const bottomUpPattern = /(dp)\s*\[[^\]]+\]\s*=|for\s*\(\s*int\s+i\s*=\s*1|for\s*\(\s*int\s+idx\s*=\s*1/;
  const stateTransitionPattern = /(dp)\s*\[[^\]]+\]\s*=\s*Math\.(max|min)|dp\s*\[[^\]]+\]\s*=\s*dp\s*\[[^\]]+\]\s*[+\-*\/]|take|notTake|pick|skip/;
  const spaceOptPattern = /(prev|curr|next)\b|rolling|oneD|1d dp|dp\s*=\s*new\s+int\s*\[/i;
  const knapsackPattern = /(capacity|weight|weights|values|target|sum)\b[\s\S]{0,220}dp\s*\[/i;
  const intervalPattern = /(gap|len|length)\b[\s\S]{0,220}for\s*\(\s*int\s+i|for\s*\(\s*int\s+j\s*=/;
  const recursivePattern = /\b\w+\s*\(\s*[^)]*\)\s*\{[\s\S]{0,500}\b\w+\s*\(\s*[^)]*\)/;
  const hardcodedReturnPattern = /\breturn\s+(true|false|\d+|"[^"]*")\s*;/;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 3 && !intervalPattern.test(content),
    hasHardcoding: hardcodedReturnPattern.test(content) && !memoPattern.test(content) && !bottomUpPattern.test(content),
    missingEdgeCaseHandling: !/(n\s*==\s*0|index\s*<\s*0|target\s*==\s*0|if\s*\(\s*\w+\s*==\s*null|arr\.length\s*==\s*0)/.test(content),
    usesMemoTable: memoPattern.test(content) && recursivePattern.test(content),
    usesBottomUpDp: bottomUpPattern.test(content),
    usesStateTransition: stateTransitionPattern.test(content),
    usesSpaceOptimization: spaceOptPattern.test(content) && bottomUpPattern.test(content),
    usesKnapsackPattern: knapsackPattern.test(content) && bottomUpPattern.test(content),
    usesIntervalDp: intervalPattern.test(content)
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "ans", "temp", "res"].includes(name) && variableNames.length > 4);

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
