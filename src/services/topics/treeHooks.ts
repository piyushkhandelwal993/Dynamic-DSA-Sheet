import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer|TreeNode|Node)\s+([a-zA-Z_]\w*)/g;

export function analyzeTreeJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const treeNodePattern = /(TreeNode|Node)\s+\w+|class\s+TreeNode|class\s+Node|root\.(left|right)|\w+\.(left|right)/;
  const recursiveTraversalPattern =
    /(preorder|inorder|postorder|dfs|traverse|height|depth|diameter|maxPath|isBalanced)\s*\([^)]*\)\s*\{[\s\S]{0,400}\w+\s*\(\s*\w+\.(left|right)\s*\)/;
  const queueTraversalPattern = /(Queue<|ArrayDeque<|LinkedList<)[\s\S]{0,220}(offer|poll|peek)/;
  const bstLogicPattern =
    /(root\.val|node\.val|current\.val|data)\s*[<>]=?\s*(low|high|target|key|val)|target\s*[<>]=?\s*(root|node|current)\.val|isValidBST|minValue|maxValue/;
  const treeConstructionPattern =
    /(buildTree|construct|preorderIndex|postorderIndex|inorderMap|splitIndex|mid\s*=|new\s+TreeNode|new\s+Node)/;
  const lcaPattern = /(lowestCommonAncestor|lca)\s*\(|if\s*\(\s*root\s*==\s*p\s*\|\||if\s*\(\s*root\s*==\s*q\s*\|\|left\s*!=\s*null\s*&&\s*right\s*!=\s*null/;
  const hardcodedReturnPattern = /\breturn\s+(true|false|\d+|"[^"]*")\s*;/;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 2 && !queueTraversalPattern.test(content),
    hasHardcoding: hardcodedReturnPattern.test(content) && !treeNodePattern.test(content),
    missingEdgeCaseHandling: !/(root\s*==\s*null|node\s*==\s*null|null\s*==\s*root|null\s*==\s*node|queue\.isEmpty\(\))/i.test(content),
    usesTreeNodePattern: treeNodePattern.test(content),
    usesRecursiveTraversal: recursiveTraversalPattern.test(content),
    usesQueueTraversal: queueTraversalPattern.test(content),
    usesBstLogic: bstLogicPattern.test(content),
    usesTreeConstruction: treeConstructionPattern.test(content),
    usesLcaPattern: lcaPattern.test(content)
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "ans", "temp", "n"].includes(name) && variableNames.length > 4);

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
