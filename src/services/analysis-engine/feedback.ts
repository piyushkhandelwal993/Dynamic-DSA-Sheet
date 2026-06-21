import { AnalysisConfidence, ExplainableAnalysisFeedback, ExecutionResult, Problem, ScoreBreakdown } from "../../types";
import { CodeFact, CodeFacts } from "./facts";
import { ProblemExpectationResult } from "./matcher";

export function buildExplainableFeedback(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  score: ScoreBreakdown,
  execution?: ExecutionResult
): ExplainableAnalysisFeedback {
  const detectedConcepts = expectation.matches
    .filter((match) => match.matched)
    .map((match) => ({
      conceptId: match.conceptId,
      confidence: confidenceLabel(match.confidence),
      confidenceScore: Math.round(match.confidence * 100),
      factIds: match.factIds,
      evidence: match.evidence.length ? match.evidence : match.factIds.map((id) => `Detected ${humanize(id)}`)
    }));
  const antiPatterns = facts.antiPatterns.map((item) => ({
    id: item.id,
    confidence: factConfidenceLabel(item),
    evidence: item.evidence.length ? item.evidence : [`Detected ${humanize(item.id)}`]
  }));
  const complexityReasoning = buildComplexityReasoning(problem, facts, expectation, score);
  const improvements = buildImprovements(problem, expectation, antiPatterns, score, execution);

  return {
    detectedConcepts,
    missingConcepts: expectation.detection.missingConcepts,
    antiPatterns,
    complexityReasoning,
    improvements
  };
}

function buildComplexityReasoning(
  problem: Problem,
  facts: CodeFacts,
  expectation: ProblemExpectationResult,
  score: ScoreBreakdown
): string[] {
  const reasons = [`Expected complexity: ${problem.expectedComplexity}.`];

  if (facts.metrics.nestedLoopDepth >= 2) {
    reasons.push(`Detected nested loop depth ${facts.metrics.nestedLoopDepth}, which may indicate quadratic or higher work.`);
  } else if (facts.metrics.loopCount === 1) {
    reasons.push("Detected a single traversal loop.");
  } else if (facts.metrics.loopCount > 1) {
    reasons.push(`Detected ${facts.metrics.loopCount} loops; their nesting and data flow determine the final complexity.`);
  }

  const signals: Array<[string, string]> = [
    ["logarithmic-search", "Search bounds shrink around a midpoint, supporting logarithmic search."],
    ["linear-amortized", "Each element is processed a bounded number of times, supporting amortized linear work."],
    ["single-pass", "The implementation shows a single-pass strategy."],
    ["reduced-dp-space", "Rolling state replaces a full DP table, reducing auxiliary space."],
    ["quadratic-candidate", "Nested iteration is a quadratic-complexity warning."],
    ["exponential-dp-recursion", "Overlapping recursive branches are not cached, creating exponential recomputation."],
    ["missing-recursive-progress", "The recursive call does not clearly move toward a smaller state."]
  ];
  signals.forEach(([factId, message]) => {
    if (hasAnyFact(facts, factId)) reasons.push(message);
  });

  if (expectation.conceptMatchScore === 100 && score.complexityScore >= 85) {
    reasons.push("The intended strategy is fully represented and aligns with the expected complexity.");
  } else if (score.complexityScore < 60) {
    reasons.push("The detected strategy does not yet provide strong evidence for the expected complexity.");
  }

  return unique(reasons);
}

function buildImprovements(
  problem: Problem,
  expectation: ProblemExpectationResult,
  antiPatterns: ExplainableAnalysisFeedback["antiPatterns"],
  score: ScoreBreakdown,
  execution?: ExecutionResult
): string[] {
  const improvements: string[] = [];

  if (execution?.usedTestCases && !execution.compileSucceeded) {
    improvements.push("Fix the compiler errors first, then submit again to run the problem test cases.");
  } else if (execution?.usedTestCases && execution.passedCount < execution.totalCount) {
    improvements.push(`Review the failed test cases: ${execution.passedCount}/${execution.totalCount} currently pass.`);
  }
  expectation.detection.missingConcepts.slice(0, 2).forEach((conceptId) => {
    improvements.push(`Demonstrate ${humanize(conceptId)} explicitly; it is expected for this problem but was not detected.`);
  });
  antiPatterns.slice(0, 2).forEach((issue) => {
    improvements.push(antiPatternSuggestion(issue.id));
  });
  if (score.complexityScore < 60) {
    improvements.push(`Refactor toward the intended ${problem.expectedComplexity} approach.`);
  }
  if (score.qualityScore < 70) {
    improvements.push("Clarify variable names and make boundary handling explicit.");
  }
  if (!improvements.length) {
    improvements.push("The approach is strong. Review the next recommendation and continue to the next challenge.");
  }

  return unique(improvements).slice(0, 4);
}

function antiPatternSuggestion(id: string): string {
  const suggestions: Record<string, string> = {
    "hardcoded-output": "Remove hardcoded outputs and derive the answer from the input.",
    "bit-hardcoding": "Replace literal bit cases with a general mask-based operation.",
    "binary-string-conversion": "Use direct bit operations instead of converting the value to a string.",
    "modulo-division-by-two": "Use the intended bitwise operation instead of repeated modulo or division.",
    "quadratic-candidate": "Look for a single-pass, hashing, window, or amortized data-structure approach.",
    "exponential-dp-recursion": "Cache repeated recursive states or convert the recurrence to bottom-up DP.",
    "missing-recursive-progress": "Ensure every recursive call moves toward the base case.",
    "poor-variable-names": "Rename ambiguous variables so each state and pointer has a clear role."
  };
  return suggestions[id] ?? `Review the ${humanize(id)} warning and remove the underlying pattern.`;
}

function confidenceLabel(value: number): AnalysisConfidence {
  if (value >= 0.85) return "High";
  if (value >= 0.55) return "Medium";
  return "Low";
}

function factConfidenceLabel(fact: CodeFact): AnalysisConfidence {
  if (fact.confidence === "high") return "High";
  if (fact.confidence === "medium") return "Medium";
  return "Low";
}

function hasAnyFact(facts: CodeFacts, id: string): boolean {
  return [
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].some((item) => item.id === id);
}

function humanize(value: string): string {
  return value.replace(/-/g, " ");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
