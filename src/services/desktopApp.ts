import fs from "fs";
import { spawnSync } from "child_process";
import {
  ContributionInput,
  CppRuntimeStatus,
  DesktopBootstrap,
  DesktopPreferences,
  ExternalPracticeStatus,
  JavaRuntimeStatus,
  PracticeMode,
  Problem,
  ProblemSessionResult,
  ProgrammingLanguage,
  TargetProblemAssessment,
  TargetProblemRoadmapPlan,
  TargetProblemRoadmapStep
} from "../types";
import {
  getActiveTopicId,
  getConceptById,
  getDesktopPreferences,
  getGameProfile,
  getProblemById,
  getProblemStarterFilePath,
  getProfile,
  getProgress,
  getSkillProfile,
  getTopicMeta,
  getTopicMetas,
  getTopicProblems,
  getTopicRoadmap,
  getTopicIdForProblem,
  saveProfile,
  saveDesktopPreferences,
  saveProgress,
  setActiveTopicId
} from "./storage";
import { getContentSyncStatus, syncRemoteContent } from "./catalog";
import {
  buildContributionIssueUrl,
  getContributionOutboxPath,
  getContributionSyncStatus,
  listContributions,
  saveContributionDraft,
  submitContribution,
  syncContributionStatuses,
  validateContribution
} from "./contributions";
import { effectiveProblemForPracticeMode, ensureProblemWorkspace, resetProblemWorkspace } from "./workspace";
import { recommendNextProblem } from "./recommendation";
import { buildWorldZones, buildActiveQuests, getMasterySummary } from "./progression";
import { submitProblemSolution } from "./submission";
import { runJavaSubmission, runJavaWithCustomInput } from "./javaRunner";
import { runCppSubmission, runCppWithCustomInput } from "./cppRunner";
import {
  evaluateTrainingCandidates,
  exportTrainingRegressionBundle,
  generateTrainingRegressionTests,
  generateTrainingPrompts,
  getTrainingBacklogSummary,
  getTrainingProblemSummary,
  importTrainingCandidates,
  listTrainingCatalog,
  saveTrainingReview
} from "./analyzerTraining";
import {
  completeExternalPracticeProblem,
  dismissExternalPracticeProblem,
  getExternalPracticeSnapshot,
  openExternalPracticeProblem,
  saveExternalPracticeProblem
} from "./externalPractice";
import { buildRoadmapInferenceStatement } from "./problemPageIngestion";
import { assessTargetProblemReadiness, createTargetProblemRoadmap } from "./targetRoadmap";
import { exportRoadmapReviewFixtures, getRoadmapReviewWorkspace, saveRoadmapReview } from "./roadmapReviews";

function buildStreakCalendar() {
  const skillProfile = getSkillProfile();
  const counts = new Map();
  skillProfile.submissionHistory.forEach((entry) => {
    const day = entry.submittedAt.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  });

  const days = [];
  for (let offset = 27; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    const count = counts.get(iso) ?? 0;
    days.push({
      date: iso,
      count,
      level: count >= 3 ? 3 : count === 2 ? 2 : count === 1 ? 1 : 0
    });
  }
  return days;
}

function buildSkillBars() {
  return getMasterySummary(getSkillProfile())
    .slice(0, 6)
    .map((item) => ({
      conceptId: item.conceptId,
      conceptName: getConceptById(item.conceptId)?.name ?? item.conceptId,
      score: item.score,
      tier: item.tier,
      implementationScore: item.implementationScore,
      implementationTier: item.implementationTier,
      fullyMastered: item.fullyMastered
    }));
}

function buildSubmissionTrend() {
  return getSkillProfile()
    .submissionHistory.slice(-8)
    .map((entry) => ({
      problemId: entry.problemId,
      score: entry.finalScore,
      submittedAt: entry.submittedAt
    }));
}

function buildTopicProgressSummary() {
  const progress = getProgress();
  return getTopicMetas()
    .filter((topic) => topic.status === "active")
    .map((topic) => {
      const problems = getTopicProblems(topic.id);
      const solved = problems.filter((problem) => progress.problems[problem.id]?.status === "solved").length;
      return {
        topicId: topic.id,
        topicName: topic.name,
        solved,
        total: problems.length
      };
    });
}

