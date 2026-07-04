import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import {
  PracticeMode,
  Problem,
  ProgrammingLanguage,
  TrainingBugType,
  TrainingCandidateEvaluation,
  TrainingCandidateListItem,
  TrainingCandidateRecord,
  TrainingBacklogSummary,
  TrainingGenerateRequest,
  TrainingImportRequest,
  TrainingProblemSummary,
  TrainingPromptRecord,
  TrainingRegressionBundle,
  TrainingRegressionCase,
  TrainingRegressionTestGeneration,
  TrainingReviewRecord,
  TrainingReviewRequest
} from "../types";
import { getProblemById, getTopicMetas, getTopicProblems } from "./storage";
import { effectiveProblemForPracticeMode, buildCppStarterTemplate, buildJavaStarterTemplate } from "./workspace";
import { buildCppFunctionTemplate, buildJavaFunctionTemplate, usesFunctionHarness } from "./functionHarness";
import { analyzeCodeFacts } from "./analysis-engine/analyzeCode";
import { buildExplainableFeedback } from "./analysis-engine/feedback";
import { scoreSubmissionFromFacts } from "./analysis-engine/factScoring";
import { matchProblemExpectations } from "./analysis-engine/matcher";
import { runCppSubmission } from "./cppRunner";
import { runJavaSubmission } from "./javaRunner";

function repoRoot() {
  return path.resolve(__dirname, "../..");
}

function trainingRoot() {
  return path.join(repoRoot(), "training");
}

function promptsDir() {
  return path.join(trainingRoot(), "prompts");
}

function generatedDir() {
  return path.join(trainingRoot(), "generated");
}

function evaluatedDir() {
  return path.join(trainingRoot(), "evaluated");
}

function reviewQueueDir() {
  return path.join(trainingRoot(), "review-queue");
}

function reviewsDir() {
  return path.join(trainingRoot(), "reviews");
}

function exportsDir() {
  return path.join(trainingRoot(), "exports");
}

function generatedTestPath() {
  return path.join(repoRoot(), "src", "tests", "generated-training-regressions.test.ts");
}

function ensureDir(target: string) {
  fs.mkdirSync(target, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function walkJsonFiles(targetDir: string): string[] {
  if (!fs.existsSync(targetDir)) return [];
  return fs.readdirSync(targetDir, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      return walkJsonFiles(resolved);
    }
    return entry.name.endsWith(".json") ? [resolved] : [];
  });
}

function toRelative(filePath: string) {
  return path.relative(repoRoot(), filePath);
}

function normalizeModes(modes?: PracticeMode[]): PracticeMode[] {
  const safe = (modes ?? ["beginner", "pro"]).filter((mode): mode is PracticeMode => mode === "beginner" || mode === "pro");
  return safe.length > 0 ? safe : ["beginner", "pro"];
}

function normalizeLanguages(languages?: ProgrammingLanguage[]): ProgrammingLanguage[] {
  const safe = (languages ?? ["java", "cpp"]).filter((language): language is ProgrammingLanguage => language === "java" || language === "cpp");
  return safe.length > 0 ? safe : ["java", "cpp"];
}

function resolveProblems({ problemId, problemIds, topicId }: TrainingGenerateRequest): Problem[] {
  const requestedProblemIds = [...(problemIds ?? []), ...(problemId ? [problemId] : [])];
  if (requestedProblemIds.length > 0) {
    const seen = new Set<string>();
    return requestedProblemIds.map((requestedId) => {
      const normalizedId = requestedId.trim();
      if (!normalizedId) {
        throw new Error("Problem ID cannot be empty.");
      }
      if (seen.has(normalizedId)) {
        throw new Error(`Duplicate problem requested: ${normalizedId}`);
      }
      seen.add(normalizedId);
      const problem = getProblemById(normalizedId);
      if (!problem) {
        throw new Error(`Unknown problem: ${normalizedId}`);
      }
      return problem;
    });
  }

  if (topicId) {
    return getTopicProblems(topicId);
  }

  throw new Error("Select a topic or a problem first.");
}

