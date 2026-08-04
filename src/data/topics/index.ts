import { Concept, Problem, TopicMeta } from "../../types";
import bitManipulationMeta from "./bit-manipulation/meta.json";
import bitManipulationProblems from "./bit-manipulation/problems.json";
import bitManipulationConcepts from "./bit-manipulation/concepts.json";
import arraysMeta from "./arrays/meta.json";
import arraysProblems from "./arrays/problems.json";
import arraysConcepts from "./arrays/concepts.json";
import twoPointersMeta from "./two-pointers/meta.json";
import slidingWindowMeta from "./sliding-window/meta.json";
import prefixSuffixMeta from "./prefix-suffix/meta.json";
import binarySearchMeta from "./binary-search/meta.json";
import binarySearchProblems from "./binary-search/problems.json";
import binarySearchConcepts from "./binary-search/concepts.json";
import dpMeta from "./dp/meta.json";
import dpProblems from "./dp/problems.json";
import dpConcepts from "./dp/concepts.json";
import graphsMeta from "./graphs/meta.json";
import graphsProblems from "./graphs/problems.json";
import graphsConcepts from "./graphs/concepts.json";
import linkedListMeta from "./linked-list/meta.json";
import linkedListProblems from "./linked-list/problems.json";
import linkedListConcepts from "./linked-list/concepts.json";
import programmingMathematicsMeta from "./programming-mathematics/meta.json";
import programmingMathematicsProblems from "./programming-mathematics/problems.json";
import programmingMathematicsConcepts from "./programming-mathematics/concepts.json";
import recursionMeta from "./recursion/meta.json";
import recursionProblems from "./recursion/problems.json";
import recursionConcepts from "./recursion/concepts.json";
import queueMeta from "./queue/meta.json";
import queueProblems from "./queue/problems.json";
import queueConcepts from "./queue/concepts.json";
import stackMeta from "./stack/meta.json";
import stackProblems from "./stack/problems.json";
import stackConcepts from "./stack/concepts.json";
import treesMeta from "./trees/meta.json";
import treesProblems from "./trees/problems.json";
import treesConcepts from "./trees/concepts.json";

export interface TopicPack {
  meta: TopicMeta;
  problems: Problem[];
  concepts: Concept[];
}

const twoPointerProblemIds = new Set(["arr-003", "arr-008", "arr-009", "arr-015", "arr-016", "arr-023", "arr-026", "arr-031", "arr-032"]);
const slidingWindowProblemIds = new Set(["arr-010", "arr-018", "arr-024", "arr-030", "arr-033", "arr-034"]);
const prefixSuffixProblemIds = new Set(["arr-006", "arr-012", "arr-014", "arr-020", "arr-021", "arr-027", "arr-035", "arr-036"]);

const twoPointerConceptIds = new Set(["array-traversal", "sorted-check", "reverse-array", "two-pointers", "in-place-array-update", "opposite-end-pointers", "partition-two-pointers"]);
const slidingWindowConceptIds = new Set(["array-traversal", "prefix-sum", "two-pointers", "sliding-window", "fixed-size-window", "variable-size-window", "window-auxiliary-structure"]);
const prefixSuffixConceptIds = new Set(["array-traversal", "prefix-sum", "frequency-counting", "prefix-suffix-product", "prefix-balance", "prefix-modulo"]);
const remainingArrayConceptIds = new Set([
  "array-traversal",
  "min-max-array",
  "sorted-check",
  "second-largest",
  "frequency-counting",
  "kadane-algorithm",
  "stock-profit"
]);

function cloneTopicProblems(problems: Problem[], ids: Set<string>, topic: string): Problem[] {
  return problems
    .filter((problem) => ids.has(problem.id))
    .map((problem) => ({
      ...problem,
      topic
    }));
}

function cloneTopicConcepts(concepts: Concept[], ids: Set<string>): Concept[] {
  return concepts
    .filter((concept) => ids.has(concept.id))
    .map((concept) => ({ ...concept }));
}

