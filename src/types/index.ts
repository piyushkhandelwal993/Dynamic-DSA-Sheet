export type Level = "beginner" | "intermediate" | "advanced";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type ProblemStatus = "pending" | "started" | "submitted" | "solved" | "skipped";
export type ProgrammingLanguage = "java" | "cpp";
export type PracticeMode = "beginner" | "pro";
export type SolutionMode = "guided-function" | "function" | "partial-program" | "complete-program";
export type ProblemPoolRole = "core" | "practice" | "review" | "challenge";
export type ProblemLearningRole = "introduce" | "reinforce" | "mastery";
export type ContributionType = "test-case" | "bulk-test-cases" | "video-link";
export type ContributionStatus = "draft" | "validated" | "submitted" | "under-review" | "approved" | "rejected" | "published";
export type FunctionDriverStrategy =
  | "linked-list-length"
  | "linked-list-search"
  | "linked-list-reverse"
  | "linked-list-insert-head"
  | "linked-list-insert-tail"
  | "linked-list-delete-position"
  | "linked-list-middle-value"
  | "linked-list-cycle-detect"
  | "linked-list-merge-sorted"
  | "linked-list-remove-duplicates"
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
  | "array-min-subarray-len"
  | "array-first-repeating"
  | "array-equilibrium-index"
  | "array-zero-sum-exists"
  | "array-majority-element"
  | "array-sorted-squares"
  | "array-max-window-sum"
  | "array-min-adjacent-diff"
  | "array-right-rotate-k"
  | "array-count-subarrays-sum-k"
  | "array-contains-duplicate"
  | "array-max-circular-subarray"
  | "array-max-average-window"
  | "array-reverse"
  | "array-container-most-water"
  | "array-sort-colors"
  | "array-longest-ones-k-flips"
  | "array-first-negative-window"
  | "array-count-subarrays-divisible-k"
  | "tree-height"
  | "tree-preorder"
  | "tree-inorder"
  | "tree-postorder"
  | "tree-level-order"
  | "tree-diameter"
  | "tree-balanced-check"
  | "tree-bst-search"
  | "tree-left-view"
  | "tree-bst-insert"
  | "tree-bst-delete"
  | "tree-top-view"
  | "tree-lca"
  | "tree-build-from-traversals"
  | "tree-serialize-level-order"
  | "stack-balanced-brackets"
  | "stack-process-queries"
  | "stack-reverse-word"
  | "stack-remove-adjacent-duplicates"
  | "stack-evaluate-postfix"
  | "stack-evaluate-prefix"
  | "stack-min-stack-queries"
  | "stack-stock-span"
  | "stack-next-greater-right"
  | "stack-previous-smaller-left"
  | "stack-infix-to-postfix"
  | "stack-daily-temperatures"
  | "stack-circular-next-greater"
  | "stack-largest-rectangle"
  | "stack-maximal-rectangle"
  | "stack-validate-sequences"
  | "stack-asteroid-collision"
  | "stack-simplify-path"
  | "stack-remove-adjacent-k"
  | "stack-max-nesting-depth"
  | "stack-redundant-brackets"
  | "stack-celebrity"
  | "stack-next-smaller-right"
  | "stack-subarray-minimums"
  | "stack-baseball-score"
  | "stack-backspace-compare"
  | "stack-next-greater-reference"
  | "stack-online-stock-span"
  | "stack-postfix-to-infix"
  | "stack-remove-k-digits"
  | "queue-reverse-first-k"
  | "queue-process-queries"
  | "queue-circular-queries"
  | "queue-petrol-pump"
  | "queue-generate-binary"
  | "queue-rotten-oranges"
  | "queue-first-non-repeating-stream"
  | "queue-sliding-window-maximum"
  | "queue-shortest-subarray-at-least-k"
  | "queue-jump-game-vi"
  | "queue-k-largest-elements"
  | "queue-task-scheduler"
  | "queue-dota2-senate"
  | "binary-search-exact"
  | "binary-search-lower-bound"
  | "binary-search-first-last"
  | "binary-search-search-insert"
  | "binary-search-rotated-search"
  | "binary-search-min-rotated"
  | "binary-search-peak"
  | "binary-search-floor-sqrt"
  | "binary-search-capacity-speed"
  | "binary-search-capacity-ship"
  | "binary-search-capacity-bouquets"
  | "binary-search-median-two-arrays"
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
  | "recursion-print-name-n-times"
  | "recursion-print-1-to-n"
  | "recursion-sum-first-n"
  | "recursion-power"
  | "recursion-fibonacci-number"
  | "recursion-palindrome"
  | "recursion-reverse-string"
  | "recursion-sum-digits"
  | "recursion-count-digits"
  | "recursion-binary-search"
  | "recursion-gcd"
  | "math-reverse-number"
  | "math-palindrome-number"
  | "math-prime-check"
  | "math-lcm"
  | "math-count-primes-sieve"
  | "math-power-modulo"
  | "math-fast-power-modulo"
  | "math-factorial-modulo"
  | "math-modular-inverse"
  | "math-ncr-mod-prime"
  | "recursion-generate-subsequences"
  | "recursion-subset-sum-exists"
  | "recursion-combination-sum"
  | "recursion-generate-permutations"
  | "recursion-tower-of-hanoi"
  | "recursion-josephus"
  | "recursion-factorial"
  | "recursion-climbing-stairs"
  | "recursion-tribonacci"
  | "recursion-merge-sort"
  | "recursion-quick-sort"
  | "recursion-sudoku-solver"
  | "recursion-n-queens"
  | "graph-bfs"
  | "graph-build-adjacency-list"
  | "graph-dfs"
  | "graph-connected-components"
  | "graph-cycle-undirected"
  | "graph-cycle-directed"
  | "graph-num-islands"
  | "graph-shortest-path-binary-matrix"
  | "graph-topological-sort"
  | "graph-course-schedule"
  | "graph-shortest-path-unweighted"
  | "graph-number-of-provinces"
  | "graph-dijkstra"
  | "graph-network-delay-time"
  | "graph-kruskal-mst"
  | "graph-prim-mst"
  | "dp-climbing-stairs"
  | "dp-house-robber"
  | "dp-max-non-adjacent-sum"
  | "dp-min-cost-climbing-stairs"
  | "dp-unique-paths"
  | "dp-min-path-sum"
  | "dp-subset-sum"
  | "dp-knapsack-01"
  | "dp-coin-change-min-coins"
  | "dp-lis-length"
  | "dp-bitonic-subsequence"
  | "dp-lcs-length"
  | "dp-edit-distance"
  | "dp-matrix-chain-multiplication"
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
  learningRole?: ProblemLearningRole;
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
  progressionOrder?: number;
  dependsOn?: string[];
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
    hasParameterizedRecursion: boolean;
    hasFunctionalRecursion: boolean;
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
    usesOppositeEndPointers: boolean;
    usesPartitionPointers: boolean;
    usesFixedWindow: boolean;
    usesVariableWindow: boolean;
    usesWindowAuxStructure: boolean;
    usesPrefixSuffixProduct: boolean;
    usesPrefixBalance: boolean;
    usesModuloPrefix: boolean;
    usesLinkedListTraversal: boolean;
    usesHeadUpdate: boolean;
    usesNodeDeletion: boolean;
    usesLinkedListReverse: boolean;
    usesFastSlowPointers: boolean;
    usesDummyNode: boolean;
    usesStackStructure: boolean;
    usesPushPop: boolean;
    usesMonotonicStack: boolean;
    usesNextGreaterElement: boolean;
    usesPreviousSmallerElement: boolean;
    usesStockSpanPattern: boolean;
    usesLargestRectangleHistogram: boolean;
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
export type DesktopView = "home" | "practice" | "progress" | "world" | "problems" | "external" | "roadmap" | "profile" | "training";

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
  externalPractice: ExternalPracticeSnapshot;
}

