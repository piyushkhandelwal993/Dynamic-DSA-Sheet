const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const topicsRoot = path.join(repoRoot, "src", "data", "topics");
const externalCatalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "src", "data", "external-practice", "problems.json"), "utf8"));

function normalizeTopicLabel(value) {
  const normalized = value.toLowerCase().replace(/\s+/g, "-");
  const aliases = {
    "dynamic-programming": "dp",
    "bit-manipulation": "bit-manipulation",
    "binary-search": "binary-search",
    "two-pointers": "two-pointers",
    "prefix-suffix": "prefix-suffix",
    "sliding-window": "sliding-window",
    "programming-mathematics": "programming-mathematics",
    "linked-list": "linked-list"
  };
  return aliases[normalized] ?? normalized;
}

const topicConceptMap = new Map();
const problems = [];

for (const dir of fs.readdirSync(topicsRoot)) {
  const conceptsFile = path.join(topicsRoot, dir, "concepts.json");
  const problemsFile = path.join(topicsRoot, dir, "problems.json");

  if (fs.existsSync(conceptsFile)) {
    for (const concept of JSON.parse(fs.readFileSync(conceptsFile, "utf8"))) {
      if (!topicConceptMap.has(concept.id)) {
        topicConceptMap.set(concept.id, dir);
      }
    }
  }

  if (fs.existsSync(problemsFile)) {
    problems.push(...JSON.parse(fs.readFileSync(problemsFile, "utf8")));
  }
}

const problemById = new Map(problems.map((problem) => [problem.id, problem]));

const rows = externalCatalog.map((problem) => {
  const mappedProblems = (problem.mappedFromProblemIds ?? []).map((problemId) => problemById.get(problemId)).filter(Boolean);
  const mappedConcepts = [...new Set(mappedProblems.flatMap((mappedProblem) => mappedProblem.expectedConcepts))];
  const missingFromMapped = mappedConcepts.filter((conceptId) => !problem.conceptIds.includes(conceptId));
  const prerequisiteTopics = [...new Set((problem.prerequisiteConceptIds ?? []).map((conceptId) => topicConceptMap.get(conceptId)).filter(Boolean))];
  const crossTopicPrerequisites = prerequisiteTopics.filter((topicId) => topicId !== problem.topicId);
  const bridgeTopics = [...new Set((problem.roadmapBridgeProblemIds ?? [])
    .map((problemId) => problemById.get(problemId))
    .filter(Boolean)
    .map((bridgeProblem) => normalizeTopicLabel(bridgeProblem.topic)))];
  const missingCrossTopicBridges = crossTopicPrerequisites.filter((topicId) => !bridgeTopics.includes(topicId));

  return {
    id: problem.id,
    title: problem.title,
    topicId: problem.topicId,
    conceptCount: problem.conceptIds.length,
    prerequisiteCount: problem.prerequisiteConceptIds.length,
    missingFromMapped,
    crossTopicPrerequisites,
    missingCrossTopicBridges
  };
});

const underLabeled = rows.filter((row) => row.missingFromMapped.length > 0);
const missingCrossTopic = rows.filter((row) => row.missingCrossTopicBridges.length > 0);

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  externalProblemCount: externalCatalog.length,
  underLabeledCount: underLabeled.length,
  missingCrossTopicBridgeCount: missingCrossTopic.length,
  sampleUnderLabeled: underLabeled.slice(0, 25),
  sampleMissingCrossTopicBridges: missingCrossTopic.slice(0, 25)
}, null, 2));
