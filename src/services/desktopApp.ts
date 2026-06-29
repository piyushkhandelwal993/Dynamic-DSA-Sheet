import fs from "fs";
import { spawnSync } from "child_process";
import {
  CppRuntimeStatus,
  DesktopBootstrap,
  DesktopPreferences,
  JavaRuntimeStatus,
  PracticeMode,
  Problem,
  ProblemSessionResult,
  ProgrammingLanguage
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
import { effectiveProblemForPracticeMode, ensureProblemWorkspace, resetProblemWorkspace } from "./workspace";
import { recommendNextProblem } from "./recommendation";
import { buildWorldZones, buildActiveQuests, getMasterySummary } from "./progression";
import { submitProblemSolution } from "./submission";
import { runJavaSubmission, runJavaWithCustomInput } from "./javaRunner";
import { runCppSubmission, runCppWithCustomInput } from "./cppRunner";

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
    contentSync: getContentSyncStatus()
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
