import { AnalysisResult, Problem } from "../types";

export function usesAnyBitwiseOperator(analysis: AnalysisResult): boolean {
  return (
    analysis.signals.usesAnd ||
    analysis.signals.usesOr ||
    analysis.signals.usesXor ||
    analysis.signals.usesLeftShift ||
    analysis.signals.usesRightShift ||
    analysis.signals.usesNot ||
    analysis.signals.usesPowerOfTwoPattern
  );
}

export function isNonBitwiseFoundationSolve(problem: Problem, analysis: AnalysisResult): boolean {
  return (
    problem.topic === "Bit Manipulation" &&
    problem.expectedConcepts.includes("binary-representation") &&
    (analysis.signals.usesModuloDivision || analysis.signals.usesStringConversion) &&
    !usesAnyBitwiseOperator(analysis)
  );
}
