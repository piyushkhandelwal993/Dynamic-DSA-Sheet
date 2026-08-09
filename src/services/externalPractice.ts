import externalPracticeProblems from "../data/external-practice/problems.json";
import {
  ExternalPracticeEntry,
  ExternalPracticeProblem,
  ExternalPracticeRecord,
  ExternalPracticeSnapshot,
  ExternalPracticeStatus,
  Problem,
  ProgressState,
  ScoreBreakdown,
  SkillProfile
} from "../types";
import { getBaseDir } from "./storage";
import fs from "fs";
import path from "path";

interface ExternalPracticeState {
  records: Record<string, ExternalPracticeRecord>;
}

const externalProblems = externalPracticeProblems as ExternalPracticeProblem[];
const difficultyRank: Record<ExternalPracticeProblem["difficulty"], number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3
};
const topicFamilies: string[][] = [
  ["programming-mathematics", "arrays", "recursion", "strings"],
  ["arrays", "strings", "two-pointers", "sliding-window", "prefix-suffix"],
  ["trees", "binary-search-trees"],
  ["graphs"],
  ["dp"],
  ["binary-search"],
  ["stack"],
  ["queue"],
  ["linked-list"],
  ["bit-manipulation"]
];

function getExternalPracticePath(): string {
  return path.join(getBaseDir(), "external-practice.json");
}

function readState(): ExternalPracticeState {
  const filePath = getExternalPracticePath();
  if (!fs.existsSync(filePath)) {
    return { records: {} };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ExternalPracticeState;
}

function saveState(state: ExternalPracticeState): void {
  fs.mkdirSync(getBaseDir(), { recursive: true });
  fs.writeFileSync(getExternalPracticePath(), `${JSON.stringify(state, null, 2)}\n`, "utf-8");
}

function nowIso(): string {
  return new Date().toISOString();
}

function isSolved(progress: ProgressState, problemId: string): boolean {
  const problem = progress.problems[problemId];
  return Boolean(problem && (problem.status === "solved" || (problem.bestScore ?? 0) >= 70));
}

function isEligible(problem: ExternalPracticeProblem, progress: ProgressState, skillProfile: SkillProfile): boolean {
  const prerequisiteReady = problem.prerequisiteConceptIds.every((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 70);
  const mappedSolved = problem.mappedFromProblemIds.some((problemId) => isSolved(progress, problemId));
  return prerequisiteReady && mappedSolved;
}

function isPrerequisiteReady(problem: ExternalPracticeProblem, skillProfile: SkillProfile): boolean {
  return problem.prerequisiteConceptIds.every((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 70);
}

function normalizeTopicId(topic: string): string {
  return topic.toLowerCase().replace(/\s+/g, "-");
}

function topicFamilyFor(topicId: string): string[] {
  return topicFamilies.find((family) => family.includes(topicId)) ?? [topicId];
}

function uniqueByProblemId<T extends { problem: ExternalPracticeProblem }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.problem.id)) return false;
    seen.add(item.problem.id);
    return true;
  });
}

function averageConceptScore(conceptIds: string[], skillProfile: SkillProfile): number {
  if (conceptIds.length === 0) return 0;
  const total = conceptIds.reduce((sum, conceptId) => sum + (skillProfile.conceptScores[conceptId] ?? 0), 0);
  return total / conceptIds.length;
}

