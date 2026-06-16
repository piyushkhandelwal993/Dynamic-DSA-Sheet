import { ActiveQuest, MasteryTier, Problem, ProgressState, SkillProfile, WorldZone } from "../types";
import { recommendNextProblem } from "./recommendation";

const zoneDefinitionsByTopic: Record<string, Array<{ id: string; name: string; description: string; subtopics: string[]; gateConcepts: string[] }>> = {
  "bit-manipulation": [
    {
      id: "binary-gates",
      name: "Binary Gates",
      description: "Learn how numbers look and behave at the bit level.",
      subtopics: ["Binary Representation", "Odd Even Check", "Odd/even using bit"],
      gateConcepts: []
    },
    {
      id: "mask-forge",
      name: "Mask Forge",
      description: "Build masks and target individual bits with confidence.",
      subtopics: ["Check ith Bit", "Set ith Bit", "Clear ith Bit", "Toggle ith Bit", "Left shift / right shift"],
      gateConcepts: ["binary-representation", "odd-even-check"]
    },
    {
      id: "bit-count-barracks",
      name: "Bit Count Barracks",
      description: "Count, clear, and classify set bits efficiently.",
      subtopics: ["Count set bits", "Brian Kernighan algorithm", "Power of two"],
      gateConcepts: ["check-ith-bit", "left-shift", "bitwise-and"]
    },
    {
      id: "xor-dungeon",
      name: "XOR Dungeon",
      description: "Master XOR cancellation and unique-number tricks.",
      subtopics: ["XOR tricks", "Single number", "Two unique numbers", "Missing number", "Swap using XOR"],
      gateConcepts: ["bitwise-xor", "count-set-bits"]
    },
    {
      id: "bitmask-arena",
      name: "Bitmask Arena",
      description: "Use bitmasks for subsets, state compression, and advanced fights.",
      subtopics: ["Subsets using bits", "Bitmasking basics", "LeetCode-style problems"],
      gateConcepts: ["subsets-using-bits", "bitmasking-basics", "single-number"]
    }
  ],
  recursion: [
    {
      id: "base-camp",
      name: "Base Camp",
      description: "Learn the shape of recursion with base cases and shrinking calls.",
      subtopics: ["What recursion is", "Base case and recursive case", "Parameterized recursion", "Functional recursion"],
      gateConcepts: []
    },
    {
      id: "string-array-spire",
      name: "String and Array Spire",
      description: "Practice recursion on strings, digits, and ranges.",
      subtopics: ["Recursion on strings", "Recursion on arrays"],
      gateConcepts: ["recursion-intro", "base-case"]
    },
    {
      id: "backtracking-vault",
      name: "Backtracking Vault",
      description: "Unlock branching recursion, subsequences, and permutations.",
      subtopics: ["Backtracking basics", "Subsequences and subsets", "Permutations"],
      gateConcepts: ["parameterized-recursion", "functional-recursion"]
    },
    {
      id: "memo-halls",
      name: "Memo Halls",
      description: "Tame repeated recursive states with caching.",
      subtopics: ["Memoization"],
      gateConcepts: ["tree-recursion"]
    },
    {
      id: "divide-tower",
      name: "Divide Tower",
      description: "Climb into recursive search and divide-and-conquer battles.",
      subtopics: ["Divide and conquer", "Recursive search problems"],
      gateConcepts: ["backtracking-basics", "memoization"]
    }
  ],
  arrays: [
    {
      id: "traversal-meadow",
      name: "Traversal Meadow",
      description: "Scan arrays cleanly and build confidence with linear passes.",
      subtopics: ["Traversal basics", "Min and max"],
      gateConcepts: []
    },
    {
      id: "counting-grove",
      name: "Counting Grove",
      description: "Count, compare, and reason about repeated values.",
      subtopics: ["Counting and frequency"],
      gateConcepts: ["array-traversal", "min-max-array"]
    },
    {
      id: "prefix-ridge",
      name: "Prefix Ridge",
      description: "Precompute running information for faster range answers.",
      subtopics: ["Prefix sums"],
      gateConcepts: ["array-traversal"]
    },
    {
      id: "pointer-pass",
      name: "Pointer Pass",
      description: "Use two moving indices to transform arrays in place.",
      subtopics: ["Two pointers"],
      gateConcepts: ["reverse-array", "sorted-check"]
    },
    {
      id: "window-summit",
      name: "Window Summit",
      description: "Master linear-time window management and advanced scans.",
      subtopics: ["Sliding window basics"],
      gateConcepts: ["two-pointers", "prefix-sum"]
    }
  ],
  "linked-list": [
    {
      id: "node-dock",
      name: "Node Dock",
      description: "Meet nodes, pointers, and the core linked-list traversal loop.",
      subtopics: ["Traversal and length"],
      gateConcepts: []
    },
    {
      id: "pointer-bridge",
      name: "Pointer Bridge",
      description: "Change head links and reconnect nodes safely.",
      subtopics: ["Insertion and deletion"],
      gateConcepts: ["ll-traversal", "ll-length"]
    },
    {
      id: "reverse-wharf",
      name: "Reverse Wharf",
      description: "Flip next pointers without losing the rest of the list.",
      subtopics: ["Reversal"],
      gateConcepts: ["ll-head-tail-update"]
    },
    {
      id: "cycle-channel",
      name: "Cycle Channel",
      description: "Use fast and slow pointers to find structure without extra memory.",
      subtopics: ["Fast and slow pointers"],
      gateConcepts: ["ll-traversal", "ll-reverse"]
    },
    {
      id: "merge-harbor",
      name: "Merge Harbor",
      description: "Stitch sorted lists and clean up duplicates with pointer discipline.",
      subtopics: ["Merge and cleanup"],
      gateConcepts: ["ll-fast-slow", "ll-node-delete"]
    }
  ],
  stack: [
    {
      id: "stack-foundry",
      name: "Stack Foundry",
      description: "Learn stack operations, storage, and simple LIFO simulations.",
      subtopics: ["Stack basics", "Stack simulation"],
      gateConcepts: []
    },
    {
      id: "bracket-bastion",
      name: "Bracket Bastion",
      description: "Use stacks to validate structure and reverse order safely.",
      subtopics: ["Balanced brackets", "Reverse using stack"],
      gateConcepts: ["stack-intro", "stack-operations"]
    },
    {
      id: "operator-lab",
      name: "Operator Lab",
      description: "Evaluate and convert expressions with disciplined push and pop logic.",
      subtopics: ["Expression evaluation", "Expression conversion"],
      gateConcepts: ["balanced-parentheses", "postfix-evaluation"]
    },
    {
      id: "monotonic-mine",
      name: "Monotonic Mine",
      description: "Unlock next-greater, stock-span, and daily temperature patterns.",
      subtopics: ["Monotonic stack"],
      gateConcepts: ["stack-operations", "reverse-using-stack"]
    },
    {
      id: "histogram-keep",
      name: "Histogram Keep",
      description: "Climb into advanced stack problems with ranges, rectangles, and collision-style simulations.",
      subtopics: ["Advanced stack applications"],
      gateConcepts: ["monotonic-stack", "expression-conversion"]
    }
  ],
  queue: [
    {
      id: "line-gate",
      name: "Line Gate",
      description: "Meet FIFO behavior and build the basic enqueue-dequeue reflex.",
      subtopics: ["Queue basics", "Queue simulation"],
      gateConcepts: []
    },
    {
      id: "ring-yard",
      name: "Ring Yard",
      description: "Stabilize index movement with circular arrays and queue implementation details.",
      subtopics: ["Circular queue"],
      gateConcepts: ["queue-intro", "queue-operations"]
    },
    {
      id: "breadth-plaza",
      name: "Breadth Plaza",
      description: "Use queues to process layers, schedules, and breadth-first flows.",
      subtopics: ["BFS-style queue", "Task scheduling"],
      gateConcepts: ["queue-simulation", "generate-binary-numbers"]
    },
    {
      id: "deque-river",
      name: "Deque River",
      description: "Master double-ended control for sliding-window and window-maximum problems.",
      subtopics: ["Deque techniques", "Sliding window with deque"],
      gateConcepts: ["circular-queue", "bfs-on-grid"]
    },
    {
      id: "heap-docks",
      name: "Heap Docks",
      description: "Bring in priority queues for advanced ordering and top-k style challenges.",
      subtopics: ["Priority queue applications", "Advanced queue applications"],
      gateConcepts: ["deque-technique", "top-k-elements"]
    }
  ],
  "binary-search": [
    {
      id: "sorted-gate",
      name: "Sorted Gate",
      description: "Learn classic binary search on sorted arrays and exact matches.",
      subtopics: ["Binary search basics"],
      gateConcepts: []
    },
    {
      id: "boundary-arch",
      name: "Boundary Arch",
      description: "Lock onto first, last, lower-bound, and insertion positions.",
      subtopics: ["Boundaries and occurrences"],
      gateConcepts: ["binary-search-intro", "sorted-mid-check"]
    },
    {
      id: "rotation-ridge",
      name: "Rotation Ridge",
      description: "Handle partially sorted arrays, peaks, and pivot logic.",
      subtopics: ["Rotated arrays and peaks"],
      gateConcepts: ["lower-bound", "first-last-occurrence"]
    },
    {
      id: "answer-basin",
      name: "Answer Basin",
      description: "Search over the answer space using feasibility checks.",
      subtopics: ["Answer-space binary search"],
      gateConcepts: ["rotated-array-search", "peak-element"]
    },
    {
      id: "partition-spire",
      name: "Partition Spire",
      description: "Finish with advanced partition and median-style binary search problems.",
      subtopics: ["Advanced binary search"],
      gateConcepts: ["answer-binary-search", "capacity-search"]
    }
  ],
  trees: [
    {
      id: "root-grove",
      name: "Root Grove",
      description: "Understand tree nodes, recursion, and the core DFS traversal forms.",
      subtopics: ["Tree basics", "DFS traversals"],
      gateConcepts: []
    },
    {
      id: "level-lanterns",
      name: "Level Lanterns",
      description: "Move across the tree breadth-first and reason level by level.",
      subtopics: ["BFS traversals", "Tree views"],
      gateConcepts: ["tree-intro", "recursive-tree-traversal"]
    },
    {
      id: "bst-terrace",
      name: "BST Terrace",
      description: "Use ordered tree properties for search, insert, delete, and validation.",
      subtopics: ["BST operations"],
      gateConcepts: ["tree-height", "level-order-traversal"]
    },
    {
      id: "path-sanctum",
      name: "Path Sanctum",
      description: "Study depth, diameter, balancing, and lowest-common-ancestor reasoning.",
      subtopics: ["Tree properties and paths"],
      gateConcepts: ["bst-search", "balanced-tree-check"]
    },
    {
      id: "builder-citadel",
      name: "Builder Citadel",
      description: "Finish with construction, serialization, and advanced tree assembly problems.",
      subtopics: ["Tree construction", "Advanced tree applications"],
      gateConcepts: ["lca-binary-tree", "tree-view"]
    }
  ],
  graphs: [
    {
      id: "adjacency-yard",
      name: "Adjacency Yard",
      description: "Learn graph representation and basic BFS/DFS traversal patterns.",
      subtopics: ["Graph basics", "Graph traversals"],
      gateConcepts: []
    },
    {
      id: "component-bridge",
      name: "Component Bridge",
      description: "Reason about components, cycles, and reachability across graph structure.",
      subtopics: ["Components and cycles", "Grid traversal"],
      gateConcepts: ["graph-intro", "dfs-graph"]
    },
    {
      id: "dag-forge",
      name: "DAG Forge",
      description: "Unlock topological sorting and ordering constraints in directed graphs.",
      subtopics: ["Directed acyclic graphs"],
      gateConcepts: ["bfs-graph", "cycle-detection"]
    },
    {
      id: "path-pass",
      name: "Path Pass",
      description: "Study shortest-path strategies from unweighted BFS to weighted Dijkstra thinking.",
      subtopics: ["Shortest paths"],
      gateConcepts: ["topological-sort", "shortest-path-unweighted"]
    },
    {
      id: "union-hall",
      name: "Union Hall",
      description: "Finish with DSU and minimum spanning tree logic for advanced connectivity problems.",
      subtopics: ["Disjoint set and MST", "Advanced graph applications"],
      gateConcepts: ["dijkstra", "union-find"]
    }
  ],
  dp: [
    {
      id: "memo-meadow",
      name: "Memo Meadow",
      description: "Learn the core DP idea through recursion, overlapping subproblems, and memoization.",
      subtopics: ["DP basics", "1D DP basics"],
      gateConcepts: []
    },
    {
      id: "table-terrace",
      name: "Table Terrace",
      description: "Convert recursive ideas into bottom-up tables and reliable state transitions.",
      subtopics: ["Tabulation basics", "Classic 1D transitions"],
      gateConcepts: ["dp-intro", "memoization"]
    },
    {
      id: "grid-garden",
      name: "Grid Garden",
      description: "Practice row-column state movement, path counts, and 2D dependencies.",
      subtopics: ["Grid DP", "String DP basics"],
      gateConcepts: ["tabulation", "state-transition"]
    },
    {
      id: "choice-citadel",
      name: "Choice Citadel",
      description: "Master take-skip decisions, subset states, and knapsack reasoning.",
      subtopics: ["Knapsack style DP", "Sequence DP"],
      gateConcepts: ["grid-dp", "space-optimization"]
    },
    {
      id: "interval-keep",
      name: "Interval Keep",
      description: "Finish with interval, partition, and advanced DP state design.",
      subtopics: ["Advanced DP"],
      gateConcepts: ["knapsack-dp", "lis-dp"]
    }
  ]
};

