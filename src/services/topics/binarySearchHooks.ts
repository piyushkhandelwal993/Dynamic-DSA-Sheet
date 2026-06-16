import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer)\s+([a-zA-Z_]\w*)/g;

export function analyzeBinarySearchJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const midPattern = /(mid\s*=|mid\s*=\s*left\s*\+\s*\(right\s*-\s*left\)\s*\/\s*2|mid\s*=\s*\(left\s*\+\s*right\)\s*\/\s*2)/;
  const boundPattern = /(ans\s*=|first\s*=|last\s*=|lowerBound|upperBound|leftMost|rightMost)/;
  const answerBinaryPattern =
    /(while\s*\(\s*left\s*<=\s*right\s*\)|while\s*\(\s*low\s*<=\s*high\s*\)|while\s*\(\s*left\s*<\s*right\s*\))[\s\S]{0,240}(mid)[\s\S]{0,240}(possible|can|isValid|isPossible|hours|capacity|days|bouquets)/i;
  const sortedMidCheckPattern = /(arr\s*\[\s*mid\s*\]|nums\s*\[\s*mid\s*\]|midVal|midValue)/;
  const partitionPattern = /(partition|cut1|cut2|left1|left2|right1|right2|maxLeft|minRight)/;
  const hardcodedReturnPattern = /\breturn\s+(true|false|\d+|"[^"]*")\s*;/;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 2 && !answerBinaryPattern.test(content),
    hasHardcoding: hardcodedReturnPattern.test(content) && !midPattern.test(content),
    missingEdgeCaseHandling: !/(n\s*==\s*0|arr\.length\s*==\s*0|nums\.length\s*==\s*0|null|left\s*>\s*right|low\s*>\s*high)/.test(content),
    usesBinarySearch: midPattern.test(content) && /(left|right|low|high)/.test(content) && /while\s*\(/.test(content),
    usesLowerUpperBoundPattern: boundPattern.test(content) && midPattern.test(content),
    usesAnswerBinarySearch: answerBinaryPattern.test(content),
    usesSortedMidCheck: sortedMidCheckPattern.test(content) && midPattern.test(content),
    usesPartitionBinarySearch: partitionPattern.test(content) && midPattern.test(content)
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "ans", "temp"].includes(name) && variableNames.length > 3);

  if (signals.usesBinarySearch) detected.push("Used binary-search loop");
  if (signals.usesLowerUpperBoundPattern) detected.push("Tracked boundary answer for lower/upper bound style search");
  if (signals.usesAnswerBinarySearch) detected.push("Used answer-space binary search");
  if (signals.usesPartitionBinarySearch) detected.push("Used partition-based binary search");
  if (signals.usesSortedMidCheck) detected.push("Compared against middle element in sorted data");

  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle edge cases clearly.");

  return { detected, warnings, signals };
}

export function detectBinarySearchConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "binary-search-intro") return analysis.signals.usesBinarySearch;
    if (concept === "sorted-mid-check") return analysis.signals.usesSortedMidCheck || analysis.signals.usesBinarySearch;
    if (concept === "lower-bound") return analysis.signals.usesLowerUpperBoundPattern;
    if (concept === "upper-bound") return analysis.signals.usesLowerUpperBoundPattern;
    if (concept === "first-last-occurrence") return analysis.signals.usesLowerUpperBoundPattern;
    if (concept === "search-insert-position") return analysis.signals.usesLowerUpperBoundPattern || analysis.signals.usesBinarySearch;
    if (concept === "rotated-array-search") return analysis.signals.usesBinarySearch && analysis.signals.usesSortedMidCheck;
    if (concept === "peak-element") return analysis.signals.usesBinarySearch;
    if (concept === "answer-binary-search") return analysis.signals.usesAnswerBinarySearch;
    if (concept === "sqrt-binary-search") return analysis.signals.usesBinarySearch;
    if (concept === "capacity-search") return analysis.signals.usesAnswerBinarySearch;
    if (concept === "partition-binary-search") return analysis.signals.usesPartitionBinarySearch;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
