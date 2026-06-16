import { Concept, Problem, TopicMeta } from "../../types";
import bitManipulationMeta from "./bit-manipulation/meta.json";
import bitManipulationProblems from "./bit-manipulation/problems.json";
import bitManipulationConcepts from "./bit-manipulation/concepts.json";
import arraysMeta from "./arrays/meta.json";
import arraysProblems from "./arrays/problems.json";
import arraysConcepts from "./arrays/concepts.json";
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

export const defaultTopicId = "bit-manipulation";

export const topicOrder = [
  "arrays",
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

export const topicPacks: Record<string, TopicPack> = {
  "bit-manipulation": {
    meta: bitManipulationMeta as TopicMeta,
    problems: bitManipulationProblems as Problem[],
    concepts: bitManipulationConcepts as Concept[]
  },
  arrays: {
    meta: arraysMeta as TopicMeta,
    problems: arraysProblems as Problem[],
    concepts: arraysConcepts as Concept[]
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
    problems: recursionProblems as Problem[],
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