export interface RecommendationResult {
  type: "move-forward" | "extra-practice" | "revise-prerequisite" | "skip-basics";
  message: string;
  problem?: Problem;
  reasons: string[];
  suggestedProblemIds: string[];
  conceptIds: string[];
}

export type ExternalPracticePlatform = "leetcode";
export type ExternalPracticeStatus = "unseen" | "suggested" | "saved" | "opened" | "completed" | "dismissed";

export interface ExternalPracticeProblem {
  id: string;
  platform: ExternalPracticePlatform;
  title: string;
  url: string;
  difficulty: Difficulty;
  topicId: string;
  conceptIds: string[];
  prerequisiteConceptIds: string[];
  mappedFromProblemIds: string[];
  recommendedAfterProblemIds: string[];
  roadmapBridgeProblemIds?: string[];
  sourceQualityWeight: number;
}

export interface ExternalPracticeRecord {
  problemId: string;
  status: ExternalPracticeStatus;
  firstSuggestedAt?: string;
  lastSuggestedAt?: string;
  openedAt?: string;
  completedAt?: string;
  savedAt?: string;
  dismissedAt?: string;
}

export interface ExternalPracticeEntry {
  problem: ExternalPracticeProblem;
  status: ExternalPracticeStatus;
  readinessReason: string;
  matchedConceptIds: string[];
  newlyUnlocked: boolean;
}

export interface ExternalPracticeSnapshot {
  recommendedNow: ExternalPracticeEntry[];
  saved: ExternalPracticeEntry[];
  opened: ExternalPracticeEntry[];
  completed: ExternalPracticeEntry[];
}

export type TargetProblemVerdict = "ready" | "close" | "not-ready" | "unsupported";
export type TargetProblemConfidence = "High" | "Medium" | "Low";

export interface TargetProblemHypothesis {
  topicId: string;
  conceptIds: string[];
  confidence: TargetProblemConfidence;
  reason: string;
}

export interface TargetProblemAssessment {
  inputUrl: string;
  normalizedUrl: string;
  matchedProblem?: ExternalPracticeProblem;
  inferredTitle?: string;
  inferredTopicId?: string;
  inferredConceptIds?: string[];
  usedProblemStatement?: boolean;
  alternateHypotheses?: TargetProblemHypothesis[];
  readinessScore: number;
  verdict: TargetProblemVerdict;
  readyNow: boolean;
  confidence?: TargetProblemConfidence;
  reasons: string[];
  strengthConceptIds: string[];
  missingConceptIds: string[];
}

