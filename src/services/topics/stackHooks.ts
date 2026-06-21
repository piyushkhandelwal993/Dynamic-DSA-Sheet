import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|char|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeStackJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 2 && !hasFact(facts, "monotonic-stack"),
    hasHardcoding: hasFact(facts, "hardcoded-output") && !hasFact(facts, "stack-like"),
    missingEdgeCaseHandling: !hasFact(facts, "empty-or-null-check"),
    usesStackStructure: hasFact(facts, "stack-like"),
    usesPushPop: hasFact(facts, "stack-operations"),
    usesMonotonicStack: hasFact(facts, "monotonic-stack"),
    usesParenthesisMatching: hasFact(facts, "parenthesis-matching"),
    usesExpressionConversion: hasFact(facts, "expression-conversion"),
    usesMinStackPattern: hasFact(facts, "min-stack")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "st", "ans", "temp"].includes(name) && variableNames.length > 3);

  if (signals.usesStackStructure) detected.push("Used stack-style data structure");
  if (signals.usesPushPop) detected.push("Used push/pop or equivalent stack operations");
  if (signals.usesMonotonicStack) detected.push("Used monotonic stack pattern");
  if (signals.usesParenthesisMatching) detected.push("Used stack for bracket matching");
  if (signals.usesExpressionConversion) detected.push("Used expression-conversion logic");
  if (signals.usesMinStackPattern) detected.push("Tracked stack minimum alongside values");

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

export function detectStackConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "stack-intro") return analysis.signals.usesStackStructure || analysis.signals.usesPushPop;
    if (concept === "stack-array-implementation") return analysis.signals.usesStackStructure || analysis.signals.usesPushPop;
    if (concept === "stack-operations") return analysis.signals.usesPushPop;
    if (concept === "balanced-parentheses") return analysis.signals.usesParenthesisMatching;
    if (concept === "reverse-using-stack") return analysis.signals.usesPushPop || analysis.signals.usesStackStructure;
    if (concept === "postfix-evaluation") return analysis.signals.usesPushPop || analysis.signals.usesExpressionConversion;
    if (concept === "min-stack") return analysis.signals.usesMinStackPattern;
    if (concept === "monotonic-stack") return analysis.signals.usesMonotonicStack;
    if (concept === "stock-span") return analysis.signals.usesMonotonicStack;
    if (concept === "next-greater-element") return analysis.signals.usesMonotonicStack;
    if (concept === "previous-smaller-element") return analysis.signals.usesMonotonicStack;
    if (concept === "largest-rectangle-histogram") return analysis.signals.usesMonotonicStack;
    if (concept === "expression-conversion") return analysis.signals.usesExpressionConversion;
    if (concept === "stack-simulation") return analysis.signals.usesPushPop || analysis.signals.usesStackStructure;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
