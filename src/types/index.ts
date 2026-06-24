export type Level = "beginner" | "intermediate" | "advanced";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type ProblemStatus = "pending" | "started" | "submitted" | "solved" | "skipped";
export type ProgrammingLanguage = "java" | "cpp";
export type SolutionMode = "guided-function" | "function" | "partial-program" | "complete-program";
export type ProblemPoolRole = "core" | "practice" | "review" | "challenge";
export type FunctionDriverStrategy =
  | "linked-list-length"
  | "linked-list-search"
  | "linked-list-reverse"
  | "array-maximum"
  | "array-reverse"
  | "tree-height"
  | "tree-preorder"
  | "stack-balanced-brackets"
  | "queue-reverse-first-k"
  | "binary-search-exact"
  | "bit-check"
  | "recursion-factorial"
  | "graph-bfs"
  | "dp-fibonacci";

export interface FunctionContract {
  functionName: string;
  javaSignature: string;
  cppSignature: string;
  providedTypes: string[];
  driverStrategy: FunctionDriverStrategy;
}

export interface StudentProfile {
  studentId: string;
  name: string;
  batch: string;
  preferredLanguage: string;
  currentLevel: Level;
  activeTopicId?: string;
  createdAt: string;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
  visibility: "sample" | "hidden";
  explanation?: string;
}

export interface Problem {
  id: string;
  topic: string;
  subtopic: string;
  title: string;
  difficulty: Difficulty;
  platform: string;
  url: string;
  expectedConcepts: string[];
  prerequisiteConcepts: string[];
  expectedComplexity: string;
  estimatedMinutes: number;
  description?: string;
  constraints?: string[];
  inputFormat?: string[];
  outputFormat?: string[];
  edgeCases?: string[];
  intendedApproachSummary?: string;
  wrongApproachHints?: string[];
  hints: string[];
  examples: ProblemExample[];
  testCases?: ProblemTestCase[];
  remedialProblems: string[];
  skipIfMastered: string[];
  poolRole?: ProblemPoolRole;
  masteryWeight?: number;
  variantGroup?: string;
  selectionTags?: string[];
  solutionMode?: SolutionMode;
  functionContract?: FunctionContract;
  independenceMilestoneFor?: string[];
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  exampleJava: string;
  commonMistakes: string[];
  practiceProblems: string[];
}

export interface ProblemProgress {
  problemId: string;
  status: ProblemStatus;
  attempts: number;
  bestScore: number;
  lastScore?: number;
  startedAt?: string;
  completedAt?: string;
  lastSubmittedAt?: string;
  nextRevisionDate?: string;
  confidence?: number;
  timeTakenMinutes?: number;
  notes?: string;
  analysisSummary?: string[];
  approachTags?: string[];
  retryRequired?: boolean;
  retryConceptIds?: string[];
  retryReason?: string;
  bestImplementationScore?: number;
  completedSolutionModes?: SolutionMode[];
}

export interface ProgressState {
  studentId: string;
  problems: Record<string, ProblemProgress>;
}

export interface SubmissionHistoryEntry {
  problemId: string;
  submittedAt: string;
  finalScore: number;
  conceptMatchScore: number;
  detectedConcepts: string[];
  missingConcepts: string[];
  solutionMode?: SolutionMode;
  implementationScore?: number;
}

export interface SkillProfile {
  studentId: string;
  conceptScores: Record<string, number>;
  weakConcepts: string[];
  strongConcepts: string[];
  submissionHistory: SubmissionHistoryEntry[];
  conceptAttempts: Record<string, number>;
  conceptStrongHits: Record<string, number>;
  implementationScores: Record<string, number>;
  implementationAttempts: Record<string, number>;
  implementationStrongHits: Record<string, number>;
}

