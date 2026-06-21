import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Node|ListNode)\s+([a-zA-Z_]\w*)/g;

export function analyzeLinkedListJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    missingEdgeCaseHandling: !hasFact(facts, "linked-list-edge-check"),
    usesLinkedListTraversal: hasFact(facts, "linked-list-traversal"),
    usesHeadUpdate: hasFact(facts, "head-update"),
    usesNodeDeletion: hasFact(facts, "node-deletion"),
    usesLinkedListReverse: hasFact(facts, "linked-list-reversal"),
    usesFastSlowPointers: hasFact(facts, "fast-slow-pointers"),
    usesDummyNode: hasFact(facts, "dummy-node")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);
  signals.hasHardcoding = hasFact(facts, "hardcoded-output") && !signals.usesLinkedListTraversal;

  if (signals.usesLinkedListTraversal) detected.push("Used linked-list traversal");
  if (signals.usesHeadUpdate) detected.push("Updated head or head-adjacent links");
  if (signals.usesNodeDeletion) detected.push("Rewired pointers to delete a node");
  if (signals.usesLinkedListReverse) detected.push("Reversed next pointers");
  if (signals.usesFastSlowPointers) detected.push("Used fast and slow pointers");
  if (signals.usesDummyNode) detected.push("Used a dummy node");

  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle edge cases clearly.");
  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");

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

export function detectLinkedListConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "ll-traversal") return analysis.signals.usesLinkedListTraversal;
    if (concept === "ll-length") return analysis.signals.usesLinkedListTraversal;
    if (concept === "ll-search") return analysis.signals.usesLinkedListTraversal;
    if (concept === "ll-head-tail-update") return analysis.signals.usesHeadUpdate;
    if (concept === "ll-node-delete") return analysis.signals.usesNodeDeletion || analysis.signals.usesHeadUpdate;
    if (concept === "ll-reverse") return analysis.signals.usesLinkedListReverse;
    if (concept === "ll-middle") return analysis.signals.usesFastSlowPointers;
    if (concept === "ll-fast-slow") return analysis.signals.usesFastSlowPointers;
    if (concept === "ll-cycle-detection") return analysis.signals.usesFastSlowPointers;
    if (concept === "ll-merge-sorted") return analysis.signals.usesDummyNode || analysis.signals.usesLinkedListTraversal;
    if (concept === "ll-remove-duplicates") return analysis.signals.usesLinkedListTraversal && (analysis.signals.usesNodeDeletion || /\.next\s*=\s*\w+\.next/.test(problem.intendedApproachSummary ?? ""));
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