function readVersionLine(command: string, args: string[]): { available: boolean; version?: string } {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    timeout: 3000
  });

  if (result.error || result.status !== 0) {
    return { available: false };
  }

  const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const firstLine = combined.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim();

  return {
    available: true,
    version: firstLine
  };
}

export function detectJavaRuntime(): JavaRuntimeStatus {
  const javaCheck = readVersionLine("java", ["-version"]);
  const javacCheck = readVersionLine("javac", ["-version"]);
  const available = javaCheck.available && javacCheck.available;

  let guidance = "Java is ready. You can run and submit solutions locally.";
  if (!javaCheck.available && !javacCheck.available) {
    guidance = "Java runtime and compiler were not found. Install JDK 17 or newer to run and submit solutions.";
  } else if (!javaCheck.available) {
    guidance = "Java runtime was not found. Install JDK 17 or newer so the app can execute your solutions.";
  } else if (!javacCheck.available) {
    guidance = "Java compiler was not found. Install a full JDK 17 or newer so the app can compile your solutions.";
  }

  return {
    available,
    javaAvailable: javaCheck.available,
    javacAvailable: javacCheck.available,
    javaVersion: javaCheck.version,
    javacVersion: javacCheck.version,
    guidance
  };
}

export function detectCppRuntime(): CppRuntimeStatus {
  const compilerCheck = readVersionLine("g++", ["--version"]);
  return {
    available: compilerCheck.available,
    compilerAvailable: compilerCheck.available,
    compilerVersion: compilerCheck.version,
    guidance: compilerCheck.available
      ? "C++ is ready. You can compile and run C++17 solutions locally."
      : "C++ compiler was not found. Install g++ with C++17 support to run and submit C++ solutions."
  };
}

function resolveBootstrapTopicId(requestedTopicId: string): string {
  const requested = getTopicMeta(requestedTopicId);
  if (requested) {
    return requestedTopicId;
  }

  const firstActiveTopic = getTopicMetas().find((topic) => topic.status === "active");
  return firstActiveTopic?.id ?? requestedTopicId;
}

export function getDesktopBootstrap(topicId = getActiveTopicId()): DesktopBootstrap {
  const resolvedTopicId = resolveBootstrapTopicId(topicId);
  if (resolvedTopicId !== topicId) {
    setActiveTopicId(resolvedTopicId);
  }
  const progress = getProgress();
  const skillProfile = getSkillProfile();
  const problems = getTopicProblems(resolvedTopicId);
  const nextRecommendation = recommendNextProblem(problems, progress, skillProfile);

  return {
    topics: getTopicMetas(),
    activeTopicId: resolvedTopicId,
    activeTopic: getTopicMeta(resolvedTopicId),
    roadmap: getTopicRoadmap(resolvedTopicId),
    problems,
    profile: getProfile(),
    gameProfile: getGameProfile(),
    nextRecommendation,
    worldZones: buildWorldZones(problems, progress, skillProfile, topicId),
    quests: buildActiveQuests(problems, progress, skillProfile, topicId),
    mastery: getMasterySummary(skillProfile).slice(0, 8),
    streakCalendar: buildStreakCalendar(),
    skillBars: buildSkillBars(),
    submissionTrend: buildSubmissionTrend(),
    topicProgress: buildTopicProgressSummary(),
    progressMap: progress.problems,
    recommendedTopicId: nextRecommendation.problem ? (getTopicIdForProblem(nextRecommendation.problem.id) ?? resolvedTopicId) : resolvedTopicId,
    preferences: getDesktopPreferences(),
    javaRuntime: detectJavaRuntime(),
    cppRuntime: detectCppRuntime(),
    contentSync: getContentSyncStatus(),
    contributions: listContributions(),
    contributionSync: getContributionSyncStatus(),
    externalPractice: getExternalPracticeSnapshot(progress, skillProfile)
  };
}

export async function syncDesktopContent() {
  return syncRemoteContent();
}

export function getDesktopContentSyncStatus() {
  return getContentSyncStatus();
}