function buildStarter(problem: Problem, language: ProgrammingLanguage, mode: PracticeMode) {
  if (mode === "beginner" && problem.functionContract && problem.solutionMode !== "complete-program") {
    return language === "cpp"
      ? buildCppFunctionTemplate(problem)
      : buildJavaFunctionTemplate(problem);
  }

  return language === "cpp"
    ? buildCppStarterTemplate(problem)
    : buildJavaStarterTemplate(problem);
}

function buildPrompt(problem: Problem, language: ProgrammingLanguage, mode: PracticeMode, variants: number) {
  const starter = buildStarter(problem, language, mode);
  const modeLabel = mode === "beginner" ? "Complete the Function" : "Write the Complete Program";

  return [
    "You are generating analyzer-training code samples for a DSA learning engine.",
    `Problem ID: ${problem.id}`,
    `Title: ${problem.title}`,
    `Topic: ${problem.topic}`,
    `Subtopic: ${problem.subtopic}`,
    `Language: ${language}`,
    `Mode: ${modeLabel}`,
    `Expected Concepts: ${problem.expectedConcepts.join(", ")}`,
    `Expected Complexity: ${problem.expectedComplexity}`,
    "",
    "Generate diverse code candidates in JSON array format only.",
    `Return ${variants} candidates with a mix of:`,
    "- correct optimal solutions",
    "- correct alternate-style solutions",
    "- suboptimal but valid solutions",
    "- incorrect but realistic solutions",
    "- hardcoded or cheating solutions",
    "",
    "Each item must follow this JSON shape:",
    "{\"candidateType\":\"correct-optimal|correct-alternate|suboptimal|incorrect|hardcoded\",\"label\":\"short-label\",\"code\":\"full source code string\",\"notes\":\"brief explanation of style\"}",
    "",
    "Rules:",
    "- Output valid JSON only.",
    "- For beginner mode, fill only the function/class template.",
    "- For pro mode, write the full runnable program.",
    "- Do not include markdown fences.",
    "- Keep solutions stylistically diverse.",
    "",
    "Problem starter/template:",
    starter
  ].join("\n");
}

function supportsTrainingMode(problem: Problem, mode: PracticeMode): boolean {
  if (mode === "pro") {
    return true;
  }
  return usesFunctionHarness(problem);
}

export function generateTrainingPrompts(input: TrainingGenerateRequest) {
  const problems = resolveProblems(input);
  const languages = normalizeLanguages(input.languages);
  const modes = normalizeModes(input.modes);
  const variants = Math.max(4, Math.min(40, input.variants ?? 8));
  const supportedOnly = input.supportedOnly ?? false;

  ensureDir(promptsDir());

  const prompts: TrainingPromptRecord[] = [];
  problems.forEach((problem) => {
    languages.forEach((language) => {
      modes.forEach((practiceMode) => {
        if (supportedOnly && !supportsTrainingMode(problem, practiceMode)) {
          return;
        }
        const fileName = `${problem.id}.${language}.${practiceMode}.json`;
        const filePath = path.join(promptsDir(), fileName);
        const record: TrainingPromptRecord = {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          problemId: problem.id,
          language,
          practiceMode,
          variantsRequested: variants,
          promptVersion: "v1",
          prompt: buildPrompt(problem, language, practiceMode, variants),
          fileName,
          filePath: toRelative(filePath)
        };
        writeJson(filePath, {
          schemaVersion: record.schemaVersion,
          generatedAt: record.generatedAt,
          problemId: record.problemId,
          language: record.language,
          practiceMode: record.practiceMode,
          variantsRequested: record.variantsRequested,
          promptVersion: record.promptVersion,
          prompt: record.prompt
        });
        prompts.push(record);
      });
    });
  });

  return { prompts };
}

function toArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}

