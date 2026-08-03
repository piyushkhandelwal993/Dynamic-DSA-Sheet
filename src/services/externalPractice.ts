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
  currentProblem?: Problem
): ExternalPracticeProblem[] {
  return [...problems].sort((left, right) => {
    const leftRecommended = currentProblem && left.recommendedAfterProblemIds.includes(currentProblem.id) ? 0 : 1;
    const rightRecommended = currentProblem && right.recommendedAfterProblemIds.includes(currentProblem.id) ? 0 : 1;
    if (leftRecommended !== rightRecommended) return leftRecommended - rightRecommended;
    if (right.sourceQualityWeight !== left.sourceQualityWeight) return right.sourceQualityWeight - left.sourceQualityWeight;
    return left.title.localeCompare(right.title);
  });
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
  const eligible = rankProblems(externalProblems.filter((problem) => isEligible(problem, progress, skillProfile)));
  const recommendedNow = eligible
    .filter((problem) => {
      const status = state.records[problem.id]?.status ?? "unseen";
      return status === "unseen" || status === "suggested" || status === "opened";
    })
    .map((problem) =>
      toEntry(problem, state, "You have solved the mapped sheet problem and cleared the core prerequisite concepts.", problem.conceptIds, false)
    );
  const saved = eligible
    .filter((problem) => (state.records[problem.id]?.status ?? "unseen") === "saved")
    .map((problem) => toEntry(problem, state, "Saved to revisit later.", problem.conceptIds, false));
  const opened = eligible
    .filter((problem) => (state.records[problem.id]?.status ?? "unseen") === "opened")
    .map((problem) => toEntry(problem, state, "Already opened from the app.", problem.conceptIds, false));
  const completed = eligible
    .filter((problem) => (state.records[problem.id]?.status ?? "unseen") === "completed")
    .map((problem) => toEntry(problem, state, "Marked as completed outside the app.", problem.conceptIds, false));

  return {
    recommendedNow: recommendedNow.slice(0, 12),
    saved,
    opened,
    completed
  };
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
  const eligible = rankProblems(
    externalProblems.filter(
      (problem) =>
        isEligible(problem, progress, skillProfile) &&
        (problem.recommendedAfterProblemIds.includes(currentProblem.id) || problem.mappedFromProblemIds.includes(currentProblem.id))
    ),
    currentProblem
  );

  const unlocked = eligible.slice(0, 3).map((problem) => {
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
      `You showed strong readiness on ${currentProblem.id}, so this is a good transfer problem to try next.`,
      problem.conceptIds.filter((conceptId) => currentProblem.expectedConcepts.includes(conceptId)),
      !existing
    );
  });

  saveState(state);
  return unlocked;
}
