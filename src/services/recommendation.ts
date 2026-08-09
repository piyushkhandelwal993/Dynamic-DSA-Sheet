import { AnalysisResult, PracticeMode, Problem, ProgressState, RecommendationResult, SkillProfile } from "../types";
import { isRevisionDue } from "./revision";
import { isConceptMastered } from "./skillProfile";
import { isNonBitwiseFoundationSolve } from "./approachRules";
import { getConceptById, getTopicConcepts, getTopicIdForProblem, getTopicProblems } from "./storage";
import {
  buildTopicConceptProgression,
  getNextUnlockedConceptId,
  getProblemLearningRole,
  learningRolePriority as learningRoleOrder
} from "./learningProgression";

const difficultyRank: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3
};

const treeToolkitSupportConcepts = new Set([
  "queue-library-usage",
  "hash-map-usage",
  "ordered-map-usage",
  "pair-collection-usage",
  "map-iteration-order-usage"
]);

const toolkitWeakThreshold = 45;

interface RecommendationOptions {
  practiceMode?: PracticeMode;
}

function hasWeakPrerequisite(problem: Problem, skillProfile: SkillProfile): boolean {
  return problem.prerequisiteConcepts.some((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < 50);
}

function isSolved(progress: ProgressState, problemId: string): boolean {
  const state = progress.problems[problemId];
  return Boolean(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
}

function curriculumPriority(problem: Problem): number {
  return problem.curriculumRole === "target-bridge" ? 1 : 0;
}

function poolRolePriority(problem: Problem): number {
  switch (problem.poolRole) {
    case "core":
      return 0;
    case "practice":
    case "review":
      return 1;
    case "challenge":
      return 2;
    default:
      return 1;
  }
}

function isCoreMilestone(problem: Problem): boolean {
  return problem.poolRole === "core" || Boolean(problem.independenceMilestoneFor?.length);
}

function averageScore(conceptIds: string[], skillProfile: SkillProfile): number {
  if (!conceptIds.length) {
    return 0;
  }
  return conceptIds.reduce((sum, conceptId) => sum + (skillProfile.conceptScores[conceptId] ?? 0), 0) / conceptIds.length;
}

function collectConceptDependencies(conceptId: string, seen = new Set<string>()): string[] {
  if (seen.has(conceptId)) {
    return [];
  }
  seen.add(conceptId);
  const concept = getConceptById(conceptId);
  const dependencies = concept?.dependsOn ?? [];
  return dependencies.flatMap((dependencyId) => [dependencyId, ...collectConceptDependencies(dependencyId, seen)]);
}

function findToolkitSupportProblem(
  topicId: string | undefined,
  candidateProblem: Problem | undefined,
  progress: ProgressState,
  skillProfile: SkillProfile,
  practiceMode: PracticeMode
): { problem: Problem; supportConceptId: string } | undefined {
  if (topicId !== "trees" || !candidateProblem || practiceMode !== "beginner") {
    return undefined;
  }

  const dependencyConceptIds = new Set<string>();
  [...candidateProblem.expectedConcepts, ...candidateProblem.prerequisiteConcepts].forEach((conceptId) => {
    collectConceptDependencies(conceptId).forEach((dependencyId) => dependencyConceptIds.add(dependencyId));
  });

  const weakSupportConceptIds = Array.from(dependencyConceptIds)
    .filter((conceptId) => treeToolkitSupportConcepts.has(conceptId))
    .filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < toolkitWeakThreshold)
    .sort((left, right) => (skillProfile.conceptScores[left] ?? 0) - (skillProfile.conceptScores[right] ?? 0));

  if (!weakSupportConceptIds.length) {
    return undefined;
  }

  const toolkitProblems = getTopicProblems("language-toolkit");
  for (const supportConceptId of weakSupportConceptIds) {
    const match = toolkitProblems
      .filter((problem) => !isSolved(progress, problem.id))
      .filter((problem) => problem.expectedConcepts.includes(supportConceptId))
      .sort((left, right) => {
        const poolDelta = poolRolePriority(left) - poolRolePriority(right);
        if (poolDelta !== 0) return poolDelta;
        const leftRole = left.learningRole ?? "reinforce";
        const rightRole = right.learningRole ?? "reinforce";
        const roleDelta = learningRoleOrder(leftRole, supportConceptId, skillProfile) - learningRoleOrder(rightRole, supportConceptId, skillProfile);
        if (roleDelta !== 0) return roleDelta;
        return difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
      })[0];

    if (match) {
      return { problem: match, supportConceptId };
    }
  }

  return undefined;
}

function buildRecommendationOrder(problems: Problem[], skillProfile: SkillProfile): Problem[] {
  const topicId = problems[0] ? getTopicIdForProblem(problems[0].id) : undefined;
  if (!topicId) {
    return problems;
  }

  const concepts = getTopicConcepts(topicId);
  const progression = buildTopicConceptProgression(problems, concepts);
  const nextUnlockedConceptId = getNextUnlockedConceptId(progression, skillProfile, skillProfile.weakConcepts);
  const conceptOrder = new Map(progression.orderedConceptIds.map((conceptId, index) => [conceptId, index]));

  return [...problems].sort((left, right) => {
    const leftTargetsNext = nextUnlockedConceptId && left.expectedConcepts.includes(nextUnlockedConceptId) ? 0 : 1;
    const rightTargetsNext = nextUnlockedConceptId && right.expectedConcepts.includes(nextUnlockedConceptId) ? 0 : 1;
    if (leftTargetsNext !== rightTargetsNext) return leftTargetsNext - rightTargetsNext;

    const leftCurriculum = curriculumPriority(left);
    const rightCurriculum = curriculumPriority(right);
    if (leftCurriculum !== rightCurriculum) return leftCurriculum - rightCurriculum;

    const leftConceptRank = Math.min(...left.expectedConcepts.map((conceptId) => conceptOrder.get(conceptId) ?? Number.MAX_SAFE_INTEGER));
    const rightConceptRank = Math.min(...right.expectedConcepts.map((conceptId) => conceptOrder.get(conceptId) ?? Number.MAX_SAFE_INTEGER));
    if (leftConceptRank !== rightConceptRank) return leftConceptRank - rightConceptRank;

    const leftMilestone = nextUnlockedConceptId && left.independenceMilestoneFor?.includes(nextUnlockedConceptId) ? 0 : 1;
    const rightMilestone = nextUnlockedConceptId && right.independenceMilestoneFor?.includes(nextUnlockedConceptId) ? 0 : 1;
    if (leftMilestone !== rightMilestone) return leftMilestone - rightMilestone;

    const leftPool = poolRolePriority(left);
    const rightPool = poolRolePriority(right);
    if (leftPool !== rightPool) return leftPool - rightPool;

    const leftRole = getProblemLearningRole(left, nextUnlockedConceptId, progression);
    const rightRole = getProblemLearningRole(right, nextUnlockedConceptId, progression);
    const leftRoleRank = learningRoleOrder(leftRole, nextUnlockedConceptId, skillProfile);
    const rightRoleRank = learningRoleOrder(rightRole, nextUnlockedConceptId, skillProfile);
    if (leftRoleRank !== rightRoleRank) return leftRoleRank - rightRoleRank;

    const leftWeak = left.expectedConcepts.some((conceptId) => skillProfile.weakConcepts.includes(conceptId)) ? 0 : 1;
    const rightWeak = right.expectedConcepts.some((conceptId) => skillProfile.weakConcepts.includes(conceptId)) ? 0 : 1;
    if (leftWeak !== rightWeak) return leftWeak - rightWeak;

    const leftPrereqReadiness = averageScore(left.prerequisiteConcepts, skillProfile);
    const rightPrereqReadiness = averageScore(right.prerequisiteConcepts, skillProfile);
    if (leftPrereqReadiness !== rightPrereqReadiness) return rightPrereqReadiness - leftPrereqReadiness;

    return difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
  });
}

function selectRecommendedProblem(problems: Problem[], progress: ProgressState, skillProfile: SkillProfile, excludeProblemId?: string): Problem | undefined {
  const weakConceptSet = new Set(skillProfile.weakConcepts);
  const sorted = buildRecommendationOrder(
    problems.filter((problem) => !isSolved(progress, problem.id) && problem.id !== excludeProblemId),
    skillProfile
  )
    .filter((problem) => {
      if (problem.difficulty === "Hard" && hasWeakPrerequisite(problem, skillProfile)) {
        return false;
      }

      const mastered = problem.expectedConcepts.some((conceptId) => isConceptMastered(skillProfile, conceptId));
      if (mastered && problem.difficulty === "Easy" && !isCoreMilestone(problem)) {
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

      return 0;
    });

  return sorted[0] ?? problems.find((problem) => problem.id !== excludeProblemId && !isSolved(progress, problem.id));
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

function findNextCuratedProblem(problems: Problem[], problem: Problem, progress: ProgressState, skillProfile: SkillProfile): Problem | undefined {
  const currentIndex = problems.findIndex((candidate) => candidate.id === problem.id);
  if (currentIndex < 0) {
    return undefined;
  }

  for (let index = currentIndex + 1; index < problems.length; index += 1) {
    const candidate = problems[index];
    if (isSolved(progress, candidate.id)) {
      continue;
    }
    if (hasWeakPrerequisite(candidate, skillProfile)) {
      continue;
    }
    return candidate;
  }

  return undefined;
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

export function recommendNextProblem(
  problems: Problem[],
  progress: ProgressState,
  skillProfile: SkillProfile,
  options: RecommendationOptions = {}
): RecommendationResult {
  const practiceMode = options.practiceMode ?? "beginner";
  const weakConceptSet = new Set(skillProfile.weakConcepts);
  const topicId = problems[0] ? getTopicIdForProblem(problems[0].id) : undefined;
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

  const chosen = selectRecommendedProblem(problems, progress, skillProfile) ?? problems[0];
  const toolkitSupport = findToolkitSupportProblem(topicId, chosen, progress, skillProfile, practiceMode);
  if (toolkitSupport) {
    return {
      type: "extra-practice",
      message: `Before ${chosen.title}, strengthen ${getConceptById(toolkitSupport.supportConceptId)?.name ?? toolkitSupport.supportConceptId} with ${toolkitSupport.problem.title}.`,
      problem: toolkitSupport.problem,
      reasons: [
        `${chosen.title} depends on ${getConceptById(toolkitSupport.supportConceptId)?.name ?? toolkitSupport.supportConceptId}, which is still weak.`,
        "Beginner practice mode can prepend support-skill toolkit steps before the next tree problem."
      ],
      suggestedProblemIds: [toolkitSupport.problem.id, chosen.id],
      conceptIds: [toolkitSupport.supportConceptId]
    };
  }
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
  analysis: AnalysisResult,
  options: RecommendationOptions = {}
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
    const nextCurated = findNextCuratedProblem(problems, problem, progress, skillProfile) ?? selectRecommendedProblem(problems, progress, skillProfile, problem.id);
    const nextHigher = findNextHigherProblem(problems, problem, skillProfile);
    const fallbackNext = problems.find((candidate) => candidate.id !== problem.id && !isSolved(progress, candidate.id));
    const nextProblem = nextCurated ?? nextHigher ?? fallbackNext;
    return {
      type: "move-forward",
      message: `Strong mastery detected. Move forward to ${nextProblem?.title ?? "the next higher problem"}.`,
      problem: nextProblem,
      reasons: ["High final score and concept match show readiness for harder practice."],
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

  const generalNext = recommendNextProblem(problems, progress, skillProfile, options);
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
