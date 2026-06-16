import fs from "fs";
import { AnalysisResult, Problem } from "../types";
import { analyzeBitJavaContent } from "./topics/bitManipulationHooks";
import { analyzeRecursionJavaContent } from "./topics/recursionHooks";
import { analyzeJavaContentForProblem } from "./topicHooks";

export function analyzeJavaFile(filePath: string): AnalysisResult {
  const content = fs.readFileSync(filePath, "utf-8");
  return analyzeBitJavaContent(content);
}

export function analyzeJavaFileForProblem(problem: Problem, filePath: string): AnalysisResult {
  const content = fs.readFileSync(filePath, "utf-8");
  return analyzeJavaContentForProblem(problem, content);
}

export function analyzeJavaContent(content: string): AnalysisResult {
  return analyzeBitJavaContent(content);
}

export function analyzeRecursionContent(content: string): AnalysisResult {
  return analyzeRecursionJavaContent(content);
}