export interface AnalysisResult {
  detected: string[];
  warnings: string[];
  signals: {
    usesAnd: boolean;
    usesOr: boolean;
    usesXor: boolean;
    usesLeftShift: boolean;
    usesRightShift: boolean;
    usesNot: boolean;
    usesPowerOfTwoPattern: boolean;
    usesStringConversion: boolean;
    usesModuloDivision: boolean;
    hasUnnecessaryLoop: boolean;
    hasHardcoding: boolean;
    hasPoorVariableNames: boolean;
    missingEdgeCaseHandling: boolean;
    hasRecursiveCall: boolean;
    hasBaseCase: boolean;
    hasMultipleRecursiveCalls: boolean;
    usesMemoization: boolean;
    usesBacktrackingUndo: boolean;
    usesDivideAndConquer: boolean;
    missingRecursiveProgress: boolean;
    usesArrayTraversal: boolean;
    usesSorting: boolean;
    usesHashMap: boolean;
    usesPrefixSum: boolean;
    usesTwoPointers: boolean;
    usesSlidingWindow: boolean;
    usesLinkedListTraversal: boolean;
    usesHeadUpdate: boolean;
    usesNodeDeletion: boolean;
    usesLinkedListReverse: boolean;
    usesFastSlowPointers: boolean;
    usesDummyNode: boolean;
    usesStackStructure: boolean;
    usesPushPop: boolean;
    usesMonotonicStack: boolean;
    usesParenthesisMatching: boolean;
    usesExpressionConversion: boolean;
    usesMinStackPattern: boolean;
    usesQueueStructure: boolean;
    usesEnqueueDequeue: boolean;
    usesCircularQueuePattern: boolean;
    usesDequeWindowPattern: boolean;
    usesBfsStyleQueue: boolean;
    usesPriorityQueue: boolean;
    usesBinarySearch: boolean;
    usesLowerUpperBoundPattern: boolean;
    usesAnswerBinarySearch: boolean;
    usesSortedMidCheck: boolean;
    usesPartitionBinarySearch: boolean;
    usesTreeNodePattern: boolean;
    usesRecursiveTraversal: boolean;
    usesQueueTraversal: boolean;
    usesBstLogic: boolean;
    usesTreeConstruction: boolean;
    usesLcaPattern: boolean;
    usesGraphAdjacency: boolean;
    usesGraphTraversal: boolean;
    usesTopologicalSort: boolean;
    usesShortestPath: boolean;
    usesDisjointSet: boolean;
    usesMstLogic: boolean;
    usesMemoTable: boolean;
    usesBottomUpDp: boolean;
    usesStateTransition: boolean;
    usesSpaceOptimization: boolean;
    usesKnapsackPattern: boolean;
    usesIntervalDp: boolean;
  };
}

export interface ConceptDetectionResult {
  matchedConcepts: string[];
  missingConcepts: string[];
}

export type AnalysisConfidence = "High" | "Medium" | "Low";

export interface ConceptEvidence {
  conceptId: string;
  confidence: AnalysisConfidence;
  confidenceScore: number;
  factIds: string[];
  evidence: string[];
}

export interface AnalysisIssue {
  id: string;
  confidence: AnalysisConfidence;
  evidence: string[];
}

export interface ExplainableAnalysisFeedback {
  detectedConcepts: ConceptEvidence[];
  missingConcepts: string[];
  antiPatterns: AnalysisIssue[];
  complexityReasoning: string[];
  improvements: string[];
}

export interface ScoreBreakdown {
  correctnessScore: number;
  conceptMatchScore: number;
  qualityScore: number;
  complexityScore: number;
  finalScore: number;
}

export interface ExecutionCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  visibility: "sample" | "hidden";
  error?: string;
  timedOut?: boolean;
  outputLimitExceeded?: boolean;
  memoryLimitExceeded?: boolean;
  resourceLimit?: "time" | "output" | "memory";
}

export interface ExecutionResult {
  usedTestCases: boolean;
  compileSucceeded: boolean;
  passedCount: number;
  totalCount: number;
  compileError?: string;
  failedCases: ExecutionCaseResult[];
}

