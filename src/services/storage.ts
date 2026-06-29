import fs from "fs";
import path from "path";
import { Concept, DesktopPreferences, GameProfile, PracticeMode, Problem, ProgrammingLanguage, ProgressState, SkillProfile, StudentProfile, TopicMeta } from "../types";
import { getActiveContentBundle } from "./catalog";
import { createInitialGameProfile, rankFromLevel } from "./game";
import { resolveBaseDir } from "./paths";

function getProfilePath(): string {
  return path.join(resolveBaseDir(), "profile.json");
}

function getProgressPath(): string {
  return path.join(resolveBaseDir(), "progress.json");
}

function getSkillProfilePath(): string {
  return path.join(resolveBaseDir(), "skill-profile.json");
}

function getGameProfilePath(): string {
  return path.join(resolveBaseDir(), "game-profile.json");
}

function getDesktopPreferencesPath(): string {
  return path.join(resolveBaseDir(), "desktop-preferences.json");
}

export function getBaseDir(): string {
  return resolveBaseDir();
}

export function createInitialDesktopPreferences(): DesktopPreferences {
  const defaultTopicId = getDefaultTopicId();
  return {
    splitRatio: 46,
    editorFontSize: 14,
    currentRunMode: "official",
    currentProblemView: "description",
    currentView: "practice",
    sidebarCollapsed: false,
    editorFocusMode: false,
    lastOpenedTopicId: defaultTopicId,
    lastOpenedProblemId: null,
    selectedLanguage: "java",
    practiceMode: "beginner"
  };
}

export function getSubmissionsDir(): string {
  return path.join(resolveBaseDir(), "submissions");
}

export function getWorkspaceDir(): string {
  return path.join(resolveBaseDir(), "workspace");
}

export function ensureBaseStructure(): void {
  fs.mkdirSync(resolveBaseDir(), { recursive: true });
  fs.mkdirSync(getSubmissionsDir(), { recursive: true });
  fs.mkdirSync(getWorkspaceDir(), { recursive: true });
}

function writeJson<T>(targetPath: string, value: T): void {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readJson<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as T;
}

export function createInitialProgress(): ProgressState {
  return {
    studentId: "local",
    problems: {}
  };
}

export function createInitialSkillProfile(): SkillProfile {
  const concepts = getConcepts();
  const conceptScores = Object.fromEntries(concepts.map((concept) => [concept.id, 0]));
  const zeroMap = Object.fromEntries(concepts.map((concept) => [concept.id, 0]));

  return {
    studentId: "local",
    conceptScores,
    weakConcepts: [],
    strongConcepts: [],
    submissionHistory: [],
    conceptAttempts: zeroMap,
    conceptStrongHits: zeroMap,
    implementationScores: { ...zeroMap },
    implementationAttempts: { ...zeroMap },
    implementationStrongHits: { ...zeroMap }
  };
}

export function initializeStudentFiles(profile: StudentProfile): void {
  ensureBaseStructure();
  writeJson(getProfilePath(), profile);
  writeJson(getProgressPath(), createInitialProgress());
  writeJson(getSkillProfilePath(), createInitialSkillProfile());
  writeJson(getGameProfilePath(), createInitialGameProfile());
}

export function isInitialized(): boolean {
  return fs.existsSync(getProfilePath()) && fs.existsSync(getProgressPath()) && fs.existsSync(getSkillProfilePath());
}

export function getProfile(): StudentProfile | null {
  const profile = readJson<StudentProfile>(getProfilePath());
  if (!profile) return null;
  const defaultTopicId = getDefaultTopicId();
  return {
    ...profile,
    activeTopicId: profile.activeTopicId ?? defaultTopicId
  };
}

export function saveProfile(profile: StudentProfile): void {
  ensureBaseStructure();
  writeJson(getProfilePath(), profile);
}

export function getActiveTopicId(): string {
  return getProfile()?.activeTopicId ?? getDefaultTopicId();
}

export function setActiveTopicId(topicId: string): void {
  const profile = getProfile();
  if (!profile) return;
  saveProfile({
    ...profile,
    activeTopicId: topicId
  });
}

export function getProgress(): ProgressState {
  ensureBaseStructure();
  return readJson<ProgressState>(getProgressPath()) ?? createInitialProgress();
}

export function saveProgress(progress: ProgressState): void {
  ensureBaseStructure();
  writeJson(getProgressPath(), progress);
}

export function getSkillProfile(): SkillProfile {
  ensureBaseStructure();
  const defaults = createInitialSkillProfile();
  const saved = readJson<Partial<SkillProfile>>(getSkillProfilePath());
  if (!saved) return defaults;

  // Profiles created before scaffolded learning used complete-program submissions,
  // so their concept evidence is also valid implementation evidence.
  const legacyImplementationScores = saved.implementationScores ?? saved.conceptScores ?? defaults.implementationScores;
  const legacyImplementationAttempts = saved.implementationAttempts ?? saved.conceptAttempts ?? defaults.implementationAttempts;
  const legacyImplementationStrongHits = saved.implementationStrongHits ?? saved.conceptStrongHits ?? defaults.implementationStrongHits;

  return {
    ...defaults,
    ...saved,
    conceptScores: { ...defaults.conceptScores, ...(saved.conceptScores ?? {}) },
    conceptAttempts: { ...defaults.conceptAttempts, ...(saved.conceptAttempts ?? {}) },
    conceptStrongHits: { ...defaults.conceptStrongHits, ...(saved.conceptStrongHits ?? {}) },
    implementationScores: { ...defaults.implementationScores, ...legacyImplementationScores },
    implementationAttempts: { ...defaults.implementationAttempts, ...legacyImplementationAttempts },
    implementationStrongHits: { ...defaults.implementationStrongHits, ...legacyImplementationStrongHits },
    weakConcepts: saved.weakConcepts ?? [],
    strongConcepts: saved.strongConcepts ?? [],
    submissionHistory: saved.submissionHistory ?? []
  };
}

