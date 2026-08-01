import fs from "fs";
import path from "path";

const supportedStrategies = [
  "linked-list-length",
  "linked-list-search",
  "linked-list-reverse",
  "array-maximum",
  "array-sorted-check",
  "array-second-largest",
  "array-range-sum",
  "array-highest-frequency",
  "array-max-subarray",
  "array-move-zeroes",
  "array-remove-duplicates",
  "array-longest-sum-k-positive",
  "array-stock-profit",
  "array-product-except-self",
  "array-count-positive",
  "array-running-sum",
  "array-pair-sum-sorted",
  "array-left-rotate-one",
  "array-max-consecutive-ones",
  "array-reverse",
  "tree-height",
  "tree-preorder",
  "tree-inorder",
  "tree-postorder",
  "tree-level-order",
  "tree-diameter",
  "tree-balanced-check",
  "tree-bst-search",
  "tree-left-view",
  "tree-bst-insert",
  "tree-bst-delete",
  "tree-top-view",
  "tree-lca",
  "tree-build-from-traversals",
  "tree-serialize-level-order",
  "stack-balanced-brackets",
  "queue-process-queries",
  "queue-circular-queries",
  "queue-reverse-first-k",
  "queue-petrol-pump",
  "queue-generate-binary",
  "queue-rotten-oranges",
  "queue-first-non-repeating-stream",
  "queue-sliding-window-maximum",
  "queue-shortest-subarray-at-least-k",
  "queue-jump-game-vi",
  "queue-k-largest-elements",
  "queue-task-scheduler",
  "queue-dota2-senate",
  "binary-search-exact",
  "binary-search-lower-bound",
  "binary-search-first-last",
  "binary-search-search-insert",
  "binary-search-rotated-search",
  "binary-search-min-rotated",
  "binary-search-peak",
  "binary-search-floor-sqrt",
  "binary-search-capacity-speed",
  "binary-search-capacity-ship",
  "binary-search-capacity-bouquets",
  "bit-binary-string",
  "bit-odd-even",
  "bit-check",
  "bit-count-set-bits",
  "bit-count-set-bits-kernighan",
  "bit-set",
  "bit-clear",
  "bit-toggle",
  "bit-check-right-shift",
  "bit-power-of-two",
  "bit-xor-1-to-n",
  "bit-single-number",
  "bit-two-unique-numbers",
  "bit-missing-number",
  "bit-decode-xored-array",
  "bit-invert-all",
  "bit-base10-complement",
  "bit-power-of-four",
  "bit-count-bits-dp",
  "bit-count-odd-array",
  "bit-swap-two-numbers",
  "bit-clear-rightmost-set-bit",
  "bit-set-query-batch",
  "bit-toggle-range",
  "bit-subset-sum-count",
  "bit-generate-subsets",
  "bit-assignment-mask-count",
  "bit-reverse-bits",
  "bit-max-xor-pair",
  "bit-range-bitwise-and",
  "bit-sum-without-plus",
  "bit-hamming-distance",
  "bit-min-bit-flips",
  "recursion-print-name-n-times",
  "recursion-print-1-to-n",
  "recursion-sum-first-n",
  "recursion-power",
  "recursion-fibonacci-number",
  "recursion-palindrome",
  "recursion-reverse-string",
  "recursion-sum-digits",
  "recursion-count-digits",
  "recursion-binary-search",
  "recursion-gcd",
  "recursion-generate-subsequences",
  "recursion-subset-sum-exists",
  "recursion-combination-sum",
  "recursion-generate-permutations",
  "recursion-tower-of-hanoi",
  "recursion-josephus",
  "recursion-factorial",
  "recursion-climbing-stairs",
  "recursion-tribonacci",
  "recursion-merge-sort",
  "recursion-quick-sort",
  "recursion-sudoku-solver",
  "recursion-n-queens",
  "graph-bfs",
  "graph-build-adjacency-list",
  "graph-dfs",
  "graph-connected-components",
  "graph-cycle-undirected",
  "graph-cycle-directed",
  "graph-num-islands",
  "graph-shortest-path-binary-matrix",
  "graph-topological-sort",
  "graph-course-schedule",
  "graph-shortest-path-unweighted",
  "graph-number-of-provinces",
  "graph-dijkstra",
  "graph-network-delay-time",
  "graph-kruskal-mst",
  "graph-prim-mst",
  "dp-climbing-stairs",
  "dp-house-robber",
  "dp-max-non-adjacent-sum",
  "dp-min-cost-climbing-stairs",
  "dp-unique-paths",
  "dp-min-path-sum",
  "dp-subset-sum",
  "dp-knapsack-01",
  "dp-coin-change-min-coins",
  "dp-lis-length",
  "dp-bitonic-subsequence",
  "dp-lcs-length",
  "dp-edit-distance",
  "dp-matrix-chain-multiplication",
  "dp-fibonacci"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function topicDirs(baseDir) {
  return fs
    .readdirSync(baseDir)
    .filter((name) => fs.existsSync(path.join(baseDir, name, "problems.json")))
    .sort();
}

function summarizeTopic(topicId, problems) {
  const ready = [];
  const missing = [];
  const unsupported = [];
  const bySubtopic = new Map();

  for (const problem of problems) {
    const hasBeginnerMetadata = Boolean(problem.functionContract && problem.solutionMode !== "complete-program");
    const strategy = problem.functionContract?.driverStrategy ?? null;
    const strategySupported = !strategy || supportedStrategies.includes(strategy);
    const entry = {
      id: problem.id,
      title: problem.title,
      subtopic: problem.subtopic,
      difficulty: problem.difficulty,
      strategy,
      solutionMode: problem.solutionMode ?? "complete-program"
    };

    const group = bySubtopic.get(problem.subtopic) ?? [];
    group.push(entry);
    bySubtopic.set(problem.subtopic, group);

    if (hasBeginnerMetadata && strategySupported) {
      ready.push(entry);
    } else {
      missing.push(entry);
    }

    if (strategy && !strategySupported) {
      unsupported.push(entry);
    }
  }

  return {
    topicId,
    total: problems.length,
    beginnerReady: ready.length,
    proReady: problems.length,
    missingBeginner: missing.length,
    unsupportedStrategies: unsupported,
    ready,
    missing,
    missingBySubtopic: Array.from(bySubtopic.entries())
      .map(([subtopic, entries]) => ({
        subtopic,
        total: entries.length,
        beginnerReady: entries.filter((entry) => ready.some((item) => item.id === entry.id)).length,
        missing: entries.filter((entry) => missing.some((item) => item.id === entry.id)).map((entry) => ({
          id: entry.id,
          title: entry.title,
          difficulty: entry.difficulty
        }))
      }))
      .filter((group) => group.missing.length > 0)
  };
}

function main() {
  const baseDir = path.join(process.cwd(), "src", "data", "topics");
  const topics = topicDirs(baseDir);
  const topicSummaries = topics.map((topicId) => {
    const problems = readJson(path.join(baseDir, topicId, "problems.json"));
    return summarizeTopic(topicId, problems);
  });

  const totals = topicSummaries.reduce(
    (acc, topic) => {
      acc.total += topic.total;
      acc.beginnerReady += topic.beginnerReady;
      acc.missingBeginner += topic.missingBeginner;
      return acc;
    },
    { total: 0, beginnerReady: 0, missingBeginner: 0 }
  );

  const report = {
    generatedAt: new Date().toISOString(),
    supportedStrategies,
    totals: {
      ...totals,
      proReady: totals.total
    },
    topics: topicSummaries
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
