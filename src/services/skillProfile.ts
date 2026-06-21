import { AnalysisResult, ConceptDetectionResult, Problem, ScoreBreakdown, SkillProfile } from "../types";
import { isNonBitwiseFoundationSolve } from "./approachRules";

function average(current: number, incoming: number): number {
  if (current === 0) return Math.round(incoming);
  return Math.round((current + incoming) / 2);
}

export function implementationScoreCap(problem: Problem): number {
  switch (problem.solutionMode ?? "complete-program") {
    case "guided-function":
      return 60;
    case "function":
      return 72;
    case "partial-program":
      return 85;
    case "complete-program":
      return 100;
  }
}

export function updateSkillProfileFromSubmission(
  skillProfile: SkillProfile,
  problem: Problem,
  detection: ConceptDetectionResult,
  score: ScoreBreakdown,
  analysis: AnalysisResult
): SkillProfile {
  const updated: SkillProfile = {
    ...skillProfile,
    conceptScores: { ...skillProfile.conceptScores },
    conceptAttempts: { ...skillProfile.conceptAttempts },
    conceptStrongHits: { ...skillProfile.conceptStrongHits },
    implementationScores: { ...skillProfile.implementationScores },
    implementationAttempts: { ...skillProfile.implementationAttempts },
    implementationStrongHits: { ...skillProfile.implementationStrongHits },
    weakConcepts: [...skillProfile.weakConcepts],
    strongConcepts: [...skillProfile.strongConcepts],
    submissionHistory: [...skillProfile.submissionHistory]
  };
  const nonBitwiseFoundationSolve = isNonBitwiseFoundationSolve(problem, analysis);
  const solutionMode = problem.solutionMode ?? "complete-program";
  const independenceEvidence = Math.min(score.finalScore, implementationScoreCap(problem));

  for (const conceptId of problem.expectedConcepts) {
    const matched = detection.matchedConcepts.includes(conceptId);
    const rawConceptDelta = matched ? (score.finalScore + score.conceptMatchScore) / 2 : score.conceptMatchScore / 2;
    const conceptDelta = nonBitwiseFoundationSolve ? rawConceptDelta * 0.65 : rawConceptDelta;
    updated.conceptScores[conceptId] = average(updated.conceptScores[conceptId] ?? 0, conceptDelta);
    updated.conceptAttempts[conceptId] = (updated.conceptAttempts[conceptId] ?? 0) + 1;
    if (!nonBitwiseFoundationSolve && score.finalScore >= 85 && score.conceptMatchScore >= 80 && matched) {
      updated.conceptStrongHits[conceptId] = (updated.conceptStrongHits[conceptId] ?? 0) + 1;
    }

  }

  const implementationConcepts = Array.from(
    new Set([...problem.expectedConcepts, ...(problem.independenceMilestoneFor ?? [])])
  );
  for (const conceptId of implementationConcepts) {
    const matched =
      detection.matchedConcepts.includes(conceptId) ||
      Boolean(problem.independenceMilestoneFor?.includes(conceptId));
    const implementationDelta = matched ? independenceEvidence : independenceEvidence * 0.5;
    updated.implementationScores[conceptId] = average(updated.implementationScores[conceptId] ?? 0, implementationDelta);
    updated.implementationAttempts[conceptId] = (updated.implementationAttempts[conceptId] ?? 0) + 1;
    if (
      solutionMode === "complete-program" &&
      !nonBitwiseFoundationSolve &&
      score.finalScore >= 85 &&
      score.conceptMatchScore >= 80 &&
      matched
    ) {
      updated.implementationStrongHits[conceptId] = (updated.implementationStrongHits[conceptId] ?? 0) + 1;
    }
  }

  updated.submissionHistory = [
    ...updated.submissionHistory,
    {
      problemId: problem.id,
      submittedAt: new Date().toISOString(),
      finalScore: score.finalScore,
      conceptMatchScore: score.conceptMatchScore,
      detectedConcepts: detection.matchedConcepts,
      missingConcepts: detection.missingConcepts,
      solutionMode,
      implementationScore: independenceEvidence
    }
  ];

  updated.weakConcepts = Object.entries(updated.conceptScores)
    .filter(([conceptId, scoreValue]) => updated.conceptAttempts[conceptId] > 0 && scoreValue < 60)
    .map(([conceptId]) => conceptId);

  updated.strongConcepts = Object.entries(updated.conceptScores)
    .filter(
      ([conceptId, scoreValue]) =>
        scoreValue >= 80 &&
        (updated.conceptStrongHits[conceptId] ?? 0) >= 3 &&
        (updated.implementationScores[conceptId] ?? 0) >= 70 &&
        (updated.implementationStrongHits[conceptId] ?? 0) >= 1
    )
    .map(([conceptId]) => conceptId);

  return updated;
}

export function isConceptMastered(skillProfile: SkillProfile, conceptId: string): boolean {
  return (
    (skillProfile.conceptScores[conceptId] ?? 0) >= 80 &&
    (skillProfile.conceptStrongHits[conceptId] ?? 0) >= 3 &&
    (skillProfile.implementationScores[conceptId] ?? 0) >= 70 &&
    (skillProfile.implementationStrongHits[conceptId] ?? 0) >= 1
  );
}
