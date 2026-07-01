export type Level = "beginner" | "intermediate" | "advanced";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type ProblemStatus = "pending" | "started" | "submitted" | "solved" | "skipped";
export type ProgrammingLanguage = "java" | "cpp";
export type PracticeMode = "beginner" | "pro";
export type SolutionMode = "guided-function" | "function" | "partial-program" | "complete-program";
export type ProblemPoolRole = "core" | "practice" | "review" | "challenge";
export type ContributionType = "test-case" | "bulk-test-cases" | "video-link";
export type ContributionStatus = "draft" | "validated" | "submitted" | "under-review" | "approved" | "rejected" | "published";
export type FunctionDriverStrategy =
  | "linked-list-length"
  | "linked-list-search"
  | "linked-list-reverse"
  | "array-maximum"
  | "array-sorted-check"
  | "array-second-largest"
  | "array-range-sum"
  | "array-highest-frequency"
  | "array-max-subarray"
  | "array-move-zeroes"
  | "array-remove-duplicates"
  | "array-longest-sum-k-positive"
  | "array-stock-profit"
  | "array-product-except-self"
  | "array-count-positive"
  | "array-running-sum"
  | "array-pair-sum-sorted"
  | "array-left-rotate-one"
  | "array-max-consecutive-ones"
  | "array-reverse"
  | "tree-height"
  | "tree-preorder"
  | "stack-balanced-brackets"
  | "queue-reverse-first-k"
  | "binary-search-exact"
  | "bit-binary-string"
  | "bit-odd-even"
  | "bit-check"
  | "bit-count-set-bits"
  | "bit-count-set-bits-kernighan"
  | "bit-set"
  | "bit-clear"
  | "bit-toggle"
  | "bit-check-right-shift"
  | "bit-power-of-two"
  | "bit-xor-1-to-n"
  | "bit-single-number"
  | "bit-two-unique-numbers"
  | "bit-missing-number"
  | "bit-decode-xored-array"
  | "bit-invert-all"
  | "bit-base10-complement"
  | "bit-power-of-four"
  | "bit-count-bits-dp"
  | "bit-count-odd-array"
  | "bit-swap-two-numbers"
  | "bit-clear-rightmost-set-bit"
  | "bit-set-query-batch"
  | "bit-toggle-range"
  | "bit-subset-sum-count"
  | "bit-generate-subsets"
  | "bit-assignment-mask-count"
  | "bit-reverse-bits"
  | "bit-max-xor-pair"
  | "bit-range-bitwise-and"
  | "bit-sum-without-plus"
  | "bit-hamming-distance"
  | "bit-min-bit-flips"
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

export interface ProblemVideo {
  provider: "youtube";
  url: string;
  title?: string;
}

export interface ContributedTestCaseInput {
  input: string;
  expectedOutput: string;
  visibilitySuggestion: "sample" | "hidden";
  reason: string;
  note?: string;
}

export interface TestCaseContributionPayload extends ContributedTestCaseInput {}

export interface BulkTestCaseContributionPayload {
  cases: ContributedTestCaseInput[];
}

export interface VideoLinkContributionPayload {
  url: string;
  title: string;
  reason: string;
  recommendedFor?: PracticeMode[];
  language?: string;
}

export type ContributionPayload =
  | TestCaseContributionPayload
  | BulkTestCaseContributionPayload
  | VideoLinkContributionPayload;

export type ContributionInput =
  | {
      type: "test-case";
      problemId: string;
      topicId?: string;
      payload: TestCaseContributionPayload;
    }
  | {
      type: "bulk-test-cases";
      problemId: string;
      topicId?: string;
      payload: BulkTestCaseContributionPayload;
    }
  | {
      type: "video-link";
      problemId: string;
      topicId?: string;
      payload: VideoLinkContributionPayload;
    };

export interface ContributionValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContributionRemoteRef {
  provider: "pending-automation";
  reference: string;
}

export interface ContributionReviewUpdate {
  id: string;
  status: Exclude<ContributionStatus, "draft" | "validated">;
  reviewedAt?: string;
  note?: string;
  publishedAt?: string;
}

export interface ContributionStatusFeed {
  generatedAt: string;
  items: ContributionReviewUpdate[];
}

export interface ContributionSyncStatus {
  enabled: boolean;
  lastCheckedAt?: string | null;
  remoteGeneratedAt?: string | null;
  updateCount?: number;
  statusUrl?: string | null;
  message: string;
}

export interface ContributionRecord {
  id: string;
  type: ContributionType;
  problemId: string;
  topicId: string;
  appVersion: string;
  createdAt: string;
  updatedAt: string;
  status: ContributionStatus;
  payload: ContributionPayload;
  localValidation: ContributionValidationResult;
  remoteRef?: ContributionRemoteRef | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  lastSyncedAt?: string | null;
}

export interface ContributionStore {
  items: ContributionRecord[];
}

export interface ContributionMutationResult {
  record: ContributionRecord;
  contributions: ContributionRecord[];
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
  video?: ProblemVideo;
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
export type DesktopView = "home" | "practice" | "progress" | "world" | "problems" | "profile";

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
  practiceMode?: PracticeMode;
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
  contentSync: ContentSyncStatus;
  contributions: ContributionRecord[];
  contributionSync: ContributionSyncStatus;
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

export interface ContentBundle {
  schemaVersion: number;
  contentVersion: string;
  generatedAt: string;
  minAppVersion?: string;
  defaultTopicId: string;
  topicOrder: string[];
  topicPacks: Record<string, {
    meta: TopicMeta;
    problems: Problem[];
    concepts: Concept[];
  }>;
}

export interface ContentSyncManifest {
  schemaVersion: number;
  contentVersion: string;
  generatedAt?: string;
  minAppVersion?: string;
  bundleUrl: string;
}

export interface ContentSyncStatus {
  enabled: boolean;
  source: "bundled" | "synced";
  activeContentVersion: string;
  bundledContentVersion: string;
  installedContentVersion: string | null;
  remoteContentVersion: string | null;
  updateAvailable: boolean;
  lastCheckedAt: string | null;
  lastSyncedAt: string | null;
  manifestUrl: string | null;
  message: string;
}

export interface ContentSyncResult {
  updated: boolean;
  status: ContentSyncStatus;
}

export interface ProblemSessionResult {
  problem: Problem;
  workspacePath: string;
  workspaceCode: string;
  created: boolean;
  language: ProgrammingLanguage;
  practiceMode: PracticeMode;
}
