import { AnalysisResult, ConceptDetectionResult, Problem } from "../types";
import { detectBitConcepts } from "./topics/bitManipulationHooks";
import { detectConceptsForProblem } from "./topicHooks";

export function detectConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  return detectBitConcepts(problem, analysis);
}

export function detectConceptsForTopic(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  return detectConceptsForProblem(problem, analysis);
}
