import {
  ExternalPracticeProblem,
  Problem,
  ProgressState,
  SkillProfile,
  TargetProblemAssessment,
  TargetProblemRoadmapPlan,
  TargetProblemRoadmapStep,
  TopicMeta
} from "../types";
import { getExternalPracticeCatalog } from "./externalPractice";
import {
  getConceptById,
  getProgress,
  getSkillProfile,
  getTopicMetas,
  getTopicProblems
} from "./storage";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeExternalUrl(input: string): string {
  try {
    const url = new URL(input.trim());
    url.hash = "";
    url.search = "";
    let normalizedPath = url.pathname.replace(/\/+$/, "");
    if (!normalizedPath) normalizedPath = "/";
    return `${url.origin}${normalizedPath}`.toLowerCase();
  } catch {
    return input.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function averageConceptScore(conceptIds: string[], skillProfile: SkillProfile): number {
  if (!conceptIds.length) return 0;
  return conceptIds.reduce((sum, conceptId) => sum + (skillProfile.conceptScores[conceptId] ?? 0), 0) / conceptIds.length;
}

function solved(progress: ProgressState, problemId: string): boolean {
  const state = progress.problems[problemId];
  return Boolean(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
}

function internalPriority(problem: Problem): number {
  switch (problem.difficulty) {
    case "Easy":
      return 0;
    case "Medium":
      return 1;
    case "Hard":
      return 2;
  }
}

export function findCatalogedTargetProblem(inputUrl: string): ExternalPracticeProblem | undefined {
  const normalized = normalizeExternalUrl(inputUrl);
  return getExternalPracticeCatalog().find((problem) => normalizeExternalUrl(problem.url) === normalized);
}

export function assessTargetProblemReadiness(
  inputUrl: string,
  progress = getProgress(),
  skillProfile = getSkillProfile()
): TargetProblemAssessment {
  const normalizedUrl = normalizeExternalUrl(inputUrl);
  const matchedProblem = findCatalogedTargetProblem(inputUrl);

  if (!matchedProblem) {
    return {
      inputUrl,
      normalizedUrl,
      readinessScore: 0,
      verdict: "unsupported",
      readyNow: false,
      reasons: ["This URL is not in the current external problem catalog yet."],
      strengthConceptIds: [],
      missingConceptIds: []
    };
  }

  const prerequisiteAverage = averageConceptScore(matchedProblem.prerequisiteConceptIds, skillProfile);
  const strengthConceptIds = matchedProblem.prerequisiteConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 80);
  const missingConceptIds = matchedProblem.prerequisiteConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < 75);
  const mappedSolvedCount = matchedProblem.mappedFromProblemIds.filter((problemId) => solved(progress, problemId)).length;
  const mappedSolvedRatio = matchedProblem.mappedFromProblemIds.length
    ? mappedSolvedCount / matchedProblem.mappedFromProblemIds.length
    : 0;
  const difficultyTarget = matchedProblem.difficulty === "Easy" ? 72 : matchedProblem.difficulty === "Medium" ? 82 : 90;
  const difficultyFit = clamp(100 - Math.max(0, difficultyTarget - prerequisiteAverage));
  const readinessScore = clamp(prerequisiteAverage * 0.55 + mappedSolvedRatio * 25 + difficultyFit * 0.2);

  let verdict: TargetProblemAssessment["verdict"] = "not-ready";
  if (readinessScore >= 80 && missingConceptIds.length === 0) {
    verdict = "ready";
  } else if (readinessScore >= 60) {
    verdict = "close";
  }

  const reasons = [
    mappedSolvedCount > 0
      ? `You have already solved ${mappedSolvedCount} mapped sheet problem(s) related to this target.`
      : "You have not yet solved any mapped sheet problems for this target.",
    `Average prerequisite readiness is ${Math.round(prerequisiteAverage)}%.`,
    missingConceptIds.length > 0
      ? `You still need stronger command of ${missingConceptIds.length} prerequisite concept(s).`
      : "All prerequisite concepts are currently above the readiness threshold."
  ];

  return {
    inputUrl,
    normalizedUrl,
    matchedProblem,
    readinessScore,
    verdict,
    readyNow: verdict === "ready",
    reasons,
    strengthConceptIds,
    missingConceptIds
  };
}

function chooseInternalProblemsForConcepts(
  conceptIds: string[],
  progress: ProgressState,
  activeTopics: TopicMeta[]
): Problem[] {
  const allProblems = activeTopics.flatMap((topic) => getTopicProblems(topic.id));
  const chosen: Problem[] = [];
  const seen = new Set<string>();

  for (const conceptId of conceptIds) {
    const matches = allProblems
      .filter((problem) => !seen.has(problem.id) && !solved(progress, problem.id) && problem.expectedConcepts.includes(conceptId))
      .sort((left, right) => {
        const difficultyDelta = internalPriority(left) - internalPriority(right);
        if (difficultyDelta !== 0) return difficultyDelta;
        return left.id.localeCompare(right.id);
      });

    for (const match of matches.slice(0, 2)) {
      chosen.push(match);
      seen.add(match.id);
    }
  }

  return chosen;
}

function chooseInternalCheckpoint(
  target: ExternalPracticeProblem,
  progress: ProgressState,
  activeTopics: TopicMeta[],
  usedProblemIds: Set<string>
): Problem | undefined {
  return activeTopics
    .flatMap((topic) => getTopicProblems(topic.id))
    .filter((problem) => !usedProblemIds.has(problem.id) && !solved(progress, problem.id))
    .sort((left, right) => {
      const leftOverlap = left.expectedConcepts.filter((conceptId) => target.conceptIds.includes(conceptId)).length;
      const rightOverlap = right.expectedConcepts.filter((conceptId) => target.conceptIds.includes(conceptId)).length;
      if (rightOverlap !== leftOverlap) return rightOverlap - leftOverlap;
      const difficultyDelta = internalPriority(left) - internalPriority(right);
      if (difficultyDelta !== 0) return difficultyDelta;
      return left.id.localeCompare(right.id);
    })[0];
}

function chooseExternalTransfer(target: ExternalPracticeProblem): ExternalPracticeProblem | undefined {
  return getExternalPracticeCatalog().find(
    (problem) =>
      problem.id !== target.id &&
      problem.topicId === target.topicId &&
      problem.conceptIds.some((conceptId) => target.conceptIds.includes(conceptId))
  );
}

export function createTargetProblemRoadmap(
  inputUrl: string,
  progress = getProgress(),
  skillProfile = getSkillProfile()
): TargetProblemRoadmapPlan {
  const assessment = assessTargetProblemReadiness(inputUrl, progress, skillProfile);
  if (!assessment.matchedProblem) {
    return { assessment, steps: [] };
  }

  const target = assessment.matchedProblem;
  const activeTopics = getTopicMetas().filter((topic) => topic.status === "active");
  const internalProblems = chooseInternalProblemsForConcepts(assessment.missingConceptIds, progress, activeTopics);
  const usedInternalIds = new Set(internalProblems.map((problem) => problem.id));
  const checkpoint = chooseInternalCheckpoint(target, progress, activeTopics, usedInternalIds);
  const transfer = chooseExternalTransfer(target);

  const steps: TargetProblemRoadmapStep[] = internalProblems.map((problem) => ({
    id: `internal-${problem.id}`,
    type: "internal",
    title: `${problem.id} · ${problem.title}`,
    reason: `Build the missing concept(s): ${problem.expectedConcepts
      .filter((conceptId) => assessment.missingConceptIds.includes(conceptId))
      .map((conceptId) => getConceptById(conceptId)?.name ?? conceptId)
      .join(", ") || "core prerequisite reinforcement"}.`,
    conceptIds: problem.expectedConcepts,
    internalProblemId: problem.id
  }));

  if (checkpoint) {
    steps.push({
      id: `internal-${checkpoint.id}`,
      type: "internal",
      title: `${checkpoint.id} · ${checkpoint.title}`,
      reason: "Checkpoint your readiness on an internal problem that overlaps strongly with the target pattern.",
      conceptIds: checkpoint.expectedConcepts,
      internalProblemId: checkpoint.id
    });
  }

  if (transfer && steps.length >= 2) {
    steps.push({
      id: `external-${transfer.id}`,
      type: "external",
      title: transfer.title,
      reason: "Use one external transfer problem before retrying the target.",
      conceptIds: transfer.conceptIds,
      externalProblemId: transfer.id,
      url: transfer.url
    });
  }

  steps.push({
    id: `target-${target.id}`,
    type: "target",
    title: target.title,
    reason: assessment.readyNow
      ? "You already look ready. Retry the target now."
      : "Retry the target after finishing the internal-first roadmap steps.",
    conceptIds: target.conceptIds,
    externalProblemId: target.id,
    url: target.url
  });

  return { assessment, steps };
}