export function getMasteryTier(score: number, attempts = 0): MasteryTier {
  if (attempts === 0 || score <= 0) return "Unseen";
  if (score < 45) return "Training";
  if (score < 70) return "Comfortable";
  if (score < 85) return "Strong";
  return "Mastered";
}

export function getMasterySummary(skillProfile: SkillProfile): Array<{ conceptId: string; score: number; tier: MasteryTier }> {
  return Object.entries(skillProfile.conceptScores)
    .map(([conceptId, score]) => ({
      conceptId,
      score,
      tier: getMasteryTier(score, skillProfile.conceptAttempts[conceptId] ?? 0)
    }))
    .filter((item) => item.tier !== "Unseen")
    .sort((a, b) => b.score - a.score);
}

function isSolved(progress: ProgressState, problemId: string): boolean {
  const state = progress.problems[problemId];
  return Boolean(state && (state.status === "solved" || (state.bestScore ?? 0) >= 70));
}

export function buildWorldZones(
  problems: Problem[],
  progress: ProgressState,
  skillProfile: SkillProfile,
  topicId = "bit-manipulation"
): WorldZone[] {
  const zoneDefinitions = zoneDefinitionsByTopic[topicId] ?? [];
  return zoneDefinitions.map((zone, index) => {
    const zoneProblems = problems.filter((problem) => zone.subtopics.includes(problem.subtopic));
    const solvedCount = zoneProblems.filter((problem) => isSolved(progress, problem.id)).length;
    const totalProblems = zoneProblems.length;
    const cleared = totalProblems > 0 && solvedCount === totalProblems;
    const unlocked =
      index === 0 ||
      zone.gateConcepts.every((conceptId) => (skillProfile.conceptScores[conceptId] ?? 0) >= 60 || skillProfile.strongConcepts.includes(conceptId));

    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      status: cleared ? "cleared" : unlocked ? "unlocked" : "locked",
      solvedCount,
      totalProblems,
      gate: unlocked ? undefined : `Need stronger control over: ${zone.gateConcepts.join(", ")}`
    };
  });
}

