import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|char|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeStackJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const stackStructurePattern = /(Stack<|Deque<|ArrayDeque<|LinkedList<)/;
  const pushPopPattern = /\.(push|pop|peek)\s*\(/;
  const addRemoveLastPattern = /\.(addLast|removeLast|getLast|offerLast|pollLast|peekLast)\s*\(/;
  const monotonicPattern =
    /(while\s*\(\s*!?\w+\.isEmpty\(\)\s*&&[\s\S]{0,120}(peek|getLast|peekLast)\s*\(\)[\s\S]{0,80}[<>]=?|while\s*\(\s*!?\w+\.isEmpty\(\)\s*&&[\s\S]{0,120}[<>]=?[\s\S]{0,80}(peek|getLast|peekLast)\s*\()/;
  const parenthesisPattern = /[\(\)\[\]\{\}]/.test(content) && /(push|pop|peek|addLast|removeLast|getLast|peekLast)/.test(content);
  const expressionPattern =
    /(precedence|isOperator|postfix|infix|prefix|Character\.isLetterOrDigit|Character\.isDigit|\+\s*" ")/;
  const minStackPattern = /(minStack|minValues|minHistory|Math\.min|currentMin)/;
  const hardcodedReturnPattern = /\breturn\s+(true|false|\d+|"[^"]*")\s*;/;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 2 && !monotonicPattern.test(content),
    hasHardcoding: hardcodedReturnPattern.test(content) && !stackStructurePattern.test(content),
    missingEdgeCaseHandling: !/(isEmpty\(\)|empty\(\)|n\s*==\s*0|length\(\)\s*==\s*0|arr\.length\s*==\s*0|null)/.test(content),
    usesStackStructure: stackStructurePattern.test(content),
    usesPushPop: pushPopPattern.test(content) || addRemoveLastPattern.test(content),
    usesMonotonicStack: monotonicPattern.test(content) && (pushPopPattern.test(content) || addRemoveLastPattern.test(content)),
    usesParenthesisMatching: parenthesisPattern,
    usesExpressionConversion: expressionPattern.test(content) && (pushPopPattern.test(content) || addRemoveLastPattern.test(content)),
    usesMinStackPattern: minStackPattern.test(content) && (pushPopPattern.test(content) || addRemoveLastPattern.test(content))
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "st", "ans", "temp"].includes(name) && variableNames.length > 3);

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
