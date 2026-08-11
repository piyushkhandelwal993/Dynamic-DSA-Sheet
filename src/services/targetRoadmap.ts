import {
  Concept,
  ExternalPracticeProblem,
  PracticeMode,
  Problem,
  ProgressState,
  SkillProfile,
  TargetProblemAssessment,
  TargetProblemConfidence,
  TargetProblemHypothesis,
  TargetProblemRoadmapPlan,
  TargetProblemRoadmapStep
} from "../types";
import { getExternalPracticeCatalog } from "./externalPractice";
import { getConceptById, getProblemById, getProgress, getSkillProfile, getTopicConcepts, getTopicIdForProblem, getTopicProblems, getTopicMetas } from "./storage";

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

function normalizeTopicKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeTitleKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

interface TargetRoadmapOptions {
  practiceMode?: PracticeMode;
}

function isSequelToken(token: string): boolean {
  return /^(ii|iii|iv|v|vi|vii|viii|ix|x|\d+)$/.test(token);
}

function isTargetTwinOrSequel(
  candidate: Pick<ExternalPracticeProblem, "id" | "title">,
  target: Pick<ExternalPracticeProblem, "id" | "title">
): boolean {
  if (candidate.id === target.id) {
    return true;
  }

  const targetTitle = normalizeTitleKey(target.title);
  const candidateTitle = normalizeTitleKey(candidate.title);
  if (!targetTitle || !candidateTitle || candidateTitle === targetTitle) {
    return candidateTitle === targetTitle;
  }

  const targetTokens = targetTitle.split(" ").filter(Boolean);
  const candidateTokens = candidateTitle.split(" ").filter(Boolean);
  if (candidateTokens.length <= targetTokens.length) {
    return false;
  }

  const samePrefix = targetTokens.every((token, index) => candidateTokens[index] === token);
  if (!samePrefix) {
    return false;
  }

  return candidateTokens.slice(targetTokens.length).every(isSequelToken);
}

function normalizeAssessmentArgs(
  problemStatementOrProgress?: string | ProgressState,
  progressOrSkillProfile?: ProgressState | SkillProfile,
  maybeSkillProfile?: SkillProfile
): { problemStatement?: string; progress: ProgressState; skillProfile: SkillProfile } {
  if (typeof problemStatementOrProgress === "string") {
    return {
      problemStatement: problemStatementOrProgress,
      progress: isProgressState(progressOrSkillProfile) ? progressOrSkillProfile : getProgress(),
      skillProfile: isSkillProfile(maybeSkillProfile) ? maybeSkillProfile : getSkillProfile()
    };
  }

  return {
    problemStatement: undefined,
    progress: isProgressState(problemStatementOrProgress) ? problemStatementOrProgress : getProgress(),
    skillProfile: isSkillProfile(progressOrSkillProfile) ? progressOrSkillProfile : getSkillProfile()
  };
}

function isProgressState(value: unknown): value is ProgressState {
  return Boolean(value && typeof value === "object" && "problems" in (value as Record<string, unknown>));
}

function isSkillProfile(value: unknown): value is SkillProfile {
  return Boolean(value && typeof value === "object" && "conceptScores" in (value as Record<string, unknown>));
}

