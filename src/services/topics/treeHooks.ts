import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer|TreeNode|Node)\s+([a-zA-Z_]\w*)/g;

export function analyzeTreeJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 2 && !hasFact(facts, "level-order-tree-traversal"),
    hasHardcoding: hasFact(facts, "hardcoded-output") && !hasFact(facts, "tree-node"),
    missingEdgeCaseHandling: !hasFact(facts, "tree-edge-check"),
    usesTreeNodePattern: hasFact(facts, "tree-node"),
    usesRecursiveTraversal: hasFact(facts, "recursive-tree-traversal"),
    usesQueueTraversal: hasFact(facts, "level-order-tree-traversal"),
    usesBstLogic: hasFact(facts, "bst-logic"),
    usesTreeConstruction: hasFact(facts, "tree-construction"),
    usesLcaPattern: hasFact(facts, "lowest-common-ancestor")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "ans", "temp", "n"].includes(name) && variableNames.length > 4);

  if (signals.usesTreeNodePattern) detected.push("Used tree node structure");
  if (signals.usesRecursiveTraversal) detected.push("Used recursive tree traversal");
  if (signals.usesQueueTraversal) detected.push("Used queue-based tree traversal");
  if (signals.usesBstLogic) detected.push("Used BST comparison logic");
  if (signals.usesTreeConstruction) detected.push("Used tree construction pattern");
  if (signals.usesLcaPattern) detected.push("Used LCA-style recursion");

  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle tree edge cases clearly.");

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

export function detectTreeConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "tree-intro") return analysis.signals.usesTreeNodePattern;
    if (concept === "recursive-tree-traversal") return analysis.signals.usesRecursiveTraversal;
    if (concept === "level-order-traversal") return analysis.signals.usesQueueTraversal;
    if (concept === "tree-height") return analysis.signals.usesRecursiveTraversal;
    if (concept === "tree-diameter") return analysis.signals.usesRecursiveTraversal;
    if (concept === "balanced-tree-check") return analysis.signals.usesRecursiveTraversal;
    if (concept === "bst-search") return analysis.signals.usesBstLogic;
    if (concept === "bst-insert-delete") return analysis.signals.usesBstLogic;
    if (concept === "lca-binary-tree") return analysis.signals.usesLcaPattern;
    if (concept === "tree-construction") return analysis.signals.usesTreeConstruction;
    if (concept === "tree-view") return analysis.signals.usesQueueTraversal || analysis.signals.usesRecursiveTraversal;
    if (concept === "serialize-tree") return analysis.signals.usesQueueTraversal || analysis.signals.usesRecursiveTraversal;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
