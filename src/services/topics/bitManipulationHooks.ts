import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
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

  const normalBitMaskPattern = /(1\s*<<|>>\s*1|&\s*1|\|\s*\(|\^\s*\()/;
  const hardcodedBranchPattern = /if\s*\(\s*[\w\s<>=!&|()+-]+\)\s*return\s+\d+\s*;/g;
  const hardcodedAssignmentPattern = /\b(?:int|long)\s+\w+\s*=\s*\d+\s*;/g;
  const hardcodedBranchCount = content.match(hardcodedBranchPattern)?.length ?? 0;
  const hardcodedAssignmentCount = content.match(hardcodedAssignmentPattern)?.length ?? 0;
  const usesBitwiseOperators = /[&|^~]|<<|>>/.test(content);

  const signals = {
    ...base.signals,
    usesAnd: /\&/.test(content) && !/\&\&/.test(content),
    usesOr: /\|/.test(content) && !/\|\|/.test(content),
    usesXor: /\^/.test(content),
    usesLeftShift: /<</.test(content),
    usesRightShift: />>/.test(content),
    usesNot: /~/.test(content),
    usesPowerOfTwoPattern: /n\s*&\s*\(\s*n\s*-\s*1\s*\)|\w+\s*&=\s*\(\s*\w+\s*-\s*1\s*\)/.test(content),
    usesStringConversion: /(Integer\.toBinaryString|toString\(\s*n\s*,\s*2\s*\)|StringBuilder|StringBuffer)/.test(content),
    usesModuloDivision: /[%\/]\s*2/.test(content),
    hasUnnecessaryLoop: /(for|while)\s*\(/.test(content),
    hasHardcoding:
      (!usesBitwiseOperators && hardcodedBranchCount >= 1) ||
      (hardcodedAssignmentCount >= 2 && !normalBitMaskPattern.test(content)),
    missingEdgeCaseHandling: !/(n\s*<=?\s*0|n\s*==\s*0|if\s*\(\s*\w+\s*<\s*0|\bnull\b)/.test(content)
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);

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
