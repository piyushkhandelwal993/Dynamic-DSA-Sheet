import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Node|ListNode)\s+([a-zA-Z_]\w*)/g;

export function analyzeLinkedListJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const traversalPattern = /(while\s*\(\s*\w+\s*!=\s*null\s*\)|for\s*\(\s*.*\w+\s*=\s*\w+\.next)/.test(content);
  const headUpdatePattern = /(head\s*=\s*new\s+\w+|new\w*\.next\s*=\s*head|head\s*=\s*head\.next)/.test(content);
  const deletionPattern = /\.next\s*=\s*\w+\.next\.next|prev\.next\s*=\s*curr\.next/.test(content);
  const reversePattern = /curr\.next\s*=\s*prev|prev\s*=\s*curr;[\s\S]*curr\s*=\s*next/.test(content);
  const fastSlowPattern = /(slow\s*=\s*slow\.next[\s\S]*fast\s*=\s*fast\.next\.next|fast\s*=\s*fast\.next\.next[\s\S]*slow\s*=\s*slow\.next)/.test(content);
  const dummyNodePattern = /(dummy|sentinel)\s*=\s*new\s+\w+\s*\(/.test(content);

  const signals = {
    ...base.signals,
    missingEdgeCaseHandling: !/(head\s*==\s*null|n\s*==\s*0|if\s*\(\s*head\s*==\s*null|head\s*!=\s*null)/.test(content),
    usesLinkedListTraversal: traversalPattern,
    usesHeadUpdate: headUpdatePattern,
    usesNodeDeletion: deletionPattern,
    usesLinkedListReverse: reversePattern,
    usesFastSlowPointers: fastSlowPattern,
    usesDummyNode: dummyNodePattern
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans"].includes(name) && variableNames.length > 2);
  signals.hasHardcoding = /\breturn\s+\d+\s*;/.test(content) && !signals.usesLinkedListTraversal;

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
