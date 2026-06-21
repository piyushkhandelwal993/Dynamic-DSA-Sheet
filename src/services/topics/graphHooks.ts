import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer|List|ArrayList|Queue|Deque)\s+([a-zA-Z_]\w*)/g;

export function analyzeGraphJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];
  const facts = analyzeCodeFacts("java", content);

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: facts.metrics.loopCount > 3 && !hasFact(facts, "topological-sort") && !hasFact(facts, "shortest-path-relaxation"),
    hasHardcoding: hasFact(facts, "hardcoded-output") && !hasFact(facts, "graph-adjacency"),
    missingEdgeCaseHandling: !hasFact(facts, "graph-edge-check"),
    usesGraphAdjacency: hasFact(facts, "graph-adjacency"),
    usesGraphTraversal: hasFact(facts, "graph-traversal"),
    usesTopologicalSort: hasFact(facts, "topological-sort"),
    usesShortestPath: hasFact(facts, "shortest-path-relaxation"),
    usesDisjointSet: hasFact(facts, "disjoint-set-union"),
    usesMstLogic: hasFact(facts, "minimum-spanning-tree")
  };

  const variableNames = facts.metrics.variableNames.length ? facts.metrics.variableNames : extractVariableNames(content);
  signals.hasPoorVariableNames = hasFact(facts, "poor-variable-names") || variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans", "g"].includes(name) && variableNames.length > 4);

  if (signals.usesGraphAdjacency) detected.push("Built graph adjacency structure");
  if (signals.usesGraphTraversal) detected.push("Used graph traversal pattern");
  if (signals.usesTopologicalSort) detected.push("Used topological-sort logic");
  if (signals.usesShortestPath) detected.push("Used shortest-path style relaxation");
  if (signals.usesDisjointSet) detected.push("Used disjoint-set union structure");
  if (signals.usesMstLogic) detected.push("Used MST-style edge selection logic");

  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle graph edge cases clearly.");

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

export function detectGraphConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "graph-intro") return analysis.signals.usesGraphAdjacency;
    if (concept === "adjacency-list") return analysis.signals.usesGraphAdjacency;
    if (concept === "dfs-graph") return analysis.signals.usesGraphTraversal;
    if (concept === "bfs-graph") return analysis.signals.usesGraphTraversal;
    if (concept === "connected-components") return analysis.signals.usesGraphTraversal;
    if (concept === "cycle-detection") return analysis.signals.usesGraphTraversal;
    if (concept === "topological-sort") return analysis.signals.usesTopologicalSort;
    if (concept === "shortest-path-unweighted") return analysis.signals.usesGraphTraversal || analysis.signals.usesShortestPath;
    if (concept === "dijkstra") return analysis.signals.usesShortestPath;
    if (concept === "union-find") return analysis.signals.usesDisjointSet;
    if (concept === "mst") return analysis.signals.usesMstLogic;
    if (concept === "grid-bfs") return analysis.signals.usesGraphTraversal;
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
