import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const { topicOrder, topicPacks } = require(path.join(root, "dist", "data", "topics", "index.js"));

function isBeginnerReady(problem) {
  return Boolean(
    problem.solutionMode === "guided-function" &&
      problem.functionContract?.javaSignature &&
      problem.functionContract?.cppSignature
  );
}

function summarizeTopic(topicId) {
  const pack = topicPacks[topicId];
  assert.ok(pack, `Missing topic pack: ${topicId}`);

  const problems = pack.problems;
  const beginnerReady = problems.filter(isBeginnerReady);
  const fallbackOnly = problems.filter((problem) => !isBeginnerReady(problem));

  return {
    topicId,
    topicName: pack.meta?.name ?? topicId,
    total: problems.length,
    beginnerReady: beginnerReady.length,
    proReady: problems.length,
    fallbackOnly: fallbackOnly.length,
    fallbackIds: fallbackOnly.map((problem) => problem.id)
  };
}

const topicSummaries = topicOrder.map(summarizeTopic);
const totals = topicSummaries.reduce(
  (acc, summary) => ({
    total: acc.total + summary.total,
    beginnerReady: acc.beginnerReady + summary.beginnerReady,
    proReady: acc.proReady + summary.proReady,
    fallbackOnly: acc.fallbackOnly + summary.fallbackOnly
  }),
  { total: 0, beginnerReady: 0, proReady: 0, fallbackOnly: 0 }
);

const missingBeginnerTopics = topicSummaries.filter((summary) => summary.beginnerReady === 0);
assert.deepEqual(
  missingBeginnerTopics.map((summary) => summary.topicId),
  [],
  `Topics without any Beginner scaffolds: ${missingBeginnerTopics.map((summary) => summary.topicId).join(", ")}`
);

const percent = totals.total === 0 ? 0 : Math.round((totals.beginnerReady / totals.total) * 1000) / 10;

console.log("Practice mode readiness");
console.log(`Beginner-ready problems: ${totals.beginnerReady}/${totals.total} (${percent}%)`);
console.log(`Pro-ready problems: ${totals.proReady}/${totals.total}`);
console.log(`Beginner fallback-only problems: ${totals.fallbackOnly}/${totals.total}`);
console.log("");
console.table(
  topicSummaries.map((summary) => ({
    topic: summary.topicName,
    total: summary.total,
    beginnerReady: summary.beginnerReady,
    fallbackOnly: summary.fallbackOnly
  }))
);

const preview = topicSummaries
  .filter((summary) => summary.fallbackOnly > 0)
  .map((summary) => `${summary.topicId}: ${summary.fallbackIds.slice(0, 8).join(", ")}${summary.fallbackIds.length > 8 ? ", ..." : ""}`);

if (preview.length > 0) {
  console.log("");
  console.log("Next Beginner scaffold targets:");
  preview.forEach((line) => console.log(`- ${line}`));
}
