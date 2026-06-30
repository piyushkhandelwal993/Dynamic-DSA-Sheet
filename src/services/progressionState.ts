import { ProblemProgress, ScoreBreakdown } from "../types";

export const MASTERY_FINAL_SCORE_THRESHOLD = 70;
export const MASTERY_CONCEPT_SCORE_THRESHOLD = 70;

export function isProblemSolvedState(state?: ProblemProgress): boolean {
  return state?.status === "solved";
}

export function clearsMasteryGate(
  score: Pick<ScoreBreakdown, "finalScore" | "conceptMatchScore">,
  retryRequired: boolean
): boolean {
  return (
    score.finalScore >= MASTERY_FINAL_SCORE_THRESHOLD &&
    score.conceptMatchScore >= MASTERY_CONCEPT_SCORE_THRESHOLD &&
    !retryRequired
  );
}
