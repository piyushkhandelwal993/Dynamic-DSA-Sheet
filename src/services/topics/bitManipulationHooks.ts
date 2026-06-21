import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String)\s+([a-zA-Z_]\w*)/g;

const signalConceptMap: Record<string, keyof AnalysisResult["signals"]> = {
  "bitwise-and": "usesAnd",
  "bitwise-or": "usesOr",
  "bitwise-xor": "usesXor",
  "left-shift": "usesLeftShift",
  "right-shift": "usesRightShift",
  "bitwise-not": "usesNot",
  "power-of-two": "usesPowerOfTwoPattern"
};

export function analyzeBitJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected = [...base.detected];
  const warnings = [...base.warnings];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    usesAnd: hasFact(facts, "bitwise-and"),
    usesOr: hasFact(facts, "bitwise-or"),
    usesXor: hasFact(facts, "bitwise-xor"),
    usesLeftShift: hasFact(facts, "left-shift"),
    usesRightShift: hasFact(facts, "right-shift"),
    usesNot: hasFact(facts, "bitwise-not"),
    usesPowerOfTwoPattern: hasFact(facts, "clear-lowest-set-bit"),
    usesStringConversion: hasFact(facts, "binary-string-conversion"),
    usesModuloDivision: hasFact(facts, "modulo-division-by-two"),
    hasUnnecessaryLoop: facts.metrics.loopCount > 0,
    hasHardcoding: hasFact(facts, "bit-hardcoding"),
    missingEdgeCaseHandling: !hasFact(facts, "bit-edge-check")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);

  if (signals.usesAnd) detected.push("Used bitwise AND");
  if (signals.usesOr) detected.push("Used bitwise OR");
  if (signals.usesXor) detected.push("Used XOR");
  if (signals.usesLeftShift) detected.push("Used left shift");
  if (signals.usesRightShift) detected.push("Used right shift");
  if (signals.usesNot) detected.push("Used bitwise NOT");
  if (signals.usesPowerOfTwoPattern) detected.push("Used n & (n - 1) pattern");
  if (signals.usesStringConversion) detected.push("Used string conversion approach");
  if (signals.usesModuloDivision) detected.push("Used modulo/division approach");

  if (signals.hasUnnecessaryLoop) warnings.push("Contains a loop; check whether a constant-time bit trick was expected.");
  if (signals.hasHardcoding) warnings.push("Contains hardcoded constants; verify the logic is not tied to one case.");
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

export function detectBitConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    const mappedSignal = signalConceptMap[concept];
    if (mappedSignal) {
      return analysis.signals[mappedSignal];
    }

    if (concept === "binary-representation") {
      return analysis.signals.usesModuloDivision || analysis.signals.usesStringConversion || analysis.signals.usesRightShift;
    }

    if (concept === "odd-even-check") {
      return analysis.signals.usesAnd || analysis.signals.usesModuloDivision;
    }

    if (concept === "check-ith-bit") {
      return analysis.signals.usesAnd && (analysis.signals.usesLeftShift || analysis.signals.usesRightShift);
    }

    if (concept === "set-ith-bit") {
      return analysis.signals.usesOr && analysis.signals.usesLeftShift;
    }

    if (concept === "clear-ith-bit") {
      return analysis.signals.usesAnd && analysis.signals.usesNot && analysis.signals.usesLeftShift;
    }

    if (concept === "toggle-ith-bit") {
      return analysis.signals.usesXor && analysis.signals.usesLeftShift;
    }

    if (concept === "count-set-bits") {
      return analysis.signals.usesAnd || analysis.signals.usesPowerOfTwoPattern || analysis.signals.usesRightShift;
    }

    if (concept === "brian-kernighan") {
      return analysis.signals.usesPowerOfTwoPattern;
    }

    if (concept === "xor-tricks" || concept === "single-number" || concept === "two-unique-numbers" || concept === "missing-number") {
      return analysis.signals.usesXor;
    }

    if (concept === "subsets-using-bits" || concept === "bitmasking-basics") {
      return analysis.signals.usesLeftShift || analysis.signals.usesAnd || analysis.signals.usesOr;
    }

    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
