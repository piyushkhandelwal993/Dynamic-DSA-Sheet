import { ConceptDetectionResult, Problem } from "../../types";
import { FactExpectation, getConceptExpectation } from "./expectations";
import { CodeFact, CodeFacts, FactConfidence } from "./facts";

export interface ExpectationMatch {
  conceptId: string;
  matched: boolean;
  confidence: number;
  evidence: string[];
  factIds: string[];
}

export interface ProblemExpectationResult {
  detection: ConceptDetectionResult;
  matches: ExpectationMatch[];
  conceptMatchScore: number;
}

const confidenceScore: Record<FactConfidence, number> = {
  high: 1,
  medium: 0.7,
  low: 0.4
};

export function matchProblemExpectations(problem: Problem, facts: CodeFacts): ProblemExpectationResult {
  const matches = problem.expectedConcepts.map((conceptId) => {
    const expectation = getConceptExpectation(problem.id, conceptId);
    if (!expectation) {
      return { conceptId, matched: false, confidence: 0, evidence: [], factIds: [] };
    }
    return { conceptId, ...matchExpectation(expectation, facts) };
  });

  const detection = {
    matchedConcepts: matches.filter((match) => match.matched).map((match) => match.conceptId),
    missingConcepts: matches.filter((match) => !match.matched).map((match) => match.conceptId)
  };
  const conceptMatchScore = problem.expectedConcepts.length
    ? Math.round((matches.reduce((sum, match) => sum + match.confidence, 0) / problem.expectedConcepts.length) * 100)
    : 100;

  return { detection, matches, conceptMatchScore };
}

function matchExpectation(expectation: FactExpectation, facts: CodeFacts): Omit<ExpectationMatch, "conceptId"> {
  if ("fact" in expectation) {
    const matchedFact = findFact(facts, expectation.fact);
    return matchedFact
      ? {
          matched: true,
          confidence: confidenceScore[matchedFact.confidence],
          evidence: matchedFact.evidence,
          factIds: [matchedFact.id]
        }
      : { matched: false, confidence: 0, evidence: [], factIds: [] };
  }

  if ("allOf" in expectation) {
    const children = expectation.allOf.map((child) => matchExpectation(child, facts));
    const matched = children.every((child) => child.matched);
    return {
      matched,
      confidence: matched ? Math.min(...children.map((child) => child.confidence)) : 0,
      evidence: matched ? unique(children.flatMap((child) => child.evidence)) : [],
      factIds: matched ? unique(children.flatMap((child) => child.factIds)) : []
    };
  }

  const children = expectation.anyOf.map((child) => matchExpectation(child, facts));
  const best = children.filter((child) => child.matched).sort((a, b) => b.confidence - a.confidence)[0];
  return best ?? { matched: false, confidence: 0, evidence: [], factIds: [] };
}

function findFact(facts: CodeFacts, id: string): CodeFact | undefined {
  return [
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].find((item) => item.id === id);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