export function saveSkillProfile(skillProfile: SkillProfile): void {
  ensureBaseStructure();
  writeJson(getSkillProfilePath(), skillProfile);
}

export function getGameProfile(): GameProfile {
  ensureBaseStructure();
  const gameProfile = readJson<GameProfile>(getGameProfilePath()) ?? createInitialGameProfile();
  const level = gameProfile.level ?? createInitialGameProfile().level;
  return {
    ...gameProfile,
    level,
    rankTitle: rankFromLevel(level),
    topicTitles: gameProfile.topicTitles ?? {}
  };
}

export function saveGameProfile(gameProfile: GameProfile): void {
  ensureBaseStructure();
  writeJson(getGameProfilePath(), gameProfile);
}

export function getDesktopPreferences(): DesktopPreferences {
  ensureBaseStructure();
  const defaults = createInitialDesktopPreferences();
  const saved = readJson<Partial<DesktopPreferences>>(getDesktopPreferencesPath()) ?? {};

  return {
    splitRatio: typeof saved.splitRatio === "number" ? saved.splitRatio : defaults.splitRatio,
    editorFontSize: typeof saved.editorFontSize === "number" ? saved.editorFontSize : defaults.editorFontSize,
    currentRunMode: saved.currentRunMode ?? defaults.currentRunMode,
    currentProblemView: saved.currentProblemView ?? defaults.currentProblemView,
    currentView: saved.currentView ?? defaults.currentView,
    sidebarCollapsed: saved.sidebarCollapsed ?? defaults.sidebarCollapsed,
    editorFocusMode: saved.editorFocusMode ?? defaults.editorFocusMode,
    lastOpenedTopicId: saved.lastOpenedTopicId ?? defaults.lastOpenedTopicId,
    lastOpenedProblemId: saved.lastOpenedProblemId ?? defaults.lastOpenedProblemId,
    selectedLanguage: saved.selectedLanguage === "cpp" ? "cpp" : "java",
    practiceMode: saved.practiceMode === "pro" ? "pro" : "beginner"
  };
}

export function saveDesktopPreferences(preferences: DesktopPreferences): void {
  ensureBaseStructure();
  writeJson(getDesktopPreferencesPath(), preferences);
}

export function getProblems(): Problem[] {
  return getTopicProblems(getActiveTopicId());
}

export function getConcepts(): Concept[] {
  return Object.values(getActiveContentBundle().topicPacks).flatMap((topicPack) => topicPack.concepts);
}

export function getProblemById(problemId: string): Problem | undefined {
  return Object.values(getActiveContentBundle().topicPacks)
    .flatMap((topicPack) => topicPack.problems)
    .find((problem) => problem.id === problemId);
}

export function getConceptById(conceptId: string): Concept | undefined {
  return Object.values(getActiveContentBundle().topicPacks)
    .flatMap((topicPack) => topicPack.concepts)
    .find((concept) => concept.id === conceptId);
}

export function getDefaultTopicId(): string {
  return getActiveContentBundle().defaultTopicId;
}

export function getTopicMetas(): TopicMeta[] {
  const bundle = getActiveContentBundle();
  return bundle.topicOrder
    .map((topicId) => bundle.topicPacks[topicId]?.meta)
    .filter((topicMeta): topicMeta is TopicMeta => Boolean(topicMeta));
}

export function getTopicMeta(topicId = getDefaultTopicId()): TopicMeta | undefined {
  return getActiveContentBundle().topicPacks[topicId]?.meta;
}

export function getTopicProblems(topicId = getDefaultTopicId()): Problem[] {
  return getActiveContentBundle().topicPacks[topicId]?.problems ?? [];
}

export function getTopicConcepts(topicId = getDefaultTopicId()): Concept[] {
  return getActiveContentBundle().topicPacks[topicId]?.concepts ?? [];
}

export function getTopicIdForProblem(problemId: string): string | undefined {
  return Object.entries(getActiveContentBundle().topicPacks).find(([, topicPack]) => topicPack.problems.some((problem) => problem.id === problemId))?.[0];
}

export function getTopicRoadmap(topicId = getDefaultTopicId()): string[] {
  return getActiveContentBundle().topicPacks[topicId]?.meta.roadmap ?? [];
}

export function copySubmission(problemId: string, filePath: string): string {
  ensureBaseStructure();
  const fileName = `${problemId}-${Date.now()}-${path.basename(filePath)}`;
  const targetPath = path.join(getSubmissionsDir(), fileName);
  fs.copyFileSync(filePath, targetPath);
  return targetPath;
}

export function getProblemWorkspaceDir(problem: Problem): string {
  const topicId = getTopicIdForProblem(problem.id) ?? getDefaultTopicId();
  return path.join(getWorkspaceDir(), topicId, problem.id);
}

export function getProblemStarterFilePath(
  problem: Problem,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
): string {
  const functionMode = practiceMode === "beginner" && Boolean(problem.functionContract && problem.solutionMode !== "complete-program");
  const fileName = language === "cpp"
    ? functionMode ? "solution.cpp" : "main.cpp"
    : functionMode ? "Solution.java" : "Main.java";
  return path.join(getProblemWorkspaceDir(problem), fileName);
}
