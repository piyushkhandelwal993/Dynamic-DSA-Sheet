import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { createEmptyAnalysisResult } from "../analysisUtils";

const poorVariableRegex = /\b(?:int|long|boolean|String|Integer|List|ArrayList|Queue|Deque)\s+([a-zA-Z_]\w*)/g;

export function analyzeGraphJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const detected: string[] = [];
  const warnings: string[] = [];

  const loopCount = content.match(/\b(for|while)\s*\(/g)?.length ?? 0;
  const adjacencyPattern = /(ArrayList<.*>.*graph|List<.*>.*graph|adj\b|adjacency|neighbors|edges)/;
  const traversalPattern = /(visited|vis)\s*\[|dfs\s*\(|bfs\s*\(|Queue<|ArrayDeque<|Stack<|\.get\s*\(|neighbors/;
  const topoPattern = /(indegree|inDegree|topo|topological|Queue<.*>\s+\w+.*indegree|dfsOrder|stack\.push)/;
  const shortestPathPattern = /(dist\s*\[|distance|PriorityQueue<|relax|weight|dijkstra|bellman|floyd)/i;
  const dsuPattern = /(parent\s*\[|rank\s*\[|size\s*\[|find\s*\(|union\s*\(|path compression)/i;
  const mstPattern = /(kruskal|prim|PriorityQueue<|mst|minimum spanning|union\s*\()/i;
  const hardcodedReturnPattern = /\breturn\s+(true|false|\d+|"[^"]*")\s*;/;

  const signals = {
    ...base.signals,
    hasUnnecessaryLoop: loopCount > 3 && !topoPattern.test(content) && !shortestPathPattern.test(content),
    hasHardcoding: hardcodedReturnPattern.test(content) && !adjacencyPattern.test(content),
    missingEdgeCaseHandling: !/(n\s*==\s*0|graph\.size\(\)\s*==\s*0|visited|queue\.isEmpty\(\)|pq\.isEmpty\(\)|null)/.test(content),
    usesGraphAdjacency: adjacencyPattern.test(content),
    usesGraphTraversal: traversalPattern.test(content),
    usesTopologicalSort: topoPattern.test(content),
    usesShortestPath: shortestPathPattern.test(content),
    usesDisjointSet: dsuPattern.test(content),
    usesMstLogic: mstPattern.test(content)
  };

  const variableNames: string[] = [];
  let match = poorVariableRegex.exec(content);
  while (match) {
    variableNames.push(match[1]);
    match = poorVariableRegex.exec(content);
  }
  signals.hasPoorVariableNames = variableNames.some((name) => ["a", "b", "x", "y", "temp", "ans", "g"].includes(name) && variableNames.length > 4);

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