function countIntersect(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function preferredDifficulty(skillProfile: SkillProfile, conceptIds: string[]): ExternalPracticeProblem["difficulty"] {
  const avg = averageConceptScore(conceptIds, skillProfile);
  if (avg >= 88) return "Hard";
  if (avg >= 78) return "Medium";
  return "Easy";
}

function difficultyDistance(
  actual: ExternalPracticeProblem["difficulty"],
  preferred: ExternalPracticeProblem["difficulty"]
): number {
  return Math.abs(difficultyRank[actual] - difficultyRank[preferred]);
}

function buildReadinessReason(
  problem: ExternalPracticeProblem,
  matchedConceptIds: string[],
  skillProfile: SkillProfile,
  currentProblem?: Problem
): string {
  const avgPrereq = Math.round(averageConceptScore(problem.prerequisiteConceptIds, skillProfile));
  if (currentProblem && matchedConceptIds.length > 0) {
    return `Strong transfer from ${currentProblem.id}: overlap on ${matchedConceptIds.join(", ")} with prerequisite readiness around ${avgPrereq}%.`;
  }
  if (matchedConceptIds.length > 0) {
    return `Ready now because you have already built ${matchedConceptIds.join(", ")} with roughly ${avgPrereq}% prerequisite readiness.`;
  }
  return `Ready now because the mapped sheet problems are solved and prerequisite readiness is about ${avgPrereq}%.`;
}

function scoreProblem(
  problem: ExternalPracticeProblem,
  progress: ProgressState,
  skillProfile: SkillProfile,
  state: ExternalPracticeState,
  currentProblem?: Problem
): { matchedConceptIds: string[]; score: number; readinessReason: string } {
  const prerequisiteAverage = averageConceptScore(problem.prerequisiteConceptIds, skillProfile);
  const matchedConceptIds = currentProblem
    ? problem.conceptIds.filter((conceptId) => currentProblem.expectedConcepts.includes(conceptId))
    : problem.conceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 80);
  const overlapCount = currentProblem ? countIntersect(problem.conceptIds, currentProblem.expectedConcepts) : 0;
  const mappedSolvedCount = problem.mappedFromProblemIds.filter((problemId) => isSolved(progress, problemId)).length;
  const preferred = preferredDifficulty(skillProfile, problem.prerequisiteConceptIds);
  const difficultyFit = 12 - difficultyDistance(problem.difficulty, preferred) * 6;
  const strongConceptBonus = problem.conceptIds.reduce(
    (sum, conceptId) => sum + (skillProfile.strongConcepts.includes(conceptId) ? 5 : 0),
    0
  );
  const weakConceptPenalty = problem.conceptIds.reduce(
    (sum, conceptId) => sum + (skillProfile.weakConcepts.includes(conceptId) ? 4 : 0),
    0
  );
  const currentRecommendedBonus = currentProblem && problem.recommendedAfterProblemIds.includes(currentProblem.id) ? 30 : 0;
  const currentMappedBonus = currentProblem && problem.mappedFromProblemIds.includes(currentProblem.id) ? 16 : 0;
  const recentSubmissionBonus = currentProblem ? overlapCount * 14 : matchedConceptIds.length * 6;
  const record = state.records[problem.id];
  const dismissedPenalty = record?.status === "dismissed" ? 18 : 0;
  const openedPenalty = record?.status === "opened" ? 4 : 0;
  const suggestedPenalty = record?.status === "suggested" ? 2 : 0;

  const score =
    currentRecommendedBonus +
    currentMappedBonus +
    recentSubmissionBonus +
    mappedSolvedCount * 7 +
    prerequisiteAverage * 0.35 +
    difficultyFit +
    strongConceptBonus +
    problem.sourceQualityWeight * 10 -
    weakConceptPenalty -
    dismissedPenalty -
    openedPenalty -
    suggestedPenalty;

  return {
    matchedConceptIds,
    score,
    readinessReason: buildReadinessReason(problem, matchedConceptIds, skillProfile, currentProblem)
  };
}

function toEntry(
  problem: ExternalPracticeProblem,
  state: ExternalPracticeState,
  readinessReason: string,
  matchedConceptIds: string[],
  newlyUnlocked: boolean
): ExternalPracticeEntry {
  return {
    problem,
    status: state.records[problem.id]?.status ?? "unseen",
    readinessReason,
    matchedConceptIds,
    newlyUnlocked
  };
}

function rankProblems(
  problems: ExternalPracticeProblem[],
  progress: ProgressState,
  skillProfile: SkillProfile,
  state: ExternalPracticeState,
  currentProblem?: Problem
): Array<{ problem: ExternalPracticeProblem; matchedConceptIds: string[]; readinessReason: string; score: number }> {
  return problems
    .map((problem) => ({
      problem,
      ...scoreProblem(problem, progress, skillProfile, state, currentProblem)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.problem.sourceQualityWeight !== left.problem.sourceQualityWeight) {
        return right.problem.sourceQualityWeight - left.problem.sourceQualityWeight;
      }
      return left.problem.title.localeCompare(right.problem.title);
    });
}

