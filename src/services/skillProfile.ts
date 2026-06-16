import { AnalysisResult, ConceptDetectionResult, Problem, ScoreBreakdown, SkillProfile } from "../types";
import { isNonBitwiseFoundationSolve } from "./approachRules";

function average(current: number, incoming: number): number {
  if (current === 0) return Math.round(incoming);
  return Math.round((current + incoming) / 2);
}

export function updateSkillProfileFromSubmission(
  skillProfile: SkillProfile,
  problem: Problem,
  detection: ConceptDetectionResult,
  score: ScoreBreakdown,
  analysis: AnalysisResult
): SkillProfile {
  const updated = { ...skillProfile };
  const nonBitwiseFoundationSolve = isNonBitwiseFoundationSolve(problem, analysis);

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

  updated.submissionHistory = [
    ...updated.submissionHistory,
    {
      problemId: problem.id,
      submittedAt: new Date().toISOString(),
      finalScore: score.finalScore,
      conceptMatchScore: score.conceptMatchScore,
      detectedConcepts: detection.matchedConcepts,
      missingConcepts: detection.missingConcepts
    }
  ];

  updated.weakConcepts = Object.entries(updated.conceptScores)
    .filter(([conceptId, scoreValue]) => updated.conceptAttempts[conceptId] > 0 && scoreValue < 60)
    .map(([conceptId]) => conceptId);

  updated.strongConcepts = Object.entries(updated.conceptScores)
    .filter(([conceptId, scoreValue]) => scoreValue >= 80 && (updated.conceptStrongHits[conceptId] ?? 0) >= 3)
    .map(([conceptId]) => conceptId);

  return updated;
}

export function isConceptMastered(skillProfile: SkillProfile, conceptId: string): boolean {
  return skillProfile.strongConcepts.includes(conceptId) || (skillProfile.conceptStrongHits[conceptId] ?? 0) >= 3;
}
