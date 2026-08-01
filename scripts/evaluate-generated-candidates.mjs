import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { analyzeJavaContentForProblem, detectConceptsForProblem } = require("../dist/services/topicHooks.js");

function parseArgs(argv) {
  const options = {
    problem: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--problem") {
      options.problem = argv[index + 1] ?? "";
      index += 1;
    }
  }

  if (!options.problem) {
    throw new Error("Usage: node scripts/evaluate-generated-candidates.mjs --problem <id>");
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadProblem(appRoot, problemId) {
  const topicsDir = path.join(appRoot, "src", "data", "topics");
  const topicIds = fs.readdirSync(topicsDir);
  for (const topicId of topicIds) {
    const problemsPath = path.join(topicsDir, topicId, "problems.json");
    if (!fs.existsSync(problemsPath)) {
      continue;
    }
    const problems = readJson(problemsPath);
    const found = problems.find((problem) => problem.id === problemId);
    if (found) {
      return found;
    }
  }
  throw new Error(`Problem not found: ${problemId}`);
}

function scoreConceptMatch(problem, detection) {
  const expected = problem.expectedConcepts ?? [];
  if (expected.length === 0) {
    return 100;
  }
  const matched = expected.filter((conceptId) => detection.matchedConcepts.includes(conceptId)).length;
  return Math.round((matched / expected.length) * 100);
}

function buildSuspiciousReasons(candidate, analysis, detection, conceptMatchScore) {
  const reasons = [];
  const isExpectedCorrect = candidate.candidateType.startsWith("correct");
  const isExpectedWrong = ["incorrect", "hardcoded", "suboptimal"].includes(candidate.candidateType);
  const hardcodingDetected = analysis.detected.includes("Bit Hardcoding") || analysis.signals.hasHardcoding;

  if (isExpectedCorrect && conceptMatchScore < 100) {
    reasons.push("correct-candidate-missing-expected-concepts");
  }
  if (isExpectedCorrect && hardcodingDetected) {
    reasons.push("correct-candidate-flagged-hardcoding");
  }
  if (isExpectedWrong && conceptMatchScore === 100) {
    reasons.push("wrong-candidate-full-concept-match");
  }
  if (candidate.candidateType === "hardcoded" && !hardcodingDetected) {
    reasons.push("hardcoded-candidate-not-flagged");
  }
  if (candidate.candidateType === "incorrect" && detection.missingConcepts.length === 0) {
    reasons.push("incorrect-candidate-no-missing-concepts");
  }

  return reasons;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const appRoot = path.resolve(scriptDir, "..");
  const workspaceRoot = appRoot;
  const generatedDir = path.resolve(workspaceRoot, "training", "generated", options.problem);
  const queueDir = path.resolve(workspaceRoot, "training", "review-queue", options.problem);
  const problem = loadProblem(appRoot, options.problem);

  ensureDir(queueDir);

  if (!fs.existsSync(generatedDir)) {
    throw new Error(`Generated candidate directory not found: ${generatedDir}`);
  }

  const files = fs.readdirSync(generatedDir).filter((fileName) => fileName.endsWith(".json")).sort();
  let flagged = 0;

  for (const fileName of files) {
    const sourcePath = path.join(generatedDir, fileName);
    const candidate = readJson(sourcePath);
    const analysis = analyzeJavaContentForProblem(problem, candidate.code);
    const detection = detectConceptsForProblem(problem, analysis);
    const conceptMatchScore = scoreConceptMatch(problem, detection);
    const suspiciousReasons = buildSuspiciousReasons(candidate, analysis, detection, conceptMatchScore);

    if (suspiciousReasons.length === 0) {
      continue;
    }

    const queueRecord = {
      schemaVersion: 1,
      queuedAt: new Date().toISOString(),
      reviewStatus: "needs-review",
      reviewType: "analyzer-training",
      sourceCandidate: path.relative(workspaceRoot, sourcePath),
      candidate,
      analyzer: {
        detected: analysis.detected,
        warnings: analysis.warnings,
        signals: analysis.signals,
        matchedConcepts: detection.matchedConcepts,
        missingConcepts: detection.missingConcepts,
        conceptMatchScore
      },
      suspiciousReasons,
      reviewerNotes: "",
      resolution: null
    };

    fs.writeFileSync(path.join(queueDir, fileName), `${JSON.stringify(queueRecord, null, 2)}\n`, "utf8");
    flagged += 1;
  }

  console.log(`Evaluated ${files.length} candidate(s).`);
  console.log(`Flagged ${flagged} suspicious candidate(s) into training/review-queue/${options.problem}.`);
}

main();