function choosePersonalizedRecommendations(
  ranked: Array<{ problem: ExternalPracticeProblem; matchedConceptIds: string[]; readinessReason: string; score: number }>,
  skillProfile: SkillProfile,
  currentProblem?: Problem,
  limit = 4
): Array<{ problem: ExternalPracticeProblem; matchedConceptIds: string[]; readinessReason: string; score: number }> {
  if (ranked.length <= limit) {
    return ranked;
  }

  const currentConcepts = new Set(currentProblem?.expectedConcepts ?? []);
  const weakConcepts = new Set(skillProfile.weakConcepts);
  const preferred = preferredDifficulty(skillProfile, currentProblem?.expectedConcepts ?? []);

  const transfer = ranked.filter(({ problem, matchedConceptIds }) =>
    matchedConceptIds.length > 0 || problem.conceptIds.some((conceptId) => currentConcepts.has(conceptId))
  );
  const weakArea = ranked.filter(({ problem }) => problem.conceptIds.some((conceptId) => weakConcepts.has(conceptId)));
  const confidence = ranked.filter(({ problem }) => difficultyRank[problem.difficulty] <= Math.max(1, difficultyRank[preferred] - 1));
  const stretch = ranked.filter(({ problem }) => difficultyRank[problem.difficulty] >= Math.min(3, difficultyRank[preferred] + 1));

  const orderedBuckets = [
    transfer[0],
    weakArea[0],
    difficultyRank[preferred] === 1 ? confidence[0] ?? ranked.find(({ problem }) => problem.difficulty === "Easy") : confidence[0],
    difficultyRank[preferred] >= 2 ? stretch[0] : ranked.find(({ problem }) => problem.difficulty === "Medium"),
    ...ranked
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return uniqueByProblemId(orderedBuckets).slice(0, limit);
}

export function getExternalPracticeCatalog(): ExternalPracticeProblem[] {
  return externalProblems;
}

export function markExternalPracticeStatus(problemId: string, status: ExternalPracticeStatus): ExternalPracticeRecord {
  const state = readState();
  const current = state.records[problemId] ?? { problemId, status: "unseen" as ExternalPracticeStatus };
  const timestamp = nowIso();
  const updated: ExternalPracticeRecord = {
    ...current,
    status,
    firstSuggestedAt: current.firstSuggestedAt,
    lastSuggestedAt: current.lastSuggestedAt
  };

  if (status === "saved") updated.savedAt = timestamp;
  if (status === "opened") updated.openedAt = timestamp;
  if (status === "completed") updated.completedAt = timestamp;
  if (status === "dismissed") updated.dismissedAt = timestamp;

  state.records[problemId] = updated;
  saveState(state);
  return updated;
}

export function openExternalPracticeProblem(problemId: string): ExternalPracticeRecord {
  return markExternalPracticeStatus(problemId, "opened");
}

export function saveExternalPracticeProblem(problemId: string): ExternalPracticeRecord {
  return markExternalPracticeStatus(problemId, "saved");
}

export function dismissExternalPracticeProblem(problemId: string): ExternalPracticeRecord {
  return markExternalPracticeStatus(problemId, "dismissed");
}

export function completeExternalPracticeProblem(problemId: string): ExternalPracticeRecord {
  return markExternalPracticeStatus(problemId, "completed");
}

export function getExternalPracticeSnapshot(progress: ProgressState, skillProfile: SkillProfile): ExternalPracticeSnapshot {
  const state = readState();
  const eligible = rankProblems(
    externalProblems.filter((problem) => isEligible(problem, progress, skillProfile)),
    progress,
    skillProfile,
    state
  );
  const recommendedNow = eligible
    .filter(({ problem }) => {
      const status = state.records[problem.id]?.status ?? "unseen";
      return status === "unseen" || status === "suggested" || status === "opened";
    })
    .map(({ problem, matchedConceptIds, readinessReason }) => toEntry(problem, state, readinessReason, matchedConceptIds, false));
  const saved = eligible
    .filter(({ problem }) => (state.records[problem.id]?.status ?? "unseen") === "saved")
    .map(({ problem, matchedConceptIds }) => toEntry(problem, state, "Saved to revisit later.", matchedConceptIds, false));
  const opened = eligible
    .filter(({ problem }) => (state.records[problem.id]?.status ?? "unseen") === "opened")
    .map(({ problem, matchedConceptIds }) => toEntry(problem, state, "Already opened from the app.", matchedConceptIds, false));
  const completed = eligible
    .filter(({ problem }) => (state.records[problem.id]?.status ?? "unseen") === "completed")
    .map(({ problem, matchedConceptIds }) => toEntry(problem, state, "Marked as completed outside the app.", matchedConceptIds, false));

  return {
    recommendedNow: recommendedNow.slice(0, 12),
    saved,
    opened,
    completed
  };
}

function collectUnlockCandidates(
  currentProblem: Problem,
  progress: ProgressState,
  skillProfile: SkillProfile,
  state: ExternalPracticeState
): Array<{ problem: ExternalPracticeProblem; matchedConceptIds: string[]; readinessReason: string; score: number }> {
  const directMatches = rankProblems(
    externalProblems.filter(
      (problem) =>
        isEligible(problem, progress, skillProfile) &&
        (problem.recommendedAfterProblemIds.includes(currentProblem.id) || problem.mappedFromProblemIds.includes(currentProblem.id))
    ),
    progress,
    skillProfile,
    state,
    currentProblem
  );
  const directMatchIds = new Set(directMatches.map(({ problem }) => problem.id));
  const normalizedCurrentTopicId = normalizeTopicId(currentProblem.topic ?? "");
  const currentTopicFamily = topicFamilyFor(normalizedCurrentTopicId);
  const fallbackMatches = rankProblems(
    externalProblems.filter((problem) => {
      if (!isPrerequisiteReady(problem, skillProfile)) return false;
      if (directMatchIds.has(problem.id)) return false;
      return (
        currentTopicFamily.includes(problem.topicId) ||
        problem.conceptIds.some((conceptId) => currentProblem.expectedConcepts.includes(conceptId))
      );
    }),
    progress,
    skillProfile,
    state,
    currentProblem
  );
  return choosePersonalizedRecommendations([...directMatches, ...fallbackMatches], skillProfile, currentProblem, 4);
}

export function getExternalPracticeUnlocksForSubmission(
  currentProblem: Problem,
  progress: ProgressState,
  skillProfile: SkillProfile,
  score: ScoreBreakdown,
  masteredSubmission: boolean
): ExternalPracticeEntry[] {
  if (!masteredSubmission || score.finalScore < 75 || score.conceptMatchScore < 80) {
    return [];
  }

  const state = readState();
  const eligible = collectUnlockCandidates(currentProblem, progress, skillProfile, state);

  const unlocked = eligible.map(({ problem, matchedConceptIds, readinessReason }) => {
    const existing = state.records[problem.id];
    const timestamp = nowIso();
    state.records[problem.id] = {
      problemId: problem.id,
      status: existing?.status === "saved" || existing?.status === "opened" || existing?.status === "completed"
        ? existing.status
        : "suggested",
      firstSuggestedAt: existing?.firstSuggestedAt ?? timestamp,
      lastSuggestedAt: timestamp,
      openedAt: existing?.openedAt,
      completedAt: existing?.completedAt,
      savedAt: existing?.savedAt,
      dismissedAt: existing?.dismissedAt
    };
    return toEntry(
      problem,
      state,
      readinessReason,
      matchedConceptIds,
      !existing
    );
  });

  saveState(state);
  return unlocked;
}

export const __testables = {
  rankProblems,
  scoreProblem,
  preferredDifficulty,
  collectUnlockCandidates,
  choosePersonalizedRecommendations
};