export interface CustomRunResult {
  compileSucceeded: boolean;
  actualOutput: string;
  runtimeError?: string;
  timedOut?: boolean;
  outputLimitExceeded?: boolean;
  memoryLimitExceeded?: boolean;
  resourceLimit?: "time" | "output" | "memory";
  customInput: string;
  compileError?: string;
}

export interface JavaRuntimeStatus {
  available: boolean;
  javaAvailable: boolean;
  javacAvailable: boolean;
  javaVersion?: string;
  javacVersion?: string;
  guidance: string;
}

export interface CppRuntimeStatus {
  available: boolean;
  compilerAvailable: boolean;
  compilerVersion?: string;
  guidance: string;
}

export type DesktopProblemView = "description" | "examples" | "hints";
export type DesktopRunMode = "official" | "custom";
export type DesktopView = "home" | "practice" | "progress" | "world" | "problems";

export interface DesktopPreferences {
  splitRatio: number;
  editorFontSize: number;
  currentRunMode: DesktopRunMode;
  currentProblemView: DesktopProblemView;
  currentView?: DesktopView;
  sidebarCollapsed?: boolean;
  editorFocusMode?: boolean;
  lastOpenedTopicId?: string | null;
  lastOpenedProblemId?: string | null;
  selectedLanguage?: ProgrammingLanguage;
}

export interface DesktopBootstrap {
  topics: TopicMeta[];
  activeTopicId: string;
  activeTopic?: TopicMeta;
  roadmap: string[];
  problems: Problem[];
  profile: StudentProfile | null;
  gameProfile: GameProfile;
  nextRecommendation: RecommendationResult;
  worldZones: WorldZone[];
  quests: ActiveQuest[];
  mastery: {
    conceptId: string;
    score: number;
    tier: MasteryTier;
    implementationScore: number;
    implementationTier: MasteryTier;
    fullyMastered: boolean;
  }[];
  streakCalendar: { date: string; count: number; level: number }[];
  skillBars: {
    conceptId: string;
    conceptName: string;
    score: number;
    tier: string;
    implementationScore: number;
    implementationTier: string;
    fullyMastered: boolean;
  }[];
  submissionTrend: {
    problemId: string;
    score: number;
    submittedAt: string;
  }[];
  topicProgress: {
    topicId: string;
    topicName: string;
    solved: number;
    total: number;
  }[];
  progressMap: Record<string, ProblemProgress>;
  recommendedTopicId: string;
  preferences: DesktopPreferences;
  javaRuntime: JavaRuntimeStatus;
  cppRuntime: CppRuntimeStatus;
}

export interface RecommendationResult {
  type: "move-forward" | "extra-practice" | "revise-prerequisite" | "skip-basics";
  message: string;
  problem?: Problem;
  reasons: string[];
  suggestedProblemIds: string[];
  conceptIds: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
}

export interface GameProfile {
  studentId: string;
  xp: number;
  level: number;
  rankTitle: string;
  topicTitles?: Record<string, string>;
  streakDays: number;
  lastActiveDate?: string;
  badges: Badge[];
  questsCompleted: number;
  highQualitySubmissions: number;
  perfectConceptMatches: number;
}

export type MasteryTier = "Unseen" | "Training" | "Comfortable" | "Strong" | "Mastered";

export interface ActiveQuest {
  id: string;
  title: string;
  description: string;
  status: "active" | "locked" | "ready";
  problemId?: string;
  conceptId?: string;
  rewardXp?: number;
}

export interface WorldZone {
  id: string;
  name: string;
  description: string;
  status: "unlocked" | "locked" | "cleared";
  solvedCount: number;
  totalProblems: number;
  gate?: string;
}

export interface TopicMeta {
  id: string;
  name: string;
  description: string;
  roadmap: string[];
  recommendedLanguage: string;
  worldName: string;
  status: "active" | "coming-soon";
}

export interface ProblemSessionResult {
  problem: Problem;
  workspacePath: string;
  workspaceCode: string;
  created: boolean;
  language: ProgrammingLanguage;
}