export function updateDesktopProfile(input: {
  name?: string;
  batch?: string;
  preferredLanguage?: string;
  currentLevel?: "beginner" | "intermediate" | "advanced";
}) {
  const existingProfile = getProfile();
  const profile = existingProfile ?? {
    studentId: "local",
    name: "Player",
    batch: "Self-paced",
    preferredLanguage: "Java",
    currentLevel: "beginner" as const,
    activeTopicId: getActiveTopicId(),
    createdAt: new Date().toISOString()
  };

  const name = input.name?.trim() || profile.name || "Player";
  const batch = input.batch?.trim() || profile.batch || "Self-paced";
  const preferredLanguage = input.preferredLanguage?.trim() || profile.preferredLanguage || "Java";
  const currentLevel = input.currentLevel === "intermediate" || input.currentLevel === "advanced"
    ? input.currentLevel
    : "beginner";

  saveProfile({
    ...profile,
    name,
    batch,
    preferredLanguage,
    currentLevel
  });

  return getDesktopBootstrap(getActiveTopicId());
}

export function switchDesktopTopic(topicId: string) {
  const topic = getTopicMeta(topicId);
  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }
  if (topic.status !== "active") {
    throw new Error(`Topic is not active yet: ${topicId}`);
  }
  setActiveTopicId(topicId);
  return getDesktopBootstrap(topicId);
}

export function getDesktopProblem(problemId: string): Problem {
  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Problem not found: ${problemId}`);
  }
  return problem;
}

export function startDesktopProblem(
  problemId: string,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
): ProblemSessionResult {
  const catalogProblem = getDesktopProblem(problemId);
  const problem = effectiveProblemForPracticeMode(catalogProblem, practiceMode);
  const progress = getProgress();
  const current = progress.problems[problemId] ?? {
    problemId,
    status: "started" as const,
    attempts: 0,
    bestScore: 0
  };

  progress.problems[problemId] = {
    ...current,
    status: current.status === "solved" ? current.status : "started",
    startedAt: current.startedAt ?? new Date().toISOString()
  };
  saveProgress(progress);

  const workspace = ensureProblemWorkspace(catalogProblem, language, practiceMode);
  const workspaceCode = fs.readFileSync(workspace.filePath, "utf-8");

  return {
    problem,
    workspacePath: workspace.filePath,
    workspaceCode,
    created: workspace.created,
    language,
    practiceMode
  };
}

export function loadDesktopWorkspace(
  problemId: string,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
): ProblemSessionResult {
  const catalogProblem = getDesktopProblem(problemId);
  const problem = effectiveProblemForPracticeMode(catalogProblem, practiceMode);
  const workspace = ensureProblemWorkspace(catalogProblem, language, practiceMode);
  const workspaceCode = fs.readFileSync(workspace.filePath, "utf-8");
  return {
    problem,
    workspacePath: workspace.filePath,
    workspaceCode,
    created: workspace.created,
    language,
    practiceMode
  };
}

export function saveDesktopWorkspace(
  problemId: string,
  code: string,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
): ProblemSessionResult {
  const catalogProblem = getDesktopProblem(problemId);
  const problem = effectiveProblemForPracticeMode(catalogProblem, practiceMode);
  const filePath = getProblemStarterFilePath(catalogProblem, language, practiceMode);
  ensureProblemWorkspace(catalogProblem, language, practiceMode);
  fs.writeFileSync(filePath, code, "utf-8");
  return {
    problem,
    workspacePath: filePath,
    workspaceCode: code,
    created: false,
    language,
    practiceMode
  };
}

export function resetDesktopWorkspace(
  problemId: string,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
): ProblemSessionResult {
  const catalogProblem = getDesktopProblem(problemId);
  const problem = effectiveProblemForPracticeMode(catalogProblem, practiceMode);
  const workspace = resetProblemWorkspace(catalogProblem, language, practiceMode);
  return {
    problem,
    workspacePath: workspace.filePath,
    workspaceCode: workspace.workspaceCode,
    created: false,
    language,
    practiceMode
  };
}

export function submitDesktopProblem(
  problemId: string,
  code?: string,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
) {
  if (typeof code === "string") {
    saveDesktopWorkspace(problemId, code, language, practiceMode);
  }
  return submitProblemSolution(problemId, undefined, language, practiceMode);
}

export function markDesktopExternalPractice(problemId: string, status: ExternalPracticeStatus) {
  if (status === "opened") return openExternalPracticeProblem(problemId);
  if (status === "saved") return saveExternalPracticeProblem(problemId);
  if (status === "completed") return completeExternalPracticeProblem(problemId);
  return dismissExternalPracticeProblem(problemId);
}

export async function evaluateDesktopTargetProblem(inputUrl: string, problemStatement?: string) {
  const inferredStatement = await buildRoadmapInferenceStatement(inputUrl, problemStatement);
  return assessTargetProblemReadiness(inputUrl, inferredStatement);
}

export async function createDesktopTargetProblemRoadmap(inputUrl: string, problemStatement?: string) {
  const practiceMode = getDesktopPreferences().practiceMode === "pro" ? "pro" : "beginner";
  const inferredStatement = await buildRoadmapInferenceStatement(inputUrl, problemStatement);
  return createTargetProblemRoadmap(inputUrl, inferredStatement, undefined, undefined, { practiceMode });
}

function buildInternalProblemAssessment(problem: Problem): TargetProblemAssessment {
  const skillProfile = getSkillProfile();
  const topicId = getTopicIdForProblem(problem.id) ?? normalizeTopicId(problem.topic);
  const targetConceptIds = [...new Set([...(problem.prerequisiteConcepts ?? []), ...(problem.expectedConcepts ?? [])])];
  const strengthConceptIds = targetConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 80);
  const missingConceptIds = targetConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < 75);
  const averageScore = targetConceptIds.length
    ? Math.round(targetConceptIds.reduce((sum, conceptId) => sum + (skillProfile.conceptScores[conceptId] ?? 0), 0) / targetConceptIds.length)
    : 0;
  const mappedSolved = problem.remedialProblems?.filter((problemId) => {
    const progress = getProgress();
    const state = progress.problems[problemId];
    return Boolean(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
  }).length ?? 0;

  let verdict: TargetProblemAssessment["verdict"] = "not-ready";
  if (missingConceptIds.length === 0 && mappedSolved >= Math.max(0, (problem.remedialProblems?.length ?? 0) - 1)) {
    verdict = "ready";
  } else if (averageScore >= 60 || missingConceptIds.length <= 2) {
    verdict = "close";
  }

  const reasons = [
    missingConceptIds.length
      ? `You still need stronger command of ${missingConceptIds.length} prerequisite concept(s).`
      : "Your prerequisite concepts look strong for this internal problem.",
    problem.remedialProblems?.length
      ? `This problem has ${problem.remedialProblems.length} linked bridge problem(s) that can sharpen readiness.`
      : "This problem does not have explicit bridge problems, so the roadmap relies on concept-focused internal practice."
  ];

  return {
    inputUrl: `internal://${problem.id}`,
    normalizedUrl: `internal://${problem.id}`,
    inferredTitle: `${problem.id} · ${problem.title}`,
    inferredTopicId: topicId,
    inferredConceptIds: problem.expectedConcepts,
    readinessScore: Math.max(0, Math.min(100, averageScore)),
    verdict,
    readyNow: verdict === "ready",
    confidence: "High",
    reasons,
    strengthConceptIds,
    missingConceptIds
  };
}

