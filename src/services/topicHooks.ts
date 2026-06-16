import fs from "fs";
import { AnalysisResult, ConceptDetectionResult, Problem } from "../types";
import { analyzeBitJavaContent, detectBitConcepts } from "./topics/bitManipulationHooks";
import { analyzeArraysJavaContent, detectArraysConcepts } from "./topics/arraysHooks";
import { analyzeBinarySearchJavaContent, detectBinarySearchConcepts } from "./topics/binarySearchHooks";
import { analyzeDpJavaContent, detectDpConcepts } from "./topics/dpHooks";
import { analyzeGraphJavaContent, detectGraphConcepts } from "./topics/graphHooks";
import { analyzeLinkedListJavaContent, detectLinkedListConcepts } from "./topics/linkedListHooks";
import { analyzeQueueJavaContent, detectQueueConcepts } from "./topics/queueHooks";
import { analyzeRecursionJavaContent, detectRecursionConcepts } from "./topics/recursionHooks";
import { analyzeStackJavaContent, detectStackConcepts } from "./topics/stackHooks";
import { analyzeTreeJavaContent, detectTreeConcepts } from "./topics/treeHooks";

export function analyzeJavaFileForProblem(problem: Problem, filePath: string): AnalysisResult {
  const content = fs.readFileSync(filePath, "utf-8");
  return analyzeJavaContentForProblem(problem, content);
}

export function analyzeJavaContentForProblem(problem: Problem, content: string): AnalysisResult {
  if (problem.topic === "Arrays") {
    return analyzeArraysJavaContent(content);
  }
  if (problem.topic === "Binary Search") {
    return analyzeBinarySearchJavaContent(content);
  }
  if (problem.topic === "Dynamic Programming") {
    return analyzeDpJavaContent(content);
  }
  if (problem.topic === "Graphs") {
    return analyzeGraphJavaContent(content);
  }
  if (problem.topic === "Linked List") {
    return analyzeLinkedListJavaContent(content);
  }
  if (problem.topic === "Recursion") {
    return analyzeRecursionJavaContent(content);
  }
  if (problem.topic === "Queue") {
    return analyzeQueueJavaContent(content);
  }
  if (problem.topic === "Stack") {
    return analyzeStackJavaContent(content);
  }
  if (problem.topic === "Trees") {
    return analyzeTreeJavaContent(content);
  }
  return analyzeBitJavaContent(content);
}

export function detectConceptsForProblem(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  if (problem.topic === "Arrays") {
    return detectArraysConcepts(problem, analysis);
  }
  if (problem.topic === "Binary Search") {
    return detectBinarySearchConcepts(problem, analysis);
  }
  if (problem.topic === "Dynamic Programming") {
    return detectDpConcepts(problem, analysis);
  }
  if (problem.topic === "Graphs") {
    return detectGraphConcepts(problem, analysis);
  }
  if (problem.topic === "Linked List") {
    return detectLinkedListConcepts(problem, analysis);
  }
  if (problem.topic === "Recursion") {
    return detectRecursionConcepts(problem, analysis);
  }
  if (problem.topic === "Queue") {
    return detectQueueConcepts(problem, analysis);
  }
  if (problem.topic === "Stack") {
    return detectStackConcepts(problem, analysis);
  }
  if (problem.topic === "Trees") {
    return detectTreeConcepts(problem, analysis);
  }
  return detectBitConcepts(problem, analysis);
}