function parseLeetCodeSlug(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const match = url.pathname.match(/\/problems\/([^/]+)/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

type HeuristicTarget = {
  title: string;
  topicId: string;
  conceptIds: string[];
  prerequisiteConceptIds: string[];
  roadmapBridgeProblemIds?: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  confidence: TargetProblemConfidence;
  reasons: string[];
  alternateHypotheses?: TargetProblemHypothesis[];
};

function pushAlternateHypothesis(
  hypotheses: TargetProblemHypothesis[],
  hypothesis: TargetProblemHypothesis
): void {
  const exists = hypotheses.some((item) =>
    item.topicId === hypothesis.topicId && item.conceptIds.join(",") === hypothesis.conceptIds.join(",")
  );
  if (!exists) {
    hypotheses.push(hypothesis);
  }
}

const heuristicRules: Array<{
  tokens: string[];
  phrases?: string[];
  topicId: string;
  concepts: string[];
  prerequisites?: string[];
  roadmapBridgeProblemIds?: string[];
  difficulty?: "Easy" | "Medium" | "Hard";
  confidence?: TargetProblemConfidence;
  reason: string;
}> = [
  {
    tokens: ["stock", "profit"],
    phrases: ["buy and sell", "max profit", "best profit"],
    topicId: "arrays",
    concepts: ["stock-profit", "min-max-array"],
    prerequisites: ["stock-profit", "min-max-array"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Slug strongly matches the stock-profit pattern."
  },
  {
    tokens: ["spiral", "matrix"],
    phrases: ["spiral order", "clockwise spiral", "top bottom left right", "traverse matrix in spiral"],
    topicId: "arrays",
    concepts: ["matrix-traversal", "boundary-traversal"],
    prerequisites: ["matrix-traversal", "boundary-traversal"],
    roadmapBridgeProblemIds: ["arr-037", "arr-038"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Spiral-matrix wording strongly suggests layered array traversal with boundary updates."
  },
  {
    tokens: ["matrix", "zeroes"],
    phrases: ["set matrix zeroes", "zero out row and column", "mark rows and columns"],
    topicId: "arrays",
    concepts: ["array-traversal", "in-place-array-update"],
    prerequisites: ["array-traversal", "in-place-array-update"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Set-matrix-zeroes wording strongly suggests matrix traversal with careful in-place marking."
  },
  {
    tokens: ["rotate", "image"],
    phrases: ["rotate the matrix", "rotate image", "clockwise by 90 degrees"],
    topicId: "arrays",
    concepts: ["array-traversal", "in-place-array-update"],
    prerequisites: ["array-traversal", "in-place-array-update"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Rotate-image wording strongly suggests layered matrix traversal and in-place updates."
  },
  {
    tokens: ["diagonal", "traverse"],
    phrases: ["diagonal order", "traverse diagonally", "zigzag diagonal"],
    topicId: "arrays",
    concepts: ["array-traversal"],
    prerequisites: ["array-traversal"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "Diagonal traversal wording usually maps to structured matrix iteration."
  },
  {
    tokens: ["reshape", "matrix"],
    phrases: ["matrix reshape", "convert to different rows and columns"],
    topicId: "arrays",
    concepts: ["array-traversal"],
    prerequisites: ["array-traversal"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Matrix-reshape wording maps to index-based traversal and remapping."
  },
  {
    tokens: ["toeplitz", "matrix"],
    phrases: ["same diagonal", "top-left to bottom-right diagonal"],
    topicId: "arrays",
    concepts: ["array-traversal"],
    prerequisites: ["array-traversal"],
    difficulty: "Easy",
    confidence: "Medium",
    reason: "Toeplitz-matrix wording usually maps to diagonal neighbor checks on a matrix scan."
  },
  {
    tokens: ["two", "sum", "sorted"],
    phrases: ["one pointer from each side", "two numbers whose sum equals target"],
    topicId: "two-pointers",
    concepts: ["two-pointers"],
    prerequisites: ["two-pointers"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Two-sum on a sorted array strongly suggests opposite-end two pointers."
  },
  {
    tokens: ["pair", "sum", "sorted", "array"],
    phrases: ["pair sum", "two numbers whose sum", "target sum"],
    topicId: "two-pointers",
    concepts: ["two-pointers"],
    prerequisites: ["two-pointers"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Pair-sum wording on a sorted array strongly suggests two pointers."
  },
  {
    tokens: ["window", "substring"],
    phrases: ["without repeating", "at most k distinct", "minimum window"],
    topicId: "sliding-window",
    concepts: ["sliding-window", "variable-size-window"],
    prerequisites: ["sliding-window", "variable-size-window"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "Substring plus window wording strongly suggests sliding-window reasoning."
  },
  {
    tokens: ["window", "subarray"],
    phrases: ["sum at least", "size subarray", "at most k"],
    topicId: "sliding-window",
    concepts: ["sliding-window", "variable-size-window"],
    prerequisites: ["sliding-window", "variable-size-window"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "Subarray plus window wording strongly suggests sliding-window reasoning."
  },
  {
    tokens: ["maximum", "sum", "subsequence", "non", "adjacent"],
    phrases: [
      "non adjacent elements",
      "no two chosen elements are adjacent",
      "choose subsequence with no adjacent elements"
    ],
    topicId: "dp",
    concepts: ["state-transition", "tabulation", "space-optimization", "segment-merge-dp"],
    prerequisites: ["dp-intro", "state-transition", "tabulation", "space-optimization", "segment-merge-dp"],
    roadmapBridgeProblemIds: ["dp-003", "dp-004", "dp-022"],
    difficulty: "Hard",
    confidence: "Medium",
    reason: "Non-adjacent subsequence maximization with this wording often extends the House-Robber-style DP family into segment-level state merging."
  },
  {
    tokens: ["sum", "subarray"],
    phrases: ["equals k", "divisible by k", "range sum"],
    topicId: "prefix-suffix",
    concepts: ["prefix-sum", "prefix-balance"],
    prerequisites: ["prefix-sum", "prefix-balance"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "Subarray sum wording usually maps to prefix-sum style reasoning."
  },
  {
    tokens: ["subarray", "divisible"],
    phrases: ["divisible by k", "modulo buckets", "prefix modulo"],
    topicId: "prefix-suffix",
    concepts: ["prefix-sum", "prefix-modulo"],
    prerequisites: ["prefix-sum", "prefix-modulo"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Divisible-by-k subarray wording strongly suggests prefix modulo reasoning."
  },
  {
    tokens: ["prefix"],
    phrases: ["running sum"],
    topicId: "prefix-suffix",
    concepts: ["prefix-sum"],
    prerequisites: ["prefix-sum"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Prefix wording maps directly to prefix-sum style reasoning."
  },
  {
    tokens: ["suffix"],
    phrases: ["product except self", "suffix products", "product of all other elements"],
    topicId: "prefix-suffix",
    concepts: ["prefix-suffix-product", "prefix-sum"],
    prerequisites: ["prefix-sum"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Suffix wording often maps to prefix-suffix accumulation patterns."
  },
  {
    tokens: ["rotated", "search"],
    phrases: ["sorted array is rotated", "rotated at an unknown pivot", "o log n"],
    topicId: "binary-search",
    concepts: ["rotated-array-search", "binary-search-intro"],
    prerequisites: ["binary-search-intro", "sorted-mid-check"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Rotated search wording strongly matches rotated-array binary search."
  },
  {
    tokens: ["search", "insert"],
    phrases: ["insert position"],
    topicId: "binary-search",
    concepts: ["search-insert-position", "binary-search-intro"],
    prerequisites: ["binary-search-intro", "sorted-mid-check"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Search insert wording directly matches binary-search insertion boundaries."
  },
  {
    tokens: ["search"],
    phrases: ["sorted array", "o(log n)", "binary search"],
    topicId: "binary-search",
    concepts: ["binary-search-intro", "sorted-mid-check"],
    prerequisites: ["binary-search-intro", "sorted-mid-check"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "Search wording often maps to binary search when given as a LeetCode target slug."
  },
  {
    tokens: ["search", "sorted", "array"],
    phrases: ["o(log n)", "binary search", "middle element"],
    topicId: "binary-search",
    concepts: ["binary-search-intro", "sorted-mid-check"],
    prerequisites: ["binary-search-intro", "sorted-mid-check"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Searching a sorted array strongly suggests binary-search midpoint checks."
  },
  {
    tokens: ["bst", "ceil"],
    phrases: [
      "ceil in bst",
      "implementing ceil in bst",
      "smallest number greater than or equal",
      "find next greater candidate in bst"
    ],
    topicId: "binary-search-trees",
    concepts: ["bst-topic-search", "bst-topic-candidate-tracking"],
    prerequisites: ["bst-topic-search", "bst-topic-candidate-tracking"],
    roadmapBridgeProblemIds: ["bst-001", "bst-012", "bst-005"],
    difficulty: "Medium",
    confidence: "High",
    reason: "BST ceil wording implies one-path candidate tracking on tree ordering, not midpoint search on an array."
  },
  {
    tokens: ["bst", "floor"],
    phrases: [
      "floor in bst",
      "largest number smaller than or equal",
      "best smaller candidate in bst"
    ],
    topicId: "binary-search-trees",
    concepts: ["bst-topic-search", "bst-topic-candidate-tracking"],
    prerequisites: ["bst-topic-search", "bst-topic-candidate-tracking"],
    roadmapBridgeProblemIds: ["bst-001", "bst-012"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "BST floor wording still centers on directional pruning plus best-so-far candidate tracking."
  },
  {
    tokens: ["search", "nearly", "sorted", "array"],
    phrases: ["nearly sorted", "almost sorted"],
    topicId: "binary-search",
    concepts: ["binary-search-intro", "sorted-mid-check"],
    prerequisites: ["binary-search-intro", "sorted-mid-check"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Nearly-sorted array search still centers on binary-search style midpoint reasoning."
  },
  {
    tokens: ["capacity"],
    phrases: ["within d days", "minimum capacity"],
    topicId: "binary-search",
    concepts: ["answer-binary-search", "capacity-search"],
    prerequisites: ["answer-binary-search", "capacity-search"],
    difficulty: "Medium",
    confidence: "Medium",
    reason: "Capacity wording often signals answer-space binary search."
  },
  {
    tokens: ["minimum", "days"],
    phrases: ["feasible", "can make", "bouquets"],
    topicId: "binary-search",
    concepts: ["answer-binary-search"],
    prerequisites: ["answer-binary-search"],
    difficulty: "Medium",
    confidence: "Low",
    reason: "Minimum-days style slugs often use answer-space search, but this is heuristic."
  },
  {
    tokens: ["palindrome"],
    phrases: ["ignore non-alphanumeric"],
    topicId: "strings",
    concepts: ["string-traversal", "palindrome-string"],
    prerequisites: ["string-traversal", "palindrome-string"],
    difficulty: "Easy",
    confidence: "Medium",
    reason: "Palindrome wording often maps to string traversal with mirrored character comparison."
  },
  {
    tokens: ["anagram"],
    phrases: ["same letters", "frequency count", "rearranged letters"],
    topicId: "strings",
    concepts: ["char-frequency", "anagram-check"],
    prerequisites: ["char-frequency", "anagram-check"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Anagram wording strongly matches character-frequency comparison."
  },
  {
    tokens: ["reverse", "words", "string"],
    phrases: ["reverse words", "single spaces", "trim spaces"],
    topicId: "strings",
    concepts: ["string-builder", "word-parsing"],
    prerequisites: ["string-builder", "word-parsing"],
    difficulty: "Medium",
    confidence: "High",
    reason: "Reverse-words wording strongly matches sentence parsing and clean string rebuilding."
  },
  {
    tokens: ["merge", "strings", "alternately"],
    phrases: ["alternately", "take characters from each string"],
    topicId: "strings",
    concepts: ["string-builder", "two-string-merge"],
    prerequisites: ["string-builder", "two-string-merge"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Alternate merge wording strongly matches coordinated two-string construction."
  },
  {
    tokens: ["backspace", "string", "compare"],
    phrases: ["# means backspace", "typed into empty text editor"],
    topicId: "strings",
    concepts: ["string-cleanup-stack"],
    prerequisites: ["string-cleanup-stack"],
    difficulty: "Easy",
    confidence: "High",
    reason: "Backspace-compare wording strongly suggests stack-style string cleanup simulation."
  },
  {
    tokens: ["sorted", "array"],
    phrases: ["two sum", "pair sum", "left pointer", "right pointer"],
    topicId: "two-pointers",
    concepts: ["two-pointers"],
    prerequisites: ["two-pointers"],
    difficulty: "Easy",
    confidence: "Low",
    reason: "Sorted-array wording sometimes maps to two-pointer scanning."
  }
];

function normalizeInferenceText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function inferTargetFromInput(inputUrl: string, problemStatement?: string): HeuristicTarget | null {
  const slug = parseLeetCodeSlug(inputUrl);
  if (!slug) return null;

  const slugTokens = slug.split("-").filter(Boolean);
  const statementText = normalizeInferenceText(problemStatement ?? "");
  const titleText = normalizeInferenceText(titleFromSlug(slug));
  const fullText = `${titleText} ${statementText}`.trim();
  const matchedRules = heuristicRules
    .map((rule) => {
      const slugTokenHits = rule.tokens.filter((token) => slugTokens.includes(token)).length;
      const textTokenHits = rule.tokens.filter((token) => fullText.includes(token)).length;
      const phraseHits = (rule.phrases ?? []).filter((phrase) => fullText.includes(phrase)).length;
      const totalRequired = rule.tokens.length;
      const hasStrongSignal = slugTokenHits === totalRequired || textTokenHits === totalRequired || phraseHits > 0;
      if (!hasStrongSignal) {
        return null;
      }
      const confidenceRank = { High: 3, Medium: 2, Low: 1 } as const;
      const binarySearchBonus = rule.topicId === "binary-search" && fullText.includes("search") ? 40 : 0;
      const logarithmicBonus = rule.topicId === "binary-search" && (fullText.includes("o(log n)") || fullText.includes("o log n")) ? 80 : 0;
      const productExceptSelfBonus =
        rule.concepts.includes("prefix-suffix-product") &&
        (fullText.includes("product except self")
          || fullText.includes("product of all other elements")
          || fullText.includes("suffix products"))
          ? 90
          : 0;
      const genericSortedArrayPenalty =
        rule.topicId === "two-pointers" &&
        rule.concepts.length === 1 &&
        rule.concepts[0] === "two-pointers" &&
        rule.tokens.join(",") === "sorted,array" &&
        !fullText.includes("two sum") &&
        !fullText.includes("pair sum") &&
        !fullText.includes("left pointer") &&
        !fullText.includes("right pointer")
          ? 120
          : 0;
      const score =
        (confidenceRank[rule.confidence ?? "Low"] ?? 1) * 100
        + slugTokenHits * 25
        + textTokenHits * 10
        + phraseHits * 35
        + (problemStatement ? 15 : 0)
        + binarySearchBonus
        + logarithmicBonus
        + productExceptSelfBonus
        - genericSortedArrayPenalty;
      return { rule, score, slugTokenHits, phraseHits };
    })
    .filter((item): item is { rule: typeof heuristicRules[number]; score: number; slugTokenHits: number; phraseHits: number } => Boolean(item));
  if (!matchedRules.length) {
    return null;
  }

  const ranked = [...matchedRules]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.phraseHits !== left.phraseHits) return right.phraseHits - left.phraseHits;
      if (right.slugTokenHits !== left.slugTokenHits) return right.slugTokenHits - left.slugTokenHits;
      return left.rule.topicId.localeCompare(right.rule.topicId);
    });
  const best = ranked[0]?.rule;

  if (!best) {
    return null;
  }

  const alternateHypotheses = ranked
    .filter(({ rule }) => rule.topicId !== best.topicId || rule.concepts.join(",") !== best.concepts.join(","))
    .filter(({ rule }, index, items) =>
      items.findIndex((candidate) => (
        candidate.rule.topicId === rule.topicId &&
        candidate.rule.concepts.join(",") === rule.concepts.join(",")
      )) === index
    )
    .slice(0, 3)
    .map(({ rule }) => ({
      topicId: rule.topicId,
      conceptIds: rule.concepts,
      confidence: rule.confidence ?? "Low",
      reason: rule.reason
    }));

  if (best.topicId === "binary-search" && fullText.includes("search")) {
    pushAlternateHypothesis(alternateHypotheses, {
      topicId: "two-pointers",
      conceptIds: ["two-pointers"],
      confidence: "Low",
      reason: "If midpoint structure is weak, this target can still look like a directional scan problem."
    });
  }

  if (best.topicId === "two-pointers" && fullText.includes("sorted")) {
    pushAlternateHypothesis(alternateHypotheses, {
      topicId: "binary-search",
      conceptIds: ["binary-search-intro", "sorted-mid-check"],
      confidence: "Low",
      reason: "Sorted-array targets can also be mistaken for binary-search style midpoint reasoning."
    });
  }

  return {
    title: titleFromSlug(slug),
    topicId: best.topicId,
    conceptIds: best.concepts,
    prerequisiteConceptIds: best.prerequisites ?? best.concepts,
    roadmapBridgeProblemIds: best.roadmapBridgeProblemIds,
    difficulty: best.difficulty ?? "Medium",
    confidence: best.confidence ?? "Low",
    reasons: [
      best.reason,
      problemStatement
        ? "This target is not cataloged yet, so roadmap generation is using slug-plus-statement concept inference."
        : "This target is not cataloged yet, so roadmap generation is using slug-based concept inference."
    ],
    alternateHypotheses
  };
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

function learningRolePriority(problem: Problem): number {
  switch (problem.learningRole) {
    case "introduce":
      return 0;
    case "reinforce":
      return 1;
    case "mastery":
      return 2;
    default:
      return 3;
  }
}

function conceptDepth(conceptId: string, memo = new Map<string, number>()): number {
  if (memo.has(conceptId)) {
    return memo.get(conceptId) ?? 0;
  }
  const concept = getConceptById(conceptId);
  const depth = Math.max(
    0,
    ...(concept?.dependsOn ?? []).map((dependencyId) => conceptDepth(dependencyId, memo) + 1)
  );
  memo.set(conceptId, depth);
  return depth;
}

function topicConceptMap(topicId: string): Map<string, Concept> {
  return new Map(getTopicConcepts(topicId).map((concept) => [concept.id, concept]));
}

function buildConceptGraph(topicId: string): Map<string, Concept> {
  const localMap = topicConceptMap(topicId);
  const globalMap = new Map<string, Concept>();

  for (const [conceptId, concept] of localMap.entries()) {
    globalMap.set(conceptId, concept);
  }

  for (const concept of localMap.values()) {
    for (const dependencyId of concept.dependsOn ?? []) {
      const dependency = getConceptById(dependencyId);
      if (dependency && !globalMap.has(dependencyId)) {
        globalMap.set(dependencyId, dependency);
      }
    }
  }

  return globalMap;
}

function expandMissingConceptChain(topicId: string, conceptIds: string[], skillProfile: SkillProfile): string[] {
  const conceptMap = buildConceptGraph(topicId);
  const discovered = new Set<string>();
  const visit = (conceptId: string) => {
    if (discovered.has(conceptId)) return;
    discovered.add(conceptId);
    const concept = conceptMap.get(conceptId);
    for (const dependencyId of concept?.dependsOn ?? []) {
      if ((skillProfile.conceptScores[dependencyId] ?? 0) < 80) {
        visit(dependencyId);
      }
    }
  };

  conceptIds.forEach(visit);

  return Array.from(discovered).sort((left, right) => {
    const depthDelta = conceptDepth(left) - conceptDepth(right);
    if (depthDelta !== 0) return depthDelta;
    const leftScore = skillProfile.conceptScores[left] ?? 0;
    const rightScore = skillProfile.conceptScores[right] ?? 0;
    if (leftScore !== rightScore) return leftScore - rightScore;
    return left.localeCompare(right);
  });
}

function conceptChainSet(topicId: string, conceptIds: string[], skillProfile: SkillProfile): Set<string> {
  return new Set(expandMissingConceptChain(topicId, conceptIds, skillProfile));
}

export function findCatalogedTargetProblem(inputUrl: string): ExternalPracticeProblem | undefined {
  const normalized = normalizeExternalUrl(inputUrl);
  return getExternalPracticeCatalog().find((problem) => normalizeExternalUrl(problem.url) === normalized);
}

export function assessTargetProblemReadiness(
  inputUrl: string,
  problemStatementOrProgress?: string | ProgressState,
  progressOrSkillProfile?: ProgressState | SkillProfile,
  maybeSkillProfile?: SkillProfile
): TargetProblemAssessment {
  const {
    problemStatement,
    progress,
    skillProfile
  } = normalizeAssessmentArgs(problemStatementOrProgress, progressOrSkillProfile, maybeSkillProfile);
  const normalizedUrl = normalizeExternalUrl(inputUrl);
  const matchedProblem = findCatalogedTargetProblem(inputUrl);

  if (!matchedProblem) {
    const inferred = inferTargetFromInput(inputUrl, problemStatement);
    if (inferred) {
      const prerequisiteAverage = averageConceptScore(inferred.prerequisiteConceptIds, skillProfile);
      const strengthConceptIds = inferred.prerequisiteConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 80);
      const missingConceptIds = inferred.prerequisiteConceptIds.filter((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) < 75);
      const difficultyTarget = inferred.difficulty === "Easy" ? 72 : inferred.difficulty === "Medium" ? 82 : 90;
      const difficultyFit = clamp(100 - Math.max(0, difficultyTarget - prerequisiteAverage));
      const readinessScore = clamp(prerequisiteAverage * 0.75 + difficultyFit * 0.25);

      let verdict: TargetProblemAssessment["verdict"] = "not-ready";
      if (readinessScore >= 80 && missingConceptIds.length === 0) {
        verdict = "ready";
      } else if (readinessScore >= 60) {
        verdict = "close";
      }

      return {
        inputUrl,
        normalizedUrl,
        inferredTitle: inferred.title,
        inferredTopicId: inferred.topicId,
        inferredConceptIds: inferred.conceptIds,
        usedProblemStatement: Boolean(problemStatement?.trim()),
        alternateHypotheses: inferred.alternateHypotheses,
        readinessScore,
        verdict,
        readyNow: verdict === "ready",
        confidence: inferred.confidence,
        reasons: [
          ...inferred.reasons,
          `Average inferred prerequisite readiness is ${Math.round(prerequisiteAverage)}%.`
        ],
        strengthConceptIds,
        missingConceptIds
      };
    }
    return {
      inputUrl,
      normalizedUrl,
      readinessScore: 0,
      verdict: "unsupported",
      readyNow: false,
      usedProblemStatement: Boolean(problemStatement?.trim()),
      confidence: "Low",
      reasons: ["This URL is not in the current external problem catalog yet."],
      strengthConceptIds: [],
      missingConceptIds: [],
      inferredConceptIds: [],
      alternateHypotheses: []
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
    inferredConceptIds: matchedProblem.conceptIds,
    usedProblemStatement: Boolean(problemStatement?.trim()),
    alternateHypotheses: [],
    readinessScore,
    verdict,
    readyNow: verdict === "ready",
    confidence: "High",
    reasons,
    strengthConceptIds,
    missingConceptIds
  };
}

function selectInternalProblemForConcept(
  topicId: string,
  conceptId: string,
  progress: ProgressState,
  excludedProblemIds: Set<string>,
  alreadyChosenIds: Set<string>
): Problem | undefined {
  const concept = getConceptById(conceptId);
  const preferredIds = concept?.practiceProblems ?? [];
  const preferredCandidates = preferredIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => Boolean(problem))
    .filter((problem) =>
      !excludedProblemIds.has(problem.id)
      && !alreadyChosenIds.has(problem.id)
      && !solved(progress, problem.id)
      && problem.expectedConcepts.includes(conceptId)
    );

  const allTopicProblems = getTopicMetas().flatMap((topicMeta) => getTopicProblems(topicMeta.id));
  const candidates = allTopicProblems
    .filter((problem) =>
      !excludedProblemIds.has(problem.id)
      && !alreadyChosenIds.has(problem.id)
      && !solved(progress, problem.id)
      && problem.expectedConcepts.includes(conceptId)
    );

  const ranked = [...new Set([...preferredCandidates, ...candidates])]
    .sort((left, right) => {
      const leftSameTopic = normalizeTopicKey(getTopicIdForProblem(left.id) ?? "") === normalizeTopicKey(topicId) ? 0 : 1;
      const rightSameTopic = normalizeTopicKey(getTopicIdForProblem(right.id) ?? "") === normalizeTopicKey(topicId) ? 0 : 1;
      if (leftSameTopic !== rightSameTopic) return leftSameTopic - rightSameTopic;

      const leftPrimary = left.expectedConcepts[0] === conceptId ? 0 : 1;
      const rightPrimary = right.expectedConcepts[0] === conceptId ? 0 : 1;
      if (leftPrimary !== rightPrimary) return leftPrimary - rightPrimary;

      const leftPracticeIndex = preferredIds.indexOf(left.id);
      const rightPracticeIndex = preferredIds.indexOf(right.id);
      if (leftPracticeIndex !== rightPracticeIndex) {
        if (leftPracticeIndex === -1) return 1;
        if (rightPracticeIndex === -1) return -1;
        return leftPracticeIndex - rightPracticeIndex;
      }

      const leftPrereq = left.prerequisiteConcepts.includes(conceptId) ? 1 : 0;
      const rightPrereq = right.prerequisiteConcepts.includes(conceptId) ? 1 : 0;
      if (leftPrereq !== rightPrereq) return leftPrereq - rightPrereq;

      const roleDelta = learningRolePriority(left) - learningRolePriority(right);
      if (roleDelta !== 0) return roleDelta;

      const difficultyDelta = internalPriority(left) - internalPriority(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      return left.id.localeCompare(right.id);
    });

  return ranked[0];
}

function selectCheckpointProblem(
  topicId: string,
  conceptId: string,
  progress: ProgressState,
  excludedProblemIds: Set<string>,
  alreadyChosenIds: Set<string>
): Problem | undefined {
  const concept = getConceptById(conceptId);
  const preferredIds = concept?.practiceProblems ?? [];

  return preferredIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => Boolean(problem))
    .filter((problem) =>
      !excludedProblemIds.has(problem.id)
      && !alreadyChosenIds.has(problem.id)
      && !solved(progress, problem.id)
      && problem.expectedConcepts.includes(conceptId)
    )
    .sort((left, right) => {
      const roleDelta = learningRolePriority(left) - learningRolePriority(right);
      if (roleDelta !== 0) return roleDelta;
      const difficultyDelta = internalPriority(left) - internalPriority(right);
      if (difficultyDelta !== 0) return difficultyDelta;
      return left.id.localeCompare(right.id);
    })[0];
}

function buildInternalConceptSteps(
  target: Pick<ExternalPracticeProblem, "topicId" | "mappedFromProblemIds" | "roadmapBridgeProblemIds">,
  assessment: TargetProblemAssessment,
  progress: ProgressState,
  skillProfile: SkillProfile
): { problems: Problem[]; notes: string[]; conceptPlan: string[] } {
  const excludedProblemIds = new Set<string>(target.mappedFromProblemIds);
  const expandedConcepts = expandMissingConceptChain(target.topicId, assessment.missingConceptIds, skillProfile);
  const directMissingConceptIds = new Set(assessment.missingConceptIds);
  const orderedConcepts = [...expandedConcepts];
  const chosen: Problem[] = [];
  const chosenIds = new Set<string>();
  const coveredConceptIds = new Set<string>();
  const notes: string[] = [];
  const conceptPlan: string[] = [];

  for (const conceptId of orderedConcepts) {
    if (coveredConceptIds.has(conceptId)) {
      continue;
    }
    conceptPlan.push(conceptId);
    const problem = selectInternalProblemForConcept(target.topicId, conceptId, progress, excludedProblemIds, chosenIds);
    if (problem) {
      chosen.push(problem);
      chosenIds.add(problem.id);
      problem.expectedConcepts.forEach((coveredConceptId) => coveredConceptIds.add(coveredConceptId));
      continue;
    }

    const concept = getConceptById(conceptId);
    if (concept?.practiceProblems?.length) {
      const hasDeferredBridge = [...(target.mappedFromProblemIds ?? []), ...(target.roadmapBridgeProblemIds ?? [])]
        .map((problemId) => getProblemById(problemId))
        .filter((candidate): candidate is Problem => Boolean(candidate))
        .some((candidate) => !solved(progress, candidate.id) && candidate.expectedConcepts.includes(conceptId));
      if (hasDeferredBridge) {
        continue;
      }
      notes.push(`No separate unsolved internal bridge is available for ${concept.name}, so the roadmap will rely on its dependencies and then the target retry.`);
    }
  }

  return { problems: chosen, notes, conceptPlan };
}

function getConceptTopicId(conceptId: string): string | undefined {
  return getTopicMetas().find((topicMeta) =>
    getTopicConcepts(topicMeta.id).some((concept) => concept.id === conceptId)
  )?.id;
}

function classifyConceptForRoadmap(targetTopicId: string, conceptId: string): "core" | "support" {
  const conceptTopicId = getConceptTopicId(conceptId);
  if (!conceptTopicId) {
    return "support";
  }
  if (normalizeTopicKey(conceptTopicId) === normalizeTopicKey(targetTopicId)) {
    return "core";
  }
  return "support";
}

function supportWeaknessThreshold(conceptId: string, skillProfile: SkillProfile): "severe" | "moderate" | "light" {
  const score = skillProfile.conceptScores[conceptId] ?? 0;
  if (score < 35) return "severe";
  if (score < 60) return "moderate";
  return "light";
}

function isSupportOnlyProblem(targetTopicId: string, problem: Problem): boolean {
  return problem.expectedConcepts.length > 0
    && problem.expectedConcepts.every((conceptId) => classifyConceptForRoadmap(targetTopicId, conceptId) === "support");
}

function problemSupportSeverity(targetTopicId: string, problem: Problem, skillProfile: SkillProfile): number {
  const supportConcepts = problem.expectedConcepts.filter((conceptId) =>
    classifyConceptForRoadmap(targetTopicId, conceptId) === "support"
  );
  if (supportConcepts.length === 0) {
    return -1;
  }
  return Math.min(...supportConcepts.map((conceptId) => {
    const bucket = supportWeaknessThreshold(conceptId, skillProfile);
    if (bucket === "severe") return 0;
    if (bucket === "moderate") return 1;
    return 2;
  }));
}

function isRedundantSupportBridge(
  targetTopicId: string,
  supportProblem: Problem,
  allProblems: Problem[]
): boolean {
  if (!isSupportOnlyProblem(targetTopicId, supportProblem)) {
    return false;
  }

  const coreProblems = allProblems.filter((problem) => !isSupportOnlyProblem(targetTopicId, problem));
  if (coreProblems.length < 2) {
    return false;
  }

  const ignorableGenericSupportConcepts = new Set(["collection-iteration-usage"]);
  const relevantSupportConcepts = supportProblem.expectedConcepts.filter((conceptId) =>
    !ignorableGenericSupportConcepts.has(conceptId)
  );

  if (relevantSupportConcepts.length === 0) {
    return false;
  }

  return relevantSupportConcepts.every((conceptId) =>
    coreProblems.some((problem) =>
      problem.expectedConcepts.includes(conceptId) || problem.prerequisiteConcepts.includes(conceptId)
    )
  );
}

function personalizeInternalProblems(
  targetTopicId: string,
  problems: Problem[],
  skillProfile: SkillProfile,
  hasSameTopicExplicitBridge: boolean,
  protectedProblemIds: Set<string> = new Set<string>(),
  practiceMode: PracticeMode = "pro"
): Problem[] {
  const seenIds = new Set<string>();
  let severeSupportIncluded = false;
  let moderateSupportIncluded = 0;
  const kept = problems.filter((problem) => {
    if (seenIds.has(problem.id)) {
      return false;
    }
    seenIds.add(problem.id);

    if (protectedProblemIds.has(problem.id)) {
      if (isSupportOnlyProblem(targetTopicId, problem) && problemSupportSeverity(targetTopicId, problem, skillProfile) === 0) {
        severeSupportIncluded = true;
      }
      return true;
    }

    if (!isSupportOnlyProblem(targetTopicId, problem)) {
      return true;
    }

    const severity = problemSupportSeverity(targetTopicId, problem, skillProfile);

    if (practiceMode === "beginner") {
      if (severity === 0) {
        return true;
      }
      if (severity === 1) {
        if (moderateSupportIncluded >= 2) {
          return false;
        }
        moderateSupportIncluded += 1;
        return true;
      }
      return false;
    }

    if (isRedundantSupportBridge(targetTopicId, problem, problems)) {
      return false;
    }

    if (severity === 0) {
      if (severeSupportIncluded) {
        return false;
      }
      severeSupportIncluded = true;
      return true;
    }

    if (hasSameTopicExplicitBridge) {
      return false;
    }

    return severity === 1;
  });

  const coreProblems = kept.filter((problem) => !isSupportOnlyProblem(targetTopicId, problem));
  const supportProblems = kept
    .filter((problem) => isSupportOnlyProblem(targetTopicId, problem))
    .sort((left, right) => {
      const severityDelta = problemSupportSeverity(targetTopicId, left, skillProfile)
        - problemSupportSeverity(targetTopicId, right, skillProfile);
      if (severityDelta !== 0) return severityDelta;
      const roleDelta = learningRolePriority(left) - learningRolePriority(right);
      if (roleDelta !== 0) return roleDelta;
      const difficultyDelta = internalPriority(left) - internalPriority(right);
      if (difficultyDelta !== 0) return difficultyDelta;
      return left.id.localeCompare(right.id);
    });
  return [...supportProblems, ...coreProblems];
}

function orderInternalProblemsByProgression(problems: Problem[]): Problem[] {
  if (problems.length <= 1) {
    return problems;
  }

  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const problem of problems) {
    indegree.set(problem.id, 0);
    outgoing.set(problem.id, []);
  }

  for (const problem of problems) {
    for (const dependencyId of problem.remedialProblems ?? []) {
      if (!problemById.has(dependencyId)) {
        continue;
      }
      outgoing.get(dependencyId)?.push(problem.id);
      indegree.set(problem.id, (indegree.get(problem.id) ?? 0) + 1);
    }
  }

  const rank = (problem: Problem): [number, number, string] => [
    learningRolePriority(problem),
    internalPriority(problem),
    problem.id
  ];

  const available = problems
    .filter((problem) => (indegree.get(problem.id) ?? 0) === 0)
    .sort((left, right) => {
      const [leftRole, leftDifficulty, leftId] = rank(left);
      const [rightRole, rightDifficulty, rightId] = rank(right);
      if (leftRole !== rightRole) return leftRole - rightRole;
      if (leftDifficulty !== rightDifficulty) return leftDifficulty - rightDifficulty;
      return leftId.localeCompare(rightId);
    });

  const ordered: Problem[] = [];
  while (available.length > 0) {
    const current = available.shift();
    if (!current) break;
    ordered.push(current);

    for (const nextId of outgoing.get(current.id) ?? []) {
      const nextIndegree = (indegree.get(nextId) ?? 0) - 1;
      indegree.set(nextId, nextIndegree);
      if (nextIndegree === 0) {
        const nextProblem = problemById.get(nextId);
        if (nextProblem) {
          available.push(nextProblem);
          available.sort((left, right) => {
            const [leftRole, leftDifficulty, leftId] = rank(left);
            const [rightRole, rightDifficulty, rightId] = rank(right);
            if (leftRole !== rightRole) return leftRole - rightRole;
            if (leftDifficulty !== rightDifficulty) return leftDifficulty - rightDifficulty;
            return leftId.localeCompare(rightId);
          });
        }
      }
    }
  }

  return ordered.length === problems.length ? ordered : problems;
}

function chooseMappedInternalBridge(
  target: Pick<ExternalPracticeProblem, "topicId" | "mappedFromProblemIds" | "conceptIds" | "title">,
  assessment: TargetProblemAssessment,
  progress: ProgressState
): Problem | undefined {
  const targetConcepts = new Set(target.conceptIds);
  const missingConcepts = new Set(assessment.missingConceptIds);
  const targetTitleKey = normalizeTitleKey(target.title);
  const candidates = target.mappedFromProblemIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => Boolean(problem))
    .filter((problem) =>
      !solved(progress, problem.id) &&
      normalizeTopicKey(getTopicIdForProblem(problem.id) ?? "") === normalizeTopicKey(target.topicId)
    );
  return candidates
    .sort((left, right) => {
      const leftMissingOverlap = left.expectedConcepts.filter((conceptId) => missingConcepts.has(conceptId)).length;
      const rightMissingOverlap = right.expectedConcepts.filter((conceptId) => missingConcepts.has(conceptId)).length;
      if (leftMissingOverlap !== rightMissingOverlap) return rightMissingOverlap - leftMissingOverlap;

      const leftTargetOverlap = left.expectedConcepts.filter((conceptId) => targetConcepts.has(conceptId)).length;
      const rightTargetOverlap = right.expectedConcepts.filter((conceptId) => targetConcepts.has(conceptId)).length;
      if (leftTargetOverlap !== rightTargetOverlap) return rightTargetOverlap - leftTargetOverlap;

      const leftSameTitle = normalizeTitleKey(left.title) === targetTitleKey ? 1 : 0;
      const rightSameTitle = normalizeTitleKey(right.title) === targetTitleKey ? 1 : 0;
      if (leftSameTitle !== rightSameTitle) return leftSameTitle - rightSameTitle;

      const roleDelta = learningRolePriority(left) - learningRolePriority(right);
      if (roleDelta !== 0) return roleDelta;

      const difficultyDelta = internalPriority(left) - internalPriority(right);
      if (difficultyDelta !== 0) return difficultyDelta;

      return left.id.localeCompare(right.id);
    })[0];
}

function chooseExplicitBridgeProblems(
  problemIds: string[] | undefined,
  progress: ProgressState
): Problem[] {
  if (!problemIds?.length) {
    return [];
  }

  return problemIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => Boolean(problem))
    .filter((problem) => !solved(progress, problem.id));
}

function orderProblemsPreservingExplicitBridgeSequence(
  problems: Problem[],
  explicitBridgeIds: string[] | undefined
): Problem[] {
  if (!problems.length || !explicitBridgeIds?.length) {
    return orderInternalProblemsByProgression(problems);
  }

  const explicitRank = new Map(explicitBridgeIds.map((problemId, index) => [problemId, index]));
  const explicitProblems: Problem[] = [];
  const nonExplicitProblems: Problem[] = [];

  for (const problem of problems) {
    if (explicitRank.has(problem.id)) {
      explicitProblems.push(problem);
    } else {
      nonExplicitProblems.push(problem);
    }
  }

  explicitProblems.sort((left, right) => (explicitRank.get(left.id) ?? 0) - (explicitRank.get(right.id) ?? 0));
  return [...orderInternalProblemsByProgression(nonExplicitProblems), ...explicitProblems];
}

function injectBeginnerSupportProblems(
  targetTopicId: string,
  plannedProblems: Problem[],
  targetMappedProblemIds: string[],
  progress: ProgressState,
  skillProfile: SkillProfile
): Problem[] {
  const chosenIds = new Set(plannedProblems.map((problem) => problem.id));
  const excludedProblemIds = new Set<string>(targetMappedProblemIds);
  const supportConceptIds = [...new Set(
    plannedProblems.flatMap((problem) =>
      (problem.prerequisiteConcepts ?? []).filter((conceptId) =>
        classifyConceptForRoadmap(targetTopicId, conceptId) === "support"
        && (skillProfile.conceptScores[conceptId] ?? 0) < 75
      )
    )
  )];

  const supportProblems: Problem[] = [];
  for (const conceptId of supportConceptIds) {
    const supportProblem = selectInternalProblemForConcept(
      targetTopicId,
      conceptId,
      progress,
      excludedProblemIds,
      chosenIds
    );
    if (!supportProblem) {
      continue;
    }
    supportProblems.push(supportProblem);
    chosenIds.add(supportProblem.id);
  }

  return [...supportProblems, ...plannedProblems];
}

function chooseInternalCheckpoint(
  target: Pick<ExternalPracticeProblem, "topicId" | "mappedFromProblemIds" | "conceptIds">,
  progress: ProgressState,
  usedProblemIds: Set<string>,
  internalProblems: Problem[],
  orderedConceptPlan: string[]
): Problem | undefined {
  const excludedProblemIds = new Set<string>([...usedProblemIds, ...target.mappedFromProblemIds]);
  const targetConcepts = new Set(target.conceptIds);
  const coveredTargetConcepts = new Set(
    internalProblems.flatMap((problem) => problem.expectedConcepts.filter((conceptId) => targetConcepts.has(conceptId)))
  );
  const checkpointConceptPlan = [...orderedConceptPlan]
    .filter((conceptId) => targetConcepts.has(conceptId))
    .reverse();

  for (const conceptId of checkpointConceptPlan) {
    if (coveredTargetConcepts.has(conceptId)) {
      continue;
    }
    const checkpoint = selectCheckpointProblem(target.topicId, conceptId, progress, excludedProblemIds, usedProblemIds);
    if (checkpoint) {
      return checkpoint;
    }
  }

  return undefined;
}

function chooseExternalTransfer(
  target: Pick<ExternalPracticeProblem, "id" | "title" | "topicId" | "conceptIds">,
  assessment: TargetProblemAssessment,
  internalProblems: Problem[],
  skillProfile: SkillProfile
): ExternalPracticeProblem | undefined {
  const targetConcepts = new Set(target.conceptIds);
  const missingConcepts = new Set(assessment.missingConceptIds);
  const foundationConcepts = conceptChainSet(target.topicId, assessment.missingConceptIds, skillProfile);
  const internalProblemIds = new Set(internalProblems.map((problem) => problem.id));

  return getExternalPracticeCatalog()
    .filter((problem) => problem.topicId === target.topicId && !isTargetTwinOrSequel(problem, target))
    .map((problem) => {
      const targetOverlap = problem.conceptIds.filter((conceptId) => targetConcepts.has(conceptId)).length;
      const missingOverlap = problem.conceptIds.filter((conceptId) => missingConcepts.has(conceptId)).length;
      const recommendedBridge = problem.recommendedAfterProblemIds.filter((problemId) => internalProblemIds.has(problemId)).length;
      const mappedBridge = problem.mappedFromProblemIds.filter((problemId) => internalProblemIds.has(problemId)).length;
      const prerequisiteCoverage = problem.prerequisiteConceptIds.every(
        (conceptId) => targetConcepts.has(conceptId) || foundationConcepts.has(conceptId)
      );
      const score = missingOverlap * 3 + targetOverlap * 2 + recommendedBridge * 4 + mappedBridge * 4;
      return { problem, targetOverlap, missingOverlap, prerequisiteCoverage, score, recommendedBridge, mappedBridge };
    })
    .filter((item) => item.prerequisiteCoverage && item.score >= 5)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.missingOverlap !== left.missingOverlap) return right.missingOverlap - left.missingOverlap;
      if (right.targetOverlap !== left.targetOverlap) return right.targetOverlap - left.targetOverlap;
      if (left.problem.difficulty !== right.problem.difficulty) {
        return (left.problem.difficulty === "Easy" ? 0 : left.problem.difficulty === "Medium" ? 1 : 2)
          - (right.problem.difficulty === "Easy" ? 0 : right.problem.difficulty === "Medium" ? 1 : 2);
      }
      return right.problem.sourceQualityWeight - left.problem.sourceQualityWeight;
    })[0]?.problem;
}

function shouldAddExternalTransfer(
  matchedProblem: ExternalPracticeProblem | undefined,
  assessment: TargetProblemAssessment,
  internalProblems: Problem[]
): boolean {
  if (!matchedProblem) {
    return false;
  }

  const coveredConcepts = new Set(internalProblems.flatMap((problem) => problem.expectedConcepts));
  const targetConceptsCovered = matchedProblem.conceptIds.every((conceptId) => coveredConcepts.has(conceptId));
  const hasExplicitBridges = (matchedProblem.roadmapBridgeProblemIds?.length ?? 0) > 0;
  const simpleEasyTarget = matchedProblem.difficulty === "Easy" && matchedProblem.conceptIds.length <= 1;

  if (simpleEasyTarget && targetConceptsCovered) {
    return false;
  }

  if (hasExplicitBridges && targetConceptsCovered) {
    return false;
  }

  return true;
}

export function createTargetProblemRoadmap(
  inputUrl: string,
  problemStatementOrProgress?: string | ProgressState,
  progressOrSkillProfile?: ProgressState | SkillProfile,
  maybeSkillProfile?: SkillProfile,
  options: TargetRoadmapOptions = {}
): TargetProblemRoadmapPlan {
  const practiceMode = options.practiceMode === "beginner" ? "beginner" : "pro";
  const {
    problemStatement,
    progress,
    skillProfile
  } = normalizeAssessmentArgs(problemStatementOrProgress, progressOrSkillProfile, maybeSkillProfile);
  const assessment = problemStatement === undefined
    ? assessTargetProblemReadiness(inputUrl, progress, skillProfile)
    : assessTargetProblemReadiness(inputUrl, problemStatement, progress, skillProfile);
  const heuristicTarget = !assessment.matchedProblem && assessment.inferredTopicId
      ? {
        id: `heuristic-${parseLeetCodeSlug(inputUrl) ?? "target"}`,
        title: assessment.inferredTitle ?? titleFromSlug(parseLeetCodeSlug(inputUrl) ?? "target"),
        topicId: assessment.inferredTopicId,
        conceptIds: assessment.missingConceptIds.length ? assessment.missingConceptIds : assessment.strengthConceptIds,
        prerequisiteConceptIds: assessment.missingConceptIds.length ? assessment.missingConceptIds : assessment.strengthConceptIds,
        roadmapBridgeProblemIds: assessment.inferredTitle === "Spiral Matrix" ? ["arr-037", "arr-038"] : [],
        mappedFromProblemIds: []
      }
    : null;

  if (!assessment.matchedProblem && !heuristicTarget) {
    return { assessment, steps: [] };
  }

  const target = assessment.matchedProblem ?? heuristicTarget;
  if (!target) {
    return { assessment, steps: [] };
  }
  const internalPlan = buildInternalConceptSteps(target, assessment, progress, skillProfile);
  const explicitBridgeIdsFromTarget = assessment.matchedProblem
    ? assessment.matchedProblem.roadmapBridgeProblemIds
    : ("roadmapBridgeProblemIds" in target ? target.roadmapBridgeProblemIds : undefined);
  const mappedBridge = explicitBridgeIdsFromTarget?.length
    ? undefined
    : assessment.matchedProblem
    ? chooseMappedInternalBridge(assessment.matchedProblem, assessment, progress)
    : undefined;
  const explicitBridges = chooseExplicitBridgeProblems(explicitBridgeIdsFromTarget, progress);
  const explicitBridgeIds = new Set(explicitBridges.map((problem) => problem.id));
  const hasSameTopicExplicitBridge = explicitBridges.some((problem) =>
    normalizeTopicKey(getTopicIdForProblem(problem.id) ?? "") === normalizeTopicKey(target.topicId)
  );
  const bridgeCoveredConcepts = new Set([
    ...explicitBridges.flatMap((problem) => problem.expectedConcepts),
    ...(mappedBridge?.expectedConcepts ?? [])
  ]);
  const targetTitleKey = normalizeTitleKey(assessment.matchedProblem?.title ?? target.title);
  const remainingInternalPlan = internalPlan.problems.filter((problem) => {
    if (explicitBridgeIds.has(problem.id)) {
      return false;
    }
    if ((explicitBridgeIdsFromTarget?.length ?? 0) > 0) {
      const problemTopicId = getTopicIdForProblem(problem.id) ?? "";
      const sameTitleTwin = normalizeTitleKey(problem.title) === targetTitleKey;
      if (sameTitleTwin) {
        return false;
      }
      if (practiceMode === "pro" && normalizeTopicKey(problemTopicId) !== "language-toolkit") {
        return false;
      }
    }
    const addressedPlannedConcepts = problem.expectedConcepts.filter((conceptId) => internalPlan.conceptPlan.includes(conceptId));
    if ((explicitBridgeIdsFromTarget?.length ?? 0) > 0 && hasSameTopicExplicitBridge) {
      const directTargetOverlap = problem.expectedConcepts.some((conceptId) =>
        assessment.missingConceptIds.includes(conceptId) || target.conceptIds.includes(conceptId)
      );
      if (!directTargetOverlap) {
        return false;
      }
    }
    return addressedPlannedConcepts.some((conceptId) => !bridgeCoveredConcepts.has(conceptId));
  });
  const baseInternalProblems = mappedBridge && !explicitBridgeIds.has(mappedBridge.id)
    ? [mappedBridge, ...remainingInternalPlan.filter((problem) => problem.id !== mappedBridge.id)]
    : remainingInternalPlan;
  const practicePlannedProblems = practiceMode === "beginner"
    ? injectBeginnerSupportProblems(
      target.topicId,
      [...baseInternalProblems, ...explicitBridges],
      target.mappedFromProblemIds,
      progress,
      skillProfile
    )
    : [...baseInternalProblems, ...explicitBridges];
  const internalProblems = orderProblemsPreservingExplicitBridgeSequence(
    personalizeInternalProblems(
      target.topicId,
      practicePlannedProblems,
      skillProfile,
      hasSameTopicExplicitBridge,
      explicitBridgeIds,
      practiceMode
    ),
    explicitBridgeIdsFromTarget
  );
  const usedInternalIds = new Set(internalProblems.map((problem) => problem.id));
  const checkpoint = chooseInternalCheckpoint(target, progress, usedInternalIds, internalProblems, internalPlan.conceptPlan);
  const transfer = assessment.matchedProblem && shouldAddExternalTransfer(assessment.matchedProblem, assessment, internalProblems)
    ? chooseExternalTransfer(target, assessment, internalProblems, skillProfile)
    : undefined;

  const steps: TargetProblemRoadmapStep[] = internalProblems.map((problem) => {
    const addressedConcepts = problem.expectedConcepts
      .filter((conceptId) => assessment.missingConceptIds.includes(conceptId) || target.conceptIds.includes(conceptId))
      .map((conceptId) => getConceptById(conceptId)?.name ?? conceptId);

    return {
      id: `internal-${problem.id}`,
      type: "internal",
      title: `${problem.id} · ${problem.title}`,
      reason: `Build the foundation for ${addressedConcepts.join(", ") || "the target pattern"} before retrying the target.`,
      conceptIds: problem.expectedConcepts,
      internalProblemId: problem.id
    };
  });

  if (checkpoint) {
    steps.push({
      id: `internal-${checkpoint.id}`,
      type: "internal",
      title: `${checkpoint.id} · ${checkpoint.title}`,
      reason: "Use one internal checkpoint that is close to the target pattern without being the same problem.",
      conceptIds: checkpoint.expectedConcepts,
      internalProblemId: checkpoint.id
    });
  }

  if (transfer && steps.length >= 1) {
    steps.push({
      id: `external-${transfer.id}`,
      type: "external",
      title: transfer.title,
      reason: "Try one closely related external transfer problem before the final target retry.",
      conceptIds: transfer.conceptIds,
      externalProblemId: transfer.id,
      url: transfer.url
    });
  }

  steps.push({
    id: `target-${target.id}`,
    type: "target",
    title: assessment.matchedProblem?.title ?? assessment.inferredTitle ?? titleFromSlug(parseLeetCodeSlug(inputUrl) ?? "Target Problem"),
    reason: assessment.readyNow
      ? "You already look ready. Retry the target now."
      : "Retry the target after finishing the dependency-aware roadmap steps.",
    conceptIds: target.conceptIds,
    externalProblemId: assessment.matchedProblem?.id,
    url: inputUrl
  });

  return {
    assessment,
    strategy: practiceMode === "beginner" ? "beginner-foundation-first" : "concept-practice-first",
    notes: hasSameTopicExplicitBridge ? [] : internalPlan.notes,
    steps
  };
}
