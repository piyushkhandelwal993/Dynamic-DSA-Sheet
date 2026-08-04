import fs from "fs";
import path from "path";
import {
  ExternalPracticeProblem,
  Problem,
  RoadmapReviewAnalysis,
  RoadmapReviewCatalogItem,
  RoadmapReviewFixture,
  RoadmapReviewFixtureExport,
  RoadmapReviewMismatchTag,
  RoadmapReviewRecord,
  RoadmapReviewSaveInput,
  RoadmapReviewWorkspace,
  TargetProblemRoadmapPlan,
  TargetProblemRoadmapStep
} from "../types";
import { getExternalPracticeCatalog } from "./externalPractice";
import { resolveBaseDir } from "./paths";
import { getTopicMetas, getTopicProblems } from "./storage";

const ROADMAP_REVIEW_FILE = "roadmap-reviews.json";
const ROADMAP_REVIEW_EXPORT_FILE = "roadmap-review-fixtures.json";

function getRoadmapReviewPath(): string {
  return path.join(resolveBaseDir(), ROADMAP_REVIEW_FILE);
}

function getRoadmapReviewExportPath(): string {
  return path.join(resolveBaseDir(), ROADMAP_REVIEW_EXPORT_FILE);
}

function ensureBaseDir(): void {
  fs.mkdirSync(resolveBaseDir(), { recursive: true });
}