function normalizeTopicId(topicName: string): string {
  return topicName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function chooseConceptBridgeProblemIds(problem: Problem): string[] {
  const progress = getProgress();
  const skillProfile = getSkillProfile();
  const topicId = getTopicIdForProblem(problem.id) ?? normalizeTopicId(problem.topic);
  const allProblems = getTopicMetas()
    .filter((topic) => topic.status === "active")
    .flatMap((topic) => getTopicProblems(topic.id));
  const targetDifficultyRank = problem.difficulty === "Easy" ? 0 : problem.difficulty === "Medium" ? 1 : 2;

  const targetConceptIds = [...new Set([...(problem.prerequisiteConcepts ?? []), ...(problem.expectedConcepts ?? [])])];
  const bridgeConceptIds = [...new Set(problem.prerequisiteConcepts ?? [])];
  const missingConceptIds = bridgeConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < 75);
  const candidates = missingConceptIds.flatMap((conceptId) =>
    allProblems
      .filter((candidate) => candidate.id !== problem.id)
      .filter((candidate) => candidate.expectedConcepts.includes(conceptId))
      .filter((candidate) => {
        const state = progress.problems[candidate.id];
        return !(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
      })
      .filter((candidate) => {
        const difficultyRank = candidate.difficulty === "Easy" ? 0 : candidate.difficulty === "Medium" ? 1 : 2;
        return difficultyRank <= targetDifficultyRank;
      })
      .map((candidate) => ({
        candidate,
        conceptId,
        extraConceptCount: candidate.expectedConcepts.filter((expectedConceptId) => !targetConceptIds.includes(expectedConceptId)).length,
        sameTopic: (getTopicIdForProblem(candidate.id) ?? "") === topicId,
        score:
          (candidate.expectedConcepts.includes(conceptId) ? 5 : 0) +
          (candidate.prerequisiteConcepts.some((dependencyId) => targetConceptIds.includes(dependencyId)) ? 2 : 0) +
          ((candidate.prerequisiteConcepts ?? []).some((dependencyId) => dependencyId === conceptId) ? 1 : 0) +
          (candidate.poolRole === "core" ? 2 : candidate.poolRole === "practice" ? 1 : -1) +
          (candidate.learningRole === "introduce" ? 2 : candidate.learningRole === "reinforce" ? 1 : 0) -
          (candidate.learningRole === "mastery" ? 2 : 0) -
          (candidate.difficulty === "Hard" ? 2 : candidate.difficulty === "Medium" ? 1 : 0) -
          (getTopicIdForProblem(candidate.id) === "language-toolkit" ? 0 : 0) -
          (candidate.expectedConcepts.includes(conceptId) && conceptId === "queue-library-usage" ? 2 : 0) -
          candidate.expectedConcepts.filter((expectedConceptId) => !targetConceptIds.includes(expectedConceptId)).length * 3 -
          ((skillProfile.conceptScores[conceptId] ?? 0) >= 60 ? 1 : 0)
      }))
  );

  const ordered = candidates
    .sort((left, right) =>
      right.score - left.score
      || left.extraConceptCount - right.extraConceptCount
      || Number(right.sameTopic) - Number(left.sameTopic)
      || left.candidate.id.localeCompare(right.candidate.id)
    )
    .map((item) => item.candidate.id);

  return [...new Set(ordered)].slice(0, 3);
}

export function createDesktopInternalProblemRoadmap(problemId: string): TargetProblemRoadmapPlan {
  const problem = getDesktopProblem(problemId);
  const progress = getProgress();
  const assessment = buildInternalProblemAssessment(problem);
  const solved = (candidateId: string) => {
    const state = progress.problems[candidateId];
    return Boolean(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
  };

  const bridgeIds = [
    ...(problem.remedialProblems ?? []).filter((candidateId) => candidateId !== problem.id && !solved(candidateId)),
    ...chooseConceptBridgeProblemIds(problem)
  ];
  const orderedBridgeIds = [...new Set(bridgeIds)].filter((candidateId) => candidateId !== problem.id);
  const bridgeSteps: TargetProblemRoadmapStep[] = orderedBridgeIds
    .map((candidateId) => getProblemById(candidateId))
    .filter((candidate): candidate is Problem => Boolean(candidate))
    .map((candidate, index) => ({
      id: `internal-${candidate.id}-${index}`,
      type: "internal",
      title: `${candidate.id} · ${candidate.title}`,
      reason: candidate.expectedConcepts.some((conceptId) => assessment.missingConceptIds.includes(conceptId))
        ? `Build the foundation for ${candidate.expectedConcepts.join(", ")} before retrying the target problem.`
        : "Use this internal bridge to strengthen a missing prerequisite before retrying the target problem.",
      conceptIds: candidate.expectedConcepts,
      internalProblemId: candidate.id
    }));

  const targetStep: TargetProblemRoadmapStep = {
    id: `target-${problem.id}`,
    type: "target",
    title: `${problem.id} · ${problem.title}`,
    reason: "Retry this internal problem after finishing the bridge steps.",
    conceptIds: problem.expectedConcepts,
    internalProblemId: problem.id
  };

  return {
    assessment,
    strategy: "internal-problem-roadmap",
    notes: orderedBridgeIds.length
      ? ["Internal bridge problems come first, then the target retry."]
      : ["You are already close. Retry the target after reviewing the highlighted concepts."],
    steps: [...bridgeSteps, targetStep]
  };
}

export function getDesktopRoadmapReviewWorkspace() {
  return getRoadmapReviewWorkspace();
}

export function saveDesktopRoadmapReview(input: Parameters<typeof saveRoadmapReview>[0]) {
  return saveRoadmapReview(input);
}

export function exportDesktopRoadmapReviewFixtures() {
  return exportRoadmapReviewFixtures();
}

export function runDesktopProblem(
  problemId: string,
  code?: string,
  options?: { mode?: "official" | "custom"; customInput?: string; language?: ProgrammingLanguage; practiceMode?: PracticeMode }
) {
  const catalogProblem = getDesktopProblem(problemId);
  const language = options?.language ?? "java";
  const practiceMode = options?.practiceMode ?? "beginner";
  const problem = effectiveProblemForPracticeMode(catalogProblem, practiceMode);
  const session =
    typeof code === "string"
      ? saveDesktopWorkspace(problemId, code, language, practiceMode)
      : loadDesktopWorkspace(problemId, language, practiceMode);
  const mode = options?.mode ?? "official";
  const customInput = options?.customInput ?? "";

  if (mode === "custom") {
    return {
      problem,
      workspacePath: session.workspacePath,
      mode,
      customRun:
        language === "cpp"
          ? runCppWithCustomInput(problem, session.workspacePath, customInput)
          : runJavaWithCustomInput(problem, session.workspacePath, customInput)
    };
  }

  const execution = language === "cpp" ? runCppSubmission(problem, session.workspacePath) : runJavaSubmission(problem, session.workspacePath);

  return {
    problem,
    workspacePath: session.workspacePath,
    mode,
    execution
  };
}

export function getDesktopConceptName(conceptId: string): string {
  return getConceptById(conceptId)?.name ?? conceptId;
}

export function loadDesktopPreferences(): DesktopPreferences {
  return getDesktopPreferences();
}

export function saveDesktopPreferenceState(preferences: DesktopPreferences): DesktopPreferences {
  saveDesktopPreferences(preferences);
  return preferences;
}

export function validateDesktopContribution(input: ContributionInput) {
  return validateContribution(input);
}

export function saveDesktopContributionDraft(input: ContributionInput) {
  return saveContributionDraft(input);
}

export function submitDesktopContribution(input: ContributionInput) {
  return submitContribution(input);
}

export function getDesktopContributionOutboxPath() {
  return getContributionOutboxPath();
}

export function getDesktopContributionIssueUrl(contributionId: string) {
  const record = listContributions().find((item) => item.id === contributionId);
  if (!record) {
    return null;
  }
  return buildContributionIssueUrl(record);
}

export function getDesktopContributionSyncStatus() {
  return getContributionSyncStatus();
}

export async function syncDesktopContributionStatuses() {
  return syncContributionStatuses();
}

export function getDesktopTrainingCatalog() {
  return listTrainingCatalog();
}

export function getDesktopTrainingProblemSummary(problemId: string) {
  return getTrainingProblemSummary(problemId);
}

export function getDesktopTrainingBacklogSummary() {
  return getTrainingBacklogSummary();
}

export function exportDesktopTrainingRegressionBundle() {
  return exportTrainingRegressionBundle();
}

export function generateDesktopTrainingRegressionTests() {
  return generateTrainingRegressionTests();
}

export function generateDesktopTrainingPrompts(input: {
  problemId?: string;
  topicId?: string;
  languages?: ProgrammingLanguage[];
  modes?: PracticeMode[];
  variants?: number;
}) {
  return generateTrainingPrompts(input);
}

export function importDesktopTrainingCandidates(input: {
  jsonText: string;
  problemId?: string;
  language?: ProgrammingLanguage;
  practiceMode?: PracticeMode;
  model?: string;
  promptVersion?: string;
  sourceLabel?: string;
}) {
  return importTrainingCandidates(input);
}

export function evaluateDesktopTrainingCandidates(filters: { problemId?: string; candidateId?: string } = {}) {
  return evaluateTrainingCandidates(filters);
}

export function saveDesktopTrainingReview(input: {
  candidateId: string;
  problemId: string;
  satisfactory: boolean;
  bugType?: "concept-detector" | "scoring" | "execution-or-template" | "metadata" | "hardcoding-detection" | "needs-investigation" | null;
  reviewerNotes?: string;
  resolution?: string | null;
  expectedFacts?: string[];
  forbiddenFacts?: string[];
}) {
  return saveTrainingReview(input);
}