export type TargetRoadmapStepType = "internal" | "external" | "target";

export interface TargetProblemRoadmapStep {
  id: string;
  type: TargetRoadmapStepType;
  title: string;
  reason: string;
  conceptIds: string[];
  internalProblemId?: string;
  externalProblemId?: string;
  url?: string;
}

export interface TargetProblemRoadmapPlan {
  assessment: TargetProblemAssessment;
  strategy?: string;
  notes?: string[];
  steps: TargetProblemRoadmapStep[];
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

export type TrainingCandidateType =
  | "correct-optimal"
  | "correct-alternate"
  | "suboptimal"
  | "incorrect"
  | "hardcoded"
  | "unspecified";

export interface TrainingPromptRecord {
  schemaVersion: number;
  generatedAt: string;
  problemId: string;
  language: ProgrammingLanguage;
  practiceMode: PracticeMode;
  variantsRequested: number;
  promptVersion: string;
  prompt: string;
  fileName: string;
  filePath: string;
}

export interface TrainingCandidateRecord {
  schemaVersion: number;
  id: string;
  importedAt: string;
  problemId: string;
  language: ProgrammingLanguage;
  practiceMode: PracticeMode;
  candidateType: TrainingCandidateType;
  label: string;
  code: string;
  notes: string;
  model: string;
  promptVersion: string;
  sourceFile?: string;
}

export interface TrainingCandidateEvaluation {
  schemaVersion: number;
  evaluatedAt: string;
  sourceCandidate: string;
  candidate: TrainingCandidateRecord;
  execution: ExecutionResult;
  analyzer: {
    factIds: string[];
    matchedConcepts: string[];
    missingConcepts: string[];
    conceptMatchScore: number;
    score: ScoreBreakdown;
    recommendationHints: string[];
    evidence: {
      conceptId: string;
      matched: boolean;
      confidence: number;
      evidence: string[];
      factIds: string[];
    }[];
  };
  suspicious: boolean;
  suspiciousReasons: string[];
}

export type TrainingBugType =
  | "concept-detector"
  | "scoring"
  | "execution-or-template"
  | "metadata"
  | "hardcoding-detection"
  | "needs-investigation";

export interface TrainingReviewRecord {
  schemaVersion: number;
  candidateId: string;
  problemId: string;
  reviewedAt: string;
  satisfactory: boolean;
  bugType: TrainingBugType | null;
  reviewerNotes: string;
  resolution: string | null;
  expectedFacts: string[];
  forbiddenFacts: string[];
  inferredBugType: TrainingBugType | null;
}

export interface TrainingCandidateListItem {
  candidate: TrainingCandidateRecord;
  evaluation: TrainingCandidateEvaluation | null;
  review: TrainingReviewRecord | null;
}

export interface TrainingProblemSummary {
  problem: Problem;
  promptFiles: TrainingPromptRecord[];
  candidates: TrainingCandidateListItem[];
}

export interface TrainingBacklogItem {
  bugType: TrainingBugType;
  total: number;
  problemIds: string[];
  conceptIds: string[];
  candidateIds: string[];
  reasons: string[];
  suggestedFix: string;
  latestReviewedAt: string;
}

export interface TrainingBacklogSummary {
  totalReviewed: number;
  satisfactoryCount: number;
  dissatisfactoryCount: number;
  openBugCount: number;
  items: TrainingBacklogItem[];
}

export interface TrainingRegressionCase {
  candidateId: string;
  problemId: string;
  language: ProgrammingLanguage;
  practiceMode: PracticeMode;
  bugType: TrainingBugType;
  candidateType: TrainingCandidateType;
  code: string;
  matchedConcepts: string[];
  missingConcepts: string[];
  suspiciousReasons: string[];
  reviewerNotes: string;
  expectedFacts: string[];
  forbiddenFacts: string[];
}

export interface TrainingRegressionBundle {
  schemaVersion: number;
  generatedAt: string;
  totalCases: number;
  outputPath: string;
  cases: TrainingRegressionCase[];
}

export interface TrainingRegressionTestGeneration {
  schemaVersion: number;
  generatedAt: string;
  outputPath: string;
  activeTests: number;
  todoTests: number;
}

export interface TrainingGenerateRequest {
  problemId?: string;
  problemIds?: string[];
  topicId?: string;
  languages?: ProgrammingLanguage[];
  modes?: PracticeMode[];
  variants?: number;
  supportedOnly?: boolean;
}

export interface TrainingImportRequest {
  jsonText: string;
  problemId?: string;
  language?: ProgrammingLanguage;
  practiceMode?: PracticeMode;
  model?: string;
  promptVersion?: string;
  sourceLabel?: string;
}

export interface TrainingReviewRequest {
  candidateId: string;
  problemId: string;
  satisfactory: boolean;
  bugType?: TrainingBugType | null;
  reviewerNotes?: string;
  resolution?: string | null;
  expectedFacts?: string[];
  forbiddenFacts?: string[];
}
