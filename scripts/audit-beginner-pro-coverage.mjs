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
  "stack-balanced-brackets",
  "queue-reverse-first-k",
  "binary-search-exact",
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
  "recursion-factorial",
  "graph-bfs",
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