function normalizeRecursionProblems(problems: Problem[]): Problem[] {
  const fallbackPoolRoles: Array<Problem["poolRole"]> = [
    "core",
    "core",
    "core",
    "practice",
    "practice",
    "core",
    "practice",
    "practice",
    "core",
    "practice",
    "challenge",
    "challenge",
    "practice",
    "challenge",
    "practice",
    "challenge",
    "challenge",
    "practice",
    "challenge",
    "practice",
    "practice",
    "challenge",
    "practice",
    "challenge"
  ];
  const fallbackMasteryWeights = [
    1, 1, 1.05, 0.95, 0.95, 1.1, 0.9, 0.9, 1, 0.95, 1.2, 1.2,
    0.9, 1.25, 0.95, 1.3, 1.35, 0.9, 1.35, 0.95, 0.95, 1.4, 0.95, 1.45
  ];

  return problems.map((problem, index) => {
    const poolRole = problem.poolRole ?? fallbackPoolRoles[index] ?? "core";
    return {
      ...problem,
      poolRole,
      masteryWeight: problem.masteryWeight ?? fallbackMasteryWeights[index] ?? 1,
      variantGroup: problem.variantGroup ?? `recursion-${problem.subtopic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      learningRole: problem.learningRole ?? (poolRole === "challenge" ? "mastery" : poolRole === "practice" || poolRole === "review" ? "reinforce" : "introduce")
    };
  });
}

export const defaultTopicId = "programming-mathematics";

export const topicOrder = [
  "programming-mathematics",
  "arrays",
  "two-pointers",
  "sliding-window",
  "prefix-suffix",
  "bit-manipulation",
  "linked-list",
  "stack",
  "queue",
  "recursion",
  "binary-search",
  "trees",
  "graphs",
  "dp"
] as const;

const remainingArrayProblems = (arraysProblems as Problem[]).filter((problem) =>
  !twoPointerProblemIds.has(problem.id) &&
  !slidingWindowProblemIds.has(problem.id) &&
  !prefixSuffixProblemIds.has(problem.id)
);

const arrayTwoPointerProblems = cloneTopicProblems(arraysProblems as Problem[], twoPointerProblemIds, "Two Pointers");
const arraySlidingWindowProblems = cloneTopicProblems(arraysProblems as Problem[], slidingWindowProblemIds, "Sliding Window");
const arrayPrefixSuffixProblems = cloneTopicProblems(arraysProblems as Problem[], prefixSuffixProblemIds, "Prefix-Suffix");

const remainingArrayConcepts = cloneTopicConcepts(arraysConcepts as Concept[], remainingArrayConceptIds);
const arrayTwoPointerConcepts = cloneTopicConcepts(arraysConcepts as Concept[], twoPointerConceptIds);
const arraySlidingWindowConcepts = cloneTopicConcepts(arraysConcepts as Concept[], slidingWindowConceptIds);
const arrayPrefixSuffixConcepts = cloneTopicConcepts(arraysConcepts as Concept[], prefixSuffixConceptIds);

export const topicPacks: Record<string, TopicPack> = {
  "programming-mathematics": {
    meta: programmingMathematicsMeta as TopicMeta,
    problems: programmingMathematicsProblems as Problem[],
    concepts: programmingMathematicsConcepts as Concept[]
  },
  "bit-manipulation": {
    meta: bitManipulationMeta as TopicMeta,
    problems: bitManipulationProblems as Problem[],
    concepts: bitManipulationConcepts as Concept[]
  },
  arrays: {
    meta: arraysMeta as TopicMeta,
    problems: remainingArrayProblems,
    concepts: remainingArrayConcepts
  },
  "two-pointers": {
    meta: twoPointersMeta as TopicMeta,
    problems: arrayTwoPointerProblems,
    concepts: arrayTwoPointerConcepts
  },
  "sliding-window": {
    meta: slidingWindowMeta as TopicMeta,
    problems: arraySlidingWindowProblems,
    concepts: arraySlidingWindowConcepts
  },
  "prefix-suffix": {
    meta: prefixSuffixMeta as TopicMeta,
    problems: arrayPrefixSuffixProblems,
    concepts: arrayPrefixSuffixConcepts
  },
  "binary-search": {
    meta: binarySearchMeta as TopicMeta,
    problems: binarySearchProblems as Problem[],
    concepts: binarySearchConcepts as Concept[]
  },
  dp: {
    meta: dpMeta as TopicMeta,
    problems: dpProblems as Problem[],
    concepts: dpConcepts as Concept[]
  },
  graphs: {
    meta: graphsMeta as TopicMeta,
    problems: graphsProblems as Problem[],
    concepts: graphsConcepts as Concept[]
  },
  "linked-list": {
    meta: linkedListMeta as TopicMeta,
    problems: linkedListProblems as Problem[],
    concepts: linkedListConcepts as Concept[]
  },
  recursion: {
    meta: recursionMeta as TopicMeta,
    problems: normalizeRecursionProblems(recursionProblems as Problem[]),
    concepts: recursionConcepts as Concept[]
  },
  queue: {
    meta: queueMeta as TopicMeta,
    problems: queueProblems as Problem[],
    concepts: queueConcepts as Concept[]
  },
  stack: {
    meta: stackMeta as TopicMeta,
    problems: stackProblems as Problem[],
    concepts: stackConcepts as Concept[]
  },
  trees: {
    meta: treesMeta as TopicMeta,
    problems: treesProblems as Problem[],
    concepts: treesConcepts as Concept[]
  }
};
