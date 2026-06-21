export type SupportedAnalysisLanguage = "java" | "cpp" | "python" | "c";

export type FactConfidence = "low" | "medium" | "high";

export interface CodeFact {
  id: string;
  confidence: FactConfidence;
  evidence: string[];
}

export interface CodeFacts {
  language: SupportedAnalysisLanguage;
  structures: CodeFact[];
  controlFlow: CodeFact[];
  dataStructures: CodeFact[];
  algorithms: CodeFact[];
  complexitySignals: CodeFact[];
  edgeCaseSignals: CodeFact[];
  antiPatterns: CodeFact[];
  metrics: {
    loopCount: number;
    nestedLoopDepth: number;
    methodCount: number;
    variableNames: string[];
    arrayAccessCount: number;
  };
}

export function createEmptyCodeFacts(language: SupportedAnalysisLanguage): CodeFacts {
  return {
    language,
    structures: [],
    controlFlow: [],
    dataStructures: [],
    algorithms: [],
    complexitySignals: [],
    edgeCaseSignals: [],
    antiPatterns: [],
    metrics: {
      loopCount: 0,
      nestedLoopDepth: 0,
      methodCount: 0,
      variableNames: [],
      arrayAccessCount: 0
    }
  };
}

export function addFact(
  facts: CodeFacts,
  bucket: keyof Omit<CodeFacts, "language" | "metrics">,
  id: string,
  confidence: FactConfidence,
  evidence: string[] = []
): void {
  const existing = facts[bucket].find((fact) => fact.id === id);
  if (existing) {
    existing.evidence = Array.from(new Set([...existing.evidence, ...evidence]));
    if (confidenceRank(confidence) > confidenceRank(existing.confidence)) {
      existing.confidence = confidence;
    }
    return;
  }

  facts[bucket].push({
    id,
    confidence,
    evidence
  });
}

export function hasFact(facts: CodeFacts, id: string): boolean {
  return [
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].some((fact) => fact.id === id);
}

function confidenceRank(confidence: FactConfidence): number {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}