function readJson<T>(targetPath: string, fallback: T): T {
  if (!fs.existsSync(targetPath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as T;
}

function writeJson<T>(targetPath: string, value: T): void {
  ensureBaseDir();
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stepIdentity(step: Pick<TargetProblemRoadmapStep, "type" | "internalProblemId" | "externalProblemId" | "url" | "title">): string {
  return [
    step.type,
    step.internalProblemId ?? "",
    step.externalProblemId ?? "",
    step.url ?? "",
    slugify(step.title)
  ].join("::");
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function collectAddedStepTitles(generated: TargetProblemRoadmapPlan, reviewed: TargetProblemRoadmapPlan): string[] {
  const generatedKeys = new Set(generated.steps.map(stepIdentity));
  return reviewed.steps
    .filter((step) => !generatedKeys.has(stepIdentity(step)))
    .map((step) => step.title);
}

function collectRemovedStepTitles(generated: TargetProblemRoadmapPlan, reviewed: TargetProblemRoadmapPlan): string[] {
  const reviewedKeys = new Set(reviewed.steps.map(stepIdentity));
  return generated.steps
    .filter((step) => !reviewedKeys.has(stepIdentity(step)))
    .map((step) => step.title);
}

function collectReorderedStepTitles(generated: TargetProblemRoadmapPlan, reviewed: TargetProblemRoadmapPlan): string[] {
  const generatedIndices = new Map(generated.steps.map((step, index) => [stepIdentity(step), index]));
  const reordered: string[] = [];

  for (let index = 0; index < reviewed.steps.length; index += 1) {
    const step = reviewed.steps[index];
    const originalIndex = generatedIndices.get(stepIdentity(step));
    if (originalIndex !== undefined && originalIndex !== index) {
      reordered.push(step.title);
    }
  }

  return dedupe(reordered);
}

function buildAutoTags(
  generated: TargetProblemRoadmapPlan,
  reviewed: TargetProblemRoadmapPlan,
  addedStepTitles: string[],
  removedStepTitles: string[],
  reorderedStepTitles: string[]
): RoadmapReviewMismatchTag[] {
  const tags = new Set<RoadmapReviewMismatchTag>();

  if (reorderedStepTitles.length > 0) {
    tags.add("wrong-order");
  }

  const removedGenerated = generated.steps.filter((step) => removedStepTitles.includes(step.title));
  const addedReviewed = reviewed.steps.filter((step) => addedStepTitles.includes(step.title));

  if (removedGenerated.some((step) => step.type === "external") && addedReviewed.some((step) => step.type === "internal")) {
    tags.add("better-internal");
  }

  if (removedGenerated.some((step) => step.type === "internal") && addedReviewed.some((step) => step.type === "external")) {
    tags.add("better-external");
  }

  if (removedGenerated.some((step) => /house robber ii| ii$| iii$| iv$|\b2\b|\b3\b/i.test(step.title))) {
    tags.add("too-advanced");
  }

  if (removedGenerated.some((step) => /greatest common divisor|gcd|factorial|palindrome/i.test(step.title))) {
    tags.add("generic-detour");
  }

  if (addedReviewed.some((step) => step.type === "internal") && removedGenerated.some((step) => step.type === "target")) {
    tags.add("missing-prerequisite");
  }

  const reviewedIdentities = reviewed.steps.map(stepIdentity);
  if (reviewedIdentities.length !== new Set(reviewedIdentities).size) {
    tags.add("duplicate");
  }

  if (removedStepTitles.length > 0 && addedStepTitles.length === 0 && reorderedStepTitles.length === 0) {
    tags.add("irrelevant");
  }

  return [...tags];
}

function buildDiagnosis(
  generated: TargetProblemRoadmapPlan,
  reviewed: TargetProblemRoadmapPlan,
  analysis: Omit<RoadmapReviewAnalysis, "diagnosis">
): string[] {
  const diagnosis: string[] = [];

  if (analysis.autoTags.includes("generic-detour")) {
    diagnosis.push("The planner likely over-weighted generic dependency concepts instead of direct target-family progression.");
  }
  if (analysis.autoTags.includes("too-advanced")) {
    diagnosis.push("The planner selected a sequel or harder twin as a transfer step and should downrank near-identical harder variants.");
  }
  if (analysis.autoTags.includes("wrong-order")) {
    diagnosis.push("The roadmap ranking likely needs stronger progression ordering across foundational and near-target steps.");
  }
  if (analysis.autoTags.includes("better-internal")) {
    diagnosis.push("The engine likely chose an external transfer before exhausting the best internal bridge options.");
  }
  if (analysis.autoTags.includes("better-external")) {
    diagnosis.push("The engine may be under-suggesting transfer practice where an external analog would help before the retry.");
  }
  if (analysis.autoTags.includes("missing-prerequisite")) {
    diagnosis.push("The reviewed roadmap added steps the engine missed, which suggests a prerequisite labeling or dependency-chain gap.");
  }
  if (analysis.addedStepTitles.length === 0 && analysis.removedStepTitles.length === 0 && analysis.reorderedStepTitles.length === 0) {
    diagnosis.push("The reviewed roadmap matches the engine output exactly.");
  }

  if (diagnosis.length === 0) {
    diagnosis.push("Review mismatch detected, but the root cause likely needs manual inspection.");
  }

  return diagnosis;
}

function buildAnalysis(generated: TargetProblemRoadmapPlan, reviewed: TargetProblemRoadmapPlan): RoadmapReviewAnalysis {
  const addedStepTitles = collectAddedStepTitles(generated, reviewed);
  const removedStepTitles = collectRemovedStepTitles(generated, reviewed);
  const reorderedStepTitles = collectReorderedStepTitles(generated, reviewed);
  const autoTags = buildAutoTags(generated, reviewed, addedStepTitles, removedStepTitles, reorderedStepTitles);

  return {
    addedStepTitles,
    removedStepTitles,
    reorderedStepTitles,
    autoTags,
    diagnosis: buildDiagnosis(generated, reviewed, {
      addedStepTitles,
      removedStepTitles,
      reorderedStepTitles,
      autoTags
    })
  };
}

function getInternalCatalog(): RoadmapReviewCatalogItem[] {
  return getTopicMetas()
    .flatMap((topicMeta) => getTopicProblems(topicMeta.id))
    .map((problem: Problem) => ({
      id: problem.id,
      title: problem.title,
      topicId: slugify(problem.topic),
      conceptIds: problem.expectedConcepts
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function getExternalCatalog(): RoadmapReviewCatalogItem[] {
  return getExternalPracticeCatalog()
    .map((problem: ExternalPracticeProblem) => ({
      id: problem.id,
      title: problem.title,
      topicId: problem.topicId,
      conceptIds: problem.conceptIds,
      url: problem.url
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function listRoadmapReviews(): RoadmapReviewRecord[] {
  return readJson<RoadmapReviewRecord[]>(getRoadmapReviewPath(), [])
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getRoadmapReviewWorkspace(): RoadmapReviewWorkspace {
  return {
    internalCatalog: getInternalCatalog(),
    externalCatalog: getExternalCatalog(),
    records: listRoadmapReviews()
  };
}

export function saveRoadmapReview(input: RoadmapReviewSaveInput): RoadmapReviewRecord {
  const existing = listRoadmapReviews();
  const createdAt = existing.find((record) => record.id === input.id)?.createdAt ?? new Date().toISOString();
  const analysis = buildAnalysis(input.generatedRoadmap, input.reviewedRoadmap);
  const record: RoadmapReviewRecord = {
    id: input.id ?? `review-${Date.now()}-${slugify(input.inputUrl).slice(-24)}`,
    inputUrl: input.inputUrl,
    problemStatement: input.problemStatement,
    createdAt,
    updatedAt: new Date().toISOString(),
    assessment: input.assessment,
    generatedRoadmap: input.generatedRoadmap,
    reviewedRoadmap: input.reviewedRoadmap,
    manualMismatchTags: dedupe(input.manualMismatchTags),
    reviewerNotes: input.reviewerNotes?.trim() || undefined,
    analysis
  };

  const next = existing.filter((item) => item.id !== record.id);
  next.unshift(record);
  writeJson(getRoadmapReviewPath(), next);
  return record;
}

function toFixture(record: RoadmapReviewRecord): RoadmapReviewFixture {
  return {
    id: record.id,
    inputUrl: record.inputUrl,
    problemStatement: record.problemStatement,
    expectedTopicId: record.assessment.matchedProblem?.topicId ?? record.assessment.inferredTopicId,
    expectedConceptIds: record.assessment.matchedProblem?.conceptIds ?? record.assessment.inferredConceptIds ?? [],
    reviewedSteps: record.reviewedRoadmap.steps.map((step) => ({
      type: step.type,
      title: step.title,
      internalProblemId: step.internalProblemId,
      externalProblemId: step.externalProblemId,
      conceptIds: step.conceptIds,
      url: step.url
    })),
    mismatchTags: dedupe([...record.analysis.autoTags, ...record.manualMismatchTags]),
    reviewerNotes: record.reviewerNotes
  };
}

export function exportRoadmapReviewFixtures(): RoadmapReviewFixtureExport {
  const records = listRoadmapReviews();
  const fixtures = records.map(toFixture);
  const exportPath = getRoadmapReviewExportPath();
  writeJson(exportPath, fixtures);
  return { path: exportPath, count: fixtures.length };
}