function parseJsonText(jsonText: string): unknown {
  const trimmed = jsonText.trim();
  if (!trimmed) {
    throw new Error("Paste the model response JSON first.");
  }
  if (/^You are generating analyzer-training code samples/i.test(trimmed)) {
    throw new Error("You pasted the prompt text, not candidate JSON. Run this prompt in your model first, then paste the JSON response here.");
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Could not parse candidate JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeCandidate(
  raw: Record<string, unknown>,
  defaults: {
    problemId?: string;
    language?: ProgrammingLanguage;
    practiceMode?: PracticeMode;
    model?: string;
    promptVersion?: string;
    sourceFile?: string;
  }
): TrainingCandidateRecord {
  const problemId = typeof raw.problemId === "string" ? raw.problemId : defaults.problemId;
  const language = (typeof raw.language === "string" ? raw.language : defaults.language) as ProgrammingLanguage | undefined;
  const practiceMode = (typeof raw.practiceMode === "string" ? raw.practiceMode : defaults.practiceMode) === "pro" ? "pro" : "beginner";
  const code = typeof raw.code === "string" ? raw.code : "";

  if (!problemId || !language || !code.trim()) {
    throw new Error("Each candidate needs problemId, language, and non-empty code.");
  }

  const candidateType = typeof raw.candidateType === "string" ? raw.candidateType : "unspecified";
  const label = typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : "unlabeled-candidate";
  const seed = `${problemId}:${language}:${practiceMode}:${label}:${code}`;
  const id = typeof raw.id === "string" && raw.id.trim()
    ? raw.id.trim()
    : `cand_${crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12)}`;

  return {
    schemaVersion: 1,
    id,
    importedAt: new Date().toISOString(),
    problemId,
    language,
    practiceMode,
    candidateType: candidateType as TrainingCandidateRecord["candidateType"],
    label,
    code,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    model: typeof raw.model === "string" ? raw.model : defaults.model ?? "manual-import",
    promptVersion: typeof raw.promptVersion === "string" ? raw.promptVersion : defaults.promptVersion ?? "v1",
    sourceFile: defaults.sourceFile
  };
}

export function importTrainingCandidates(input: TrainingImportRequest) {
  const payload = parseJsonText(input.jsonText);
  ensureDir(generatedDir());

  const imported: TrainingCandidateRecord[] = [];
  toArray(payload).forEach((raw) => {
    if (!raw || typeof raw !== "object") {
      throw new Error("Candidate payload must be an object or array of objects.");
    }
    const candidate = normalizeCandidate(raw as Record<string, unknown>, {
      problemId: input.problemId,
      language: input.language,
      practiceMode: input.practiceMode,
      model: input.model,
      promptVersion: input.promptVersion,
      sourceFile: input.sourceLabel ?? "desktop-import"
    });
    const problemDir = path.join(generatedDir(), candidate.problemId);
    ensureDir(problemDir);
    writeJson(path.join(problemDir, `${candidate.id}.json`), candidate);
    imported.push(candidate);
  });

  return { imported };
}

function candidateSourcePath(candidate: TrainingCandidateRecord) {
  const prefix = candidate.language === "cpp" ? "candidate-cpp-" : "candidate-java-";
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const baseName = candidate.language === "cpp"
    ? "candidate.cpp"
    : candidate.practiceMode === "beginner" ? "Solution.java" : "Main.java";
  const filePath = path.join(tempDir, baseName);
  fs.writeFileSync(filePath, candidate.code, "utf-8");
  return { tempDir, filePath };
}

function executionFor(problem: Problem, candidate: TrainingCandidateRecord, sourcePath: string) {
  return candidate.language === "cpp"
    ? runCppSubmission(problem, sourcePath)
    : runJavaSubmission(problem, sourcePath);
}

function suspiciousReasons(
  candidate: TrainingCandidateRecord,
  execution: TrainingCandidateEvaluation["execution"],
  evaluation: Pick<TrainingCandidateEvaluation["analyzer"], "missingConcepts" | "score">
) {
  const reasons: string[] = [];
  const passedAllTests = execution.usedTestCases && execution.compileSucceeded && execution.passedCount === execution.totalCount;
  const highConceptMatch = evaluation.score.conceptMatchScore >= 80;
  const lowConceptMatch = evaluation.score.conceptMatchScore < 80;

  if (passedAllTests && evaluation.missingConcepts.length > 0) {
    reasons.push("passed-tests-but-concept-miss");
  }
  if (passedAllTests && lowConceptMatch) {
    reasons.push("passed-tests-low-concept-score");
  }
  if (!passedAllTests && highConceptMatch) {
    reasons.push("failed-tests-high-concept-score");
  }
  if (passedAllTests && evaluation.score.finalScore < 85) {
    reasons.push("passed-tests-but-progression-risk");
  }
  if (candidate.candidateType === "hardcoded" && evaluation.score.finalScore >= 70) {
    reasons.push("hardcoded-candidate-scored-too-high");
  }
  if (candidate.candidateType.startsWith("correct") && !passedAllTests) {
    reasons.push("expected-correct-but-execution-failed");
  }
  if ((candidate.candidateType === "suboptimal" || candidate.candidateType === "incorrect") && passedAllTests && highConceptMatch) {
    reasons.push("suspicious-strong-match-for-weak-candidate");
  }

  return Array.from(new Set(reasons));
}

function extractFactIds(facts: ReturnType<typeof analyzeCodeFacts>) {
  return [
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id);
}

export function evaluateTrainingCandidate(candidate: TrainingCandidateRecord, sourceCandidatePath: string): TrainingCandidateEvaluation {
  const catalogProblem = getProblemById(candidate.problemId);
  if (!catalogProblem) {
    throw new Error(`Unknown problem: ${candidate.problemId}`);
  }

  const problem = effectiveProblemForPracticeMode(catalogProblem, candidate.practiceMode);
  const { tempDir, filePath } = candidateSourcePath(candidate);

  try {
    const execution = executionFor(problem, candidate, filePath);
    const facts = analyzeCodeFacts(candidate.language, candidate.code);
    const expectation = matchProblemExpectations(problem, facts);
    const score = scoreSubmissionFromFacts(problem, facts, expectation, execution);
    const feedback = buildExplainableFeedback(problem, facts, expectation, score, execution);
    const analyzer = {
      factIds: extractFactIds(facts),
      matchedConcepts: expectation.detection.matchedConcepts,
      missingConcepts: expectation.detection.missingConcepts,
      conceptMatchScore: expectation.conceptMatchScore,
      score,
      recommendationHints: feedback.improvements,
      evidence: expectation.matches
    };

    return {
      schemaVersion: 1,
      evaluatedAt: new Date().toISOString(),
      sourceCandidate: toRelative(sourceCandidatePath),
      candidate,
      execution,
      analyzer,
      suspicious: false,
      suspiciousReasons: suspiciousReasons(candidate, execution, analyzer)
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function inferBugType(evaluation: TrainingCandidateEvaluation): TrainingBugType | null {
  const passedAllTests = evaluation.execution.usedTestCases
    && evaluation.execution.compileSucceeded
    && evaluation.execution.passedCount === evaluation.execution.totalCount;

  if (evaluation.suspiciousReasons.includes("hardcoded-candidate-scored-too-high")) {
    return "hardcoding-detection";
  }
  if (passedAllTests && evaluation.analyzer.missingConcepts.length > 0) {
    return "concept-detector";
  }
  if (passedAllTests && evaluation.analyzer.score.finalScore < 85) {
    return "scoring";
  }
  if (!passedAllTests && evaluation.candidate.candidateType.startsWith("correct")) {
    return "execution-or-template";
  }
  if (evaluation.suspiciousReasons.includes("suspicious-strong-match-for-weak-candidate")) {
    return "metadata";
  }
  return evaluation.suspicious ? "needs-investigation" : null;
}

export function evaluateTrainingCandidates(filters: { problemId?: string; candidateId?: string } = {}) {
  const files = walkJsonFiles(generatedDir()).filter((filePath) => {
    if (filters.problemId && !filePath.includes(`${path.sep}${filters.problemId}${path.sep}`)) {
      return false;
    }
    if (filters.candidateId && !filePath.endsWith(`${filters.candidateId}.json`)) {
      return false;
    }
    return true;
  });

  if (files.length === 0) {
    return { evaluated: [], suspiciousCount: 0 };
  }

  const evaluated: TrainingCandidateEvaluation[] = [];
  let suspiciousCount = 0;

  files.forEach((filePath) => {
    const candidate = readJson<TrainingCandidateRecord>(filePath);
    const result = evaluateTrainingCandidate(candidate, filePath);
    result.suspicious = result.suspiciousReasons.length > 0;
    evaluated.push(result);
    writeJson(path.join(evaluatedDir(), candidate.problemId, `${candidate.id}.json`), result);

    if (result.suspicious) {
      suspiciousCount += 1;
      writeJson(path.join(reviewQueueDir(), candidate.problemId, `${candidate.id}.json`), {
        schemaVersion: 1,
        queuedAt: result.evaluatedAt,
        reviewStatus: "needs-review",
        reviewType: "analyzer-training",
        sourceCandidate: result.sourceCandidate,
        candidate: result.candidate,
        execution: result.execution,
        analyzer: result.analyzer,
        suspiciousReasons: result.suspiciousReasons,
        reviewerNotes: "",
        resolution: null,
        expectedFacts: [],
        forbiddenFacts: [],
        inferredBugType: inferBugType(result)
      });
    }
  });

  return { evaluated, suspiciousCount };
}

function readPromptFiles(problemId: string) {
  return walkJsonFiles(promptsDir())
    .filter((filePath) => filePath.includes(`${problemId}.`))
    .map((filePath) => {
      const data = readJson<Omit<TrainingPromptRecord, "fileName" | "filePath">>(filePath);
      return {
        ...data,
        fileName: path.basename(filePath),
        filePath: toRelative(filePath)
      } satisfies TrainingPromptRecord;
    })
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

function readCandidate(problemId: string, candidateId: string) {
  const filePath = path.join(generatedDir(), problemId, `${candidateId}.json`);
  return fs.existsSync(filePath) ? readJson<TrainingCandidateRecord>(filePath) : null;
}

function readEvaluation(problemId: string, candidateId: string) {
  const filePath = path.join(evaluatedDir(), problemId, `${candidateId}.json`);
  return fs.existsSync(filePath) ? readJson<TrainingCandidateEvaluation>(filePath) : null;
}

function readReview(problemId: string, candidateId: string) {
  const filePath = path.join(reviewsDir(), problemId, `${candidateId}.json`);
  return fs.existsSync(filePath) ? readJson<TrainingReviewRecord>(filePath) : null;
}

function allReviewFiles() {
  return walkJsonFiles(reviewsDir());
}

function suggestedFixForBugType(bugType: TrainingBugType) {
  const fixes: Record<TrainingBugType, string> = {
    "concept-detector": "Tighten the fact extractor or matcher so the intended concept is recognized across alternate coding styles.",
    "scoring": "Adjust score weights or progression thresholds so fully-correct solutions are not under-rewarded.",
    "execution-or-template": "Inspect the runner, starter template, or practice-mode harness for compile/runtime mismatches.",
    "metadata": "Review the problem expectations, expected concepts, or milestone mapping for this problem.",
    "hardcoding-detection": "Add stronger anti-pattern facts and penalties so shortcut solutions do not score too highly.",
    "needs-investigation": "Read the candidate, execution result, and review notes together to identify the missing analyzer rule."
  };
  return fixes[bugType];
}

export function listTrainingCandidates(problemId?: string) {
  const files = problemId
    ? walkJsonFiles(path.join(generatedDir(), problemId))
    : walkJsonFiles(generatedDir());

  return files
    .map((filePath) => readJson<TrainingCandidateRecord>(filePath))
    .map((candidate): TrainingCandidateListItem => ({
      candidate,
      evaluation: readEvaluation(candidate.problemId, candidate.id),
      review: readReview(candidate.problemId, candidate.id)
    }))
    .sort((left, right) => right.candidate.importedAt.localeCompare(left.candidate.importedAt));
}

export function getTrainingProblemSummary(problemId: string): TrainingProblemSummary {
  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Unknown problem: ${problemId}`);
  }

  return {
    problem,
    promptFiles: readPromptFiles(problemId),
    candidates: listTrainingCandidates(problemId)
  };
}

export function listTrainingCatalog() {
  return getTopicMetas()
    .filter((topic) => topic.status === "active")
    .map((topic) => ({
      ...topic,
      problems: getTopicProblems(topic.id).map((problem) => ({
        id: problem.id,
        title: problem.title,
        topic: problem.topic,
        subtopic: problem.subtopic,
        difficulty: problem.difficulty,
        expectedConcepts: problem.expectedConcepts
      }))
    }));
}

export function getTrainingBacklogSummary(): TrainingBacklogSummary {
  const reviews = allReviewFiles().map((filePath) => readJson<TrainingReviewRecord>(filePath));
  const dissatisfactory = reviews.filter((review) => !review.satisfactory);
  const itemsMap = new Map<string, {
    bugType: TrainingBugType;
    total: number;
    problemIds: Set<string>;
    conceptIds: Set<string>;
    candidateIds: Set<string>;
    reasons: Set<string>;
    latestReviewedAt: string;
  }>();

  dissatisfactory.forEach((review) => {
    const bugType = review.bugType ?? review.inferredBugType ?? "needs-investigation";
    const evaluation = readEvaluation(review.problemId, review.candidateId);
    const key = bugType;
    const entry = itemsMap.get(key) ?? {
      bugType,
      total: 0,
      problemIds: new Set<string>(),
      conceptIds: new Set<string>(),
      candidateIds: new Set<string>(),
      reasons: new Set<string>(),
      latestReviewedAt: review.reviewedAt
    };

    entry.total += 1;
    entry.problemIds.add(review.problemId);
    entry.candidateIds.add(review.candidateId);
    (review.expectedFacts ?? []).forEach((factId) => entry.conceptIds.add(factId));
    if (evaluation) {
      evaluation.analyzer.missingConcepts.forEach((conceptId) => entry.conceptIds.add(conceptId));
      evaluation.suspiciousReasons.forEach((reason) => entry.reasons.add(reason));
    }
    if (review.reviewerNotes?.trim()) {
      entry.reasons.add(review.reviewerNotes.trim());
    }
    if (review.reviewedAt > entry.latestReviewedAt) {
      entry.latestReviewedAt = review.reviewedAt;
    }

    itemsMap.set(key, entry);
  });

  return {
    totalReviewed: reviews.length,
    satisfactoryCount: reviews.filter((review) => review.satisfactory).length,
    dissatisfactoryCount: dissatisfactory.length,
    openBugCount: itemsMap.size,
    items: Array.from(itemsMap.values())
      .map((entry) => ({
        bugType: entry.bugType,
        total: entry.total,
        problemIds: Array.from(entry.problemIds).sort(),
        conceptIds: Array.from(entry.conceptIds).sort(),
        candidateIds: Array.from(entry.candidateIds).sort(),
        reasons: Array.from(entry.reasons).slice(0, 6),
        suggestedFix: suggestedFixForBugType(entry.bugType),
        latestReviewedAt: entry.latestReviewedAt
      }))
      .sort((left, right) => {
        if (right.total !== left.total) return right.total - left.total;
        return right.latestReviewedAt.localeCompare(left.latestReviewedAt);
      })
  };
}

export function exportTrainingRegressionBundle(): TrainingRegressionBundle {
  const reviews = allReviewFiles().map((filePath) => readJson<TrainingReviewRecord>(filePath));
  const cases: TrainingRegressionCase[] = reviews
    .filter((review) => !review.satisfactory)
    .map((review) => {
      const candidate = readCandidate(review.problemId, review.candidateId);
      const evaluation = readEvaluation(review.problemId, review.candidateId);
      if (!candidate || !evaluation) {
        return null;
      }
      return {
        candidateId: review.candidateId,
        problemId: review.problemId,
        language: candidate.language,
        practiceMode: candidate.practiceMode,
        bugType: review.bugType ?? review.inferredBugType ?? "needs-investigation",
        candidateType: candidate.candidateType,
        code: candidate.code,
        matchedConcepts: evaluation.analyzer.matchedConcepts,
        missingConcepts: evaluation.analyzer.missingConcepts,
        suspiciousReasons: evaluation.suspiciousReasons,
        reviewerNotes: review.reviewerNotes,
        expectedFacts: review.expectedFacts ?? [],
        forbiddenFacts: review.forbiddenFacts ?? []
      } satisfies TrainingRegressionCase;
    })
    .filter((item): item is TrainingRegressionCase => Boolean(item));

  const bundle: TrainingRegressionBundle = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    totalCases: cases.length,
    outputPath: toRelative(path.join(exportsDir(), "reviewed-regressions.json")),
    cases
  };

  writeJson(path.join(exportsDir(), "reviewed-regressions.json"), bundle);
  return bundle;
}

function jsString(value: string) {
  return JSON.stringify(value);
}

function renderRegressionTestCase(item: TrainingRegressionCase) {
  const title = `${item.problemId} · ${item.candidateId} (${item.bugType})`;
  const expectedFacts = item.expectedFacts ?? [];
  const forbiddenFacts = item.forbiddenFacts ?? [];
  const hasAssertions = expectedFacts.length > 0 || forbiddenFacts.length > 0;

  if (!hasAssertions) {
    return {
      active: false,
      source: `test.todo(${jsString(`reviewed regression ${title} requires expectedFacts or forbiddenFacts`)});
`
    };
  }

  const expectedAssertions = expectedFacts.map((fact) => `  assert.equal(factIds.has(${jsString(fact)}), true, ${jsString(`Expected fact ${fact} to be detected`)});
`).join("");
  const forbiddenAssertions = forbiddenFacts.map((fact) => `  assert.equal(factIds.has(${jsString(fact)}), false, ${jsString(`Forbidden fact ${fact} should not be detected`)});
`).join("");

  return {
    active: true,
    source: `test(${jsString(`reviewed regression ${title}`)}, () => {
  const problem = getProblemById(${jsString(item.problemId)});
  assert.ok(problem);
  const facts = analyzeCodeFacts(${jsString(item.language)}, ${jsString(item.code)});
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
${expectedAssertions}${forbiddenAssertions}});
`
  };
}

export function generateTrainingRegressionTests(): TrainingRegressionTestGeneration {
  const bundle = exportTrainingRegressionBundle();
  const rendered = bundle.cases.map(renderRegressionTestCase);
  const activeTests = rendered.filter((item) => item.active).length;
  const todoTests = rendered.length - activeTests;
  const outputPath = generatedTestPath();
  const header = `import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import { getProblemById } from "../services/storage";

// Auto-generated from training/exports/reviewed-regressions.json
// Cases without expectedFacts/forbiddenFacts remain todo until reviewed further.

`;

  const source = `${header}${rendered.map((item) => item.source).join("\n")}`;
  fs.writeFileSync(outputPath, source, "utf-8");

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    outputPath: toRelative(outputPath),
    activeTests,
    todoTests
  };
}

export function saveTrainingReview(input: TrainingReviewRequest) {
  const candidate = readCandidate(input.problemId, input.candidateId);
  if (!candidate) {
    throw new Error(`Candidate not found: ${input.problemId}/${input.candidateId}`);
  }

  const evaluation = readEvaluation(input.problemId, input.candidateId);
  const inferredBugType = evaluation ? inferBugType(evaluation) : null;
  const normalizedBugType = input.satisfactory ? null : (input.bugType ?? inferredBugType ?? "needs-investigation");
  const review: TrainingReviewRecord = {
    schemaVersion: 1,
    candidateId: input.candidateId,
    problemId: input.problemId,
    reviewedAt: new Date().toISOString(),
    satisfactory: input.satisfactory,
    bugType: normalizedBugType,
    reviewerNotes: input.reviewerNotes?.trim() ?? "",
    resolution: input.resolution?.trim() || null,
    expectedFacts: input.expectedFacts ?? [],
    forbiddenFacts: input.forbiddenFacts ?? [],
    inferredBugType
  };

  writeJson(path.join(reviewsDir(), input.problemId, `${input.candidateId}.json`), review);
  return {
    review,
    candidate,
    evaluation
  };
}