export function buildActiveQuests(
  problems: Problem[],
  progress: ProgressState,
  skillProfile: SkillProfile,
  topicId = "bit-manipulation"
): ActiveQuest[] {
  const quests: ActiveQuest[] = [];
  const retryEntry = problems
    .map((problem) => progress.problems[problem.id])
    .find((problem): problem is NonNullable<typeof problem> => Boolean(problem?.retryRequired));
  if (retryEntry) {
    quests.push({
      id: `retry-${retryEntry.problemId}`,
      title: "Retry Quest",
      description: retryEntry.retryReason ?? `Retry ${retryEntry.problemId} with the intended concept.`,
      status: "active",
      problemId: retryEntry.problemId,
      conceptId: retryEntry.retryConceptIds?.[0],
      rewardXp: 25
    });
  }

  const next = recommendNextProblem(problems, progress, skillProfile);
  if (next.problem && !quests.some((quest) => quest.problemId === next.problem?.id)) {
    quests.push({
      id: `next-${next.problem.id}`,
      title: next.type === "move-forward" ? "Main Quest" : "Training Quest",
      description: next.message,
      status: "ready",
      problemId: next.problem.id,
      conceptId: next.conceptIds[0],
      rewardXp: 35
    });
  }

  const weakConcept = skillProfile.weakConcepts[0];
  if (weakConcept) {
    quests.push({
      id: `repair-${weakConcept}`,
      title: "Concept Repair",
      description: `Train ${weakConcept} until it reaches the Strong tier.`,
      status: "active",
      conceptId: weakConcept,
      rewardXp: 30
    });
  }

  const filtered = quests.filter((quest) => {
    if (!quest.problemId) return true;
    return problems.some((problem) => problem.id === quest.problemId);
  });

  return filtered.slice(0, 3);
}
