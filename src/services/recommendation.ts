import { AnalysisResult, Problem, ProgressState, RecommendationResult, SkillProfile } from "../types";
import { isRevisionDue } from "./revision";
import { isConceptMastered } from "./skillProfile";
import { isNonBitwiseFoundationSolve } from "./approachRules";

const difficultyRank: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3
};

function hasWeakPrerequisite(problem: Problem, skillProfile: SkillProfile): boolean {
  return problem.prerequisiteConcepts.some((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < 50);
}

function isSolved(progress: ProgressState, problemId: string): boolean {
  const state = progress.problems[problemId];
  return Boolean(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
}

function findIndependenceMilestone(
  problems: Problem[],
  conceptIds: string[],
  progress: ProgressState
): Problem | undefined {
  return problems.find(
    (candidate) =>
      (candidate.solutionMode ?? "complete-program") === "complete-program" &&
      !isSolved(progress, candidate.id) &&
      candidate.independenceMilestoneFor?.some((conceptId) => conceptIds.includes(conceptId))
  );
}

function findNextHigherProblem(problems: Problem[], problem: Problem, skillProfile: SkillProfile): Problem | undefined {
  return problems.find(
    (candidate) =>
      candidate.id !== problem.id &&
      candidate.expectedConcepts.some((conceptId) => problem.expectedConcepts.includes(conceptId)) &&
      difficultyRank[candidate.difficulty] > difficultyRank[problem.difficulty] &&
      !hasWeakPrerequisite(candidate, skillProfile)
  );
}

function findExtraPracticeProblems(problems: Problem[], problem: Problem, excludeId?: string): string[] {
  return problems
    .filter(
      (candidate) =>
        candidate.id !== problem.id &&
        candidate.id !== excludeId &&
        candidate.difficulty === "Easy" &&
        candidate.expectedConcepts.some((conceptId) => problem.expectedConcepts.includes(conceptId))
    )
    .sort((a, b) => {
      const primaryConcept = problem.expectedConcepts[0];
      const aPrimary = a.expectedConcepts.includes(primaryConcept) ? 0 : 1;
      const bPrimary = b.expectedConcepts.includes(primaryConcept) ? 0 : 1;
      if (aPrimary !== bPrimary) return aPrimary - bPrimary;

      const aSameSubtopic = a.subtopic === problem.subtopic ? 0 : 1;
      const bSameSubtopic = b.subtopic === problem.subtopic ? 0 : 1;
      if (aSameSubtopic !== bSameSubtopic) return aSameSubtopic - bSameSubtopic;

      return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
    })
    .map((candidate) => candidate.id)
    .slice(0, 2);
}

function uniqueProblemIds(ids: Array<string | undefined>): string[] {
  return Array.from(new Set(ids.filter((value): value is string => Boolean(value))));
}

export function recommendNextProblem(problems: Problem[], progress: ProgressState, skillProfile: SkillProfile): RecommendationResult {
  const dueProblem = problems.find((problem) => isRevisionDue(progress.problems[problem.id]?.nextRevisionDate));
  if (dueProblem) {
    return {
      type: "revise-prerequisite",
      message: `Revision due: revisit ${dueProblem.title}.`,
      problem: dueProblem,
      reasons: ["Revision-due problems are prioritized first."],
      suggestedProblemIds: [dueProblem.id],
      conceptIds: dueProblem.expectedConcepts
    };
  }

  const pendingRetryEntry = Object.values(progress.problems).find((entry) => entry.retryRequired);
  if (pendingRetryEntry) {
    const retryProblem = problems.find((problem) => problem.id === pendingRetryEntry.problemId);
    if (retryProblem) {
      return {
        type: "revise-prerequisite",
        message: `Retry ${retryProblem.title} with the required concept before moving to a new problem.`,
        problem: retryProblem,
        reasons: [pendingRetryEntry.retryReason ?? "Your last submission needs a concept-focused retry."],
        suggestedProblemIds: [retryProblem.id],
        conceptIds: pendingRetryEntry.retryConceptIds ?? retryProblem.expectedConcepts
      };
    }
  }

  const readyForIndependence = Object.keys(skillProfile.conceptScores).filter(
    (conceptId) =>
      (skillProfile.conceptScores[conceptId] ?? 0) >= 75 &&
      (skillProfile.implementationScores[conceptId] ?? 0) < 70
  );
  const independenceMilestone = findIndependenceMilestone(problems, readyForIndependence, progress);
  if (independenceMilestone) {
    const matchedConcepts = independenceMilestone.independenceMilestoneFor?.filter((conceptId) =>
      readyForIndependence.includes(conceptId)
    ) ?? [];
    return {
      type: "move-forward",
      message: `Implementation milestone: build ${independenceMilestone.title} as a complete program.`,
      problem: independenceMilestone,
      reasons: [
        "Your algorithm understanding is strong enough to remove the scaffolding.",
        "This complete-program challenge verifies input handling, supporting structures, and implementation independence."
      ],
      suggestedProblemIds: [independenceMilestone.id],
      conceptIds: matchedConcepts
    };
  }

  const weakConceptSet = new Set(skillProfile.weakConcepts);
  const unsolved = problems.filter((problem) => !isSolved(progress, problem.id));

  const sorted = unsolved
    .filter((problem) => {
      if (problem.difficulty === "Hard" && hasWeakPrerequisite(problem, skillProfile)) {
        return false;
      }

      const mastered = problem.expectedConcepts.some((conceptId) => isConceptMastered(skillProfile, conceptId));
      if (mastered && problem.difficulty === "Easy") {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aWeak = a.expectedConcepts.some((conceptId) => weakConceptSet.has(conceptId)) ? 0 : 1;
      const bWeak = b.expectedConcepts.some((conceptId) => weakConceptSet.has(conceptId)) ? 0 : 1;
      if (aWeak !== bWeak) return aWeak - bWeak;

      const aPrereqSolved = a.prerequisiteConcepts.every((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 60) ? 0 : 1;
      const bPrereqSolved = b.prerequisiteConcepts.every((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 60) ? 0 : 1;
      if (aPrereqSolved !== bPrereqSolved) return aPrereqSolved - bPrereqSolved;

      return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
    });

  const chosen = sorted[0] ?? problems[0];
  const masteredToSkip = problems
    .filter((problem) => problem.difficulty === "Easy" && problem.expectedConcepts.some((conceptId) => isConceptMastered(skillProfile, conceptId)))
    .map((problem) => problem.id)
    .slice(0, 3);

  if (masteredToSkip.length > 0) {
    return {
      type: "skip-basics",
      message: `Mastery detected in some beginner concepts. You can move to ${chosen.title}.`,
      problem: chosen,
      reasons: ["Three strong submissions on the same concept allow skipping similar basics."],
      suggestedProblemIds: [chosen.id, ...masteredToSkip],
      conceptIds: chosen.expectedConcepts
    };
  }

  return {
    type: weakConceptSet.size > 0 ? "extra-practice" : "move-forward",
    message: `Recommended next problem: ${chosen.title}.`,
    problem: chosen,
    reasons: [
      weakConceptSet.size > 0 ? "Weak concepts are being prioritized." : "Progression is unlocked based on solved prerequisites.",
      "Easy problems are preferred before medium and hard ones."
    ],
    suggestedProblemIds: [chosen.id, ...chosen.remedialProblems.slice(0, 2)],
    conceptIds: chosen.expectedConcepts
  };
}

export function recommendAfterSubmission(
  problem: Problem,
  problems: Problem[],
  progress: ProgressState,
  skillProfile: SkillProfile,
  score: { finalScore: number; conceptMatchScore: number; qualityScore: number; complexityScore: number },
  analysis: AnalysisResult
): RecommendationResult {
  if (isNonBitwiseFoundationSolve(problem, analysis)) {
    return {
      type: "revise-prerequisite",
      message: `Correct answer, but retry ${problem.id} using bit operators before normal progression.`,
      problem,
      reasons: ["The solution worked with modulo/string logic, but bitwise fluency is not confirmed yet."],
      suggestedProblemIds: [problem.id],
      conceptIds: problem.expectedConcepts
    };
  }

  if (score.finalScore >= 85 && score.conceptMatchScore >= 80) {
    const scaffolded = (problem.solutionMode ?? "complete-program") !== "complete-program";
    const independenceMilestone = scaffolded
      ? findIndependenceMilestone(problems, problem.expectedConcepts, progress)
      : undefined;
    if (independenceMilestone) {
      return {
        type: "move-forward",
        message: `Algorithm understood. Next, build ${independenceMilestone.title} as a complete program.`,
        problem: independenceMilestone,
        reasons: [
          "The guided function passed with strong concept evidence.",
          "This milestone removes the driver and provided structures so you can prove implementation independence."
        ],
        suggestedProblemIds: [independenceMilestone.id],
        conceptIds: problem.expectedConcepts
      };
    }

    const nextHigher = findNextHigherProblem(problems, problem, skillProfile);
    const fallbackNext = problems.find((candidate) => candidate.id !== problem.id && !isSolved(progress, candidate.id));
    const nextProblem = nextHigher ?? fallbackNext;
    return {
      type: "move-forward",
      message: scaffolded
        ? `Algorithm understood. Move forward to ${nextProblem?.title ?? "the next problem"}; a complete-program milestone will verify independence later.`
        : `Strong mastery detected. Move forward to ${nextProblem?.title ?? "the next higher problem"}.`,
      problem: nextProblem,
      reasons: scaffolded
        ? ["The function passed with strong concept evidence.", "Implementation independence is tracked separately until you solve a complete-program milestone."]
        : ["High final score and concept match show readiness for harder practice."],
      suggestedProblemIds: uniqueProblemIds([nextProblem?.id ?? problem.id, ...problem.skipIfMastered.slice(0, 2)]).slice(0, 3),
      conceptIds: problem.expectedConcepts
    };
  }

  if (score.conceptMatchScore < 60) {
    const conceptId = problem.expectedConcepts[0];
    return {
      type: "revise-prerequisite",
      message: `Your answer may work, but retry ${problem.id} using the intended concept first.`,
      reasons: ["Concept match is below 60, so remedial learning is recommended."],
      suggestedProblemIds: [problem.id],
      conceptIds: [conceptId]
    };
  }

  if (score.qualityScore < 60) {
    const extraPractice = findExtraPracticeProblems(problems, problem);
    return {
      type: "extra-practice",
      message: "Practice one more problem with cleaner code.",
      reasons: ["Code quality is low due to readability or hardcoding issues."],
      suggestedProblemIds: [...extraPractice, ...problem.remedialProblems].slice(0, 2),
      conceptIds: problem.expectedConcepts
    };
  }

  if (problem.expectedComplexity === "O(1)" && score.complexityScore < 60) {
    return {
      type: "revise-prerequisite",
      message: "Revise the intended constant-time bit trick before moving on.",
      reasons: ["The detected approach is weaker than the expected complexity."],
      suggestedProblemIds: [problem.id, ...problem.remedialProblems.slice(0, 1)],
      conceptIds: problem.expectedConcepts
    };
  }

  const generalNext = recommendNextProblem(problems, progress, skillProfile);
  const strongerConcept = problem.expectedConcepts.find((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 80);
  const fallbackPractice = findExtraPracticeProblems(problems, problem, generalNext.problem?.id);
  const suggestedProblemIds = uniqueProblemIds([generalNext.problem?.id, ...fallbackPractice]).slice(0, 2);

  return {
    ...generalNext,
    message: generalNext.problem ? `Solid attempt. Next, try ${generalNext.problem.title}.` : generalNext.message,
    conceptIds: strongerConcept ? [strongerConcept] : generalNext.conceptIds,
    suggestedProblemIds
  };
}
