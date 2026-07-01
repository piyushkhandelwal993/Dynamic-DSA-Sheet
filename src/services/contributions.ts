import fs from "fs";
import path from "path";
import {
  ContributionStatusFeed,
  ContributionSyncStatus,
  ContributionInput,
  ContributionMutationResult,
  ContributionRecord,
  ContributionReviewUpdate,
  ContributionStore,
  ContributionValidationResult,
  PracticeMode,
  Problem,
  TestCaseContributionPayload,
  VideoLinkContributionPayload
} from "../types";
import { resolveBaseDir } from "./paths";
import { getProblemById, getTopicIdForProblem } from "./storage";

const CONTRIBUTIONS_FILE = "contributions.json";
const OUTBOX_DIR = "contribution-outbox";
const CONTRIBUTION_SYNC_STATE_FILE = "contribution-sync-state.json";
const APP_VERSION = process.env.npm_package_version ?? "dev";

interface StoredContributionSyncState {
  statusUrl?: string | null;
  lastCheckedAt?: string | null;
  remoteGeneratedAt?: string | null;
  updateCount?: number;
  message?: string | null;
}

function getContributionsPath(): string {
  return path.join(resolveBaseDir(), CONTRIBUTIONS_FILE);
}

function getContributionOutboxDir(): string {
  return path.join(resolveBaseDir(), OUTBOX_DIR);
}

export function getContributionOutboxPath(): string {
  ensureContributionStructure();
  return getContributionOutboxDir();
}

function getContributionSyncStatePath(): string {
  return path.join(resolveBaseDir(), CONTRIBUTION_SYNC_STATE_FILE);
}

function ensureContributionStructure(): void {
  fs.mkdirSync(resolveBaseDir(), { recursive: true });
  fs.mkdirSync(getContributionOutboxDir(), { recursive: true });
}

function readPackageMetadata(): { dsaSheetContributions?: { statusUrl?: string } } {
  try {
    const packagePath = path.join(__dirname, "..", "..", "package.json");
    return JSON.parse(fs.readFileSync(packagePath, "utf-8")) as { dsaSheetContributions?: { statusUrl?: string } };
  } catch {
    return {};
  }
}

function readGitHubRepositoryMetadata(): { owner: string; repo: string } | null {
  try {
    const packagePath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as {
      build?: { publish?: Array<{ provider?: string; owner?: string; repo?: string }> };
    };
    const githubPublish = packageJson.build?.publish?.find((item) => item.provider === "github" && item.owner && item.repo);
    return githubPublish?.owner && githubPublish?.repo
      ? { owner: githubPublish.owner, repo: githubPublish.repo }
      : null;
  } catch {
    return null;
  }
}

function writeJson<T>(targetPath: string, value: T): void {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readJson<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as T;
}

function readContributionSyncState(): StoredContributionSyncState {
  return readJson<StoredContributionSyncState>(getContributionSyncStatePath()) ?? {};
}

function saveContributionSyncState(state: StoredContributionSyncState): void {
  ensureContributionStructure();
  writeJson(getContributionSyncStatePath(), state);
}

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function normalizeMultiline(value: string): string {
  return normalizeText(value)
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

function contributionCaseKey(input: string, expectedOutput: string): string {
  return `${normalizeMultiline(input)}__${normalizeMultiline(expectedOutput)}`;
}

function isYouTubeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    return parsed.protocol === "https:" && (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be");
  } catch {
    return false;
  }
}

function getConfiguredContributionStatusUrl(): string | null {
  const fromEnv = process.env.DSA_SHEET_CONTRIBUTION_STATUS_URL?.trim();
  if (fromEnv) return fromEnv;
  const fromPackage = readPackageMetadata().dsaSheetContributions?.statusUrl?.trim();
  return fromPackage ? fromPackage : null;
}

async function fetchJson<T>(targetUrl: string): Promise<T> {
  const response = await fetch(targetUrl, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${targetUrl}`);
  }

  return await response.json() as T;
}

function createContributionId(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `contrib_${stamp}_${suffix}`;
}

function createEmptyStore(): ContributionStore {
  return { items: [] };
}

function getContributionStore(): ContributionStore {
  ensureContributionStructure();
  return readJson<ContributionStore>(getContributionsPath()) ?? createEmptyStore();
}

function saveContributionStore(store: ContributionStore): void {
  ensureContributionStructure();
  writeJson(getContributionsPath(), store);
}

export function getContributionSyncStatus(): ContributionSyncStatus {
  const stored = readContributionSyncState();
  const statusUrl = stored.statusUrl ?? getConfiguredContributionStatusUrl();
  return {
    enabled: Boolean(statusUrl),
    lastCheckedAt: stored.lastCheckedAt ?? null,
    remoteGeneratedAt: stored.remoteGeneratedAt ?? null,
    updateCount: stored.updateCount ?? 0,
    statusUrl: statusUrl ?? null,
    message: stored.message ?? (statusUrl ? "Ready to refresh contribution review statuses." : "Contribution review sync is not configured yet.")
  };
}

function findProblemOrThrow(problemId: string): Problem {
  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Unknown problem: ${problemId}`);
  }
  return problem;
}

function validateSingleTestCase(
  payload: TestCaseContributionPayload,
  existingKeys: Set<string>,
  existingVideoUrls: Set<string>
): ContributionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!normalizeText(payload.input)) errors.push("Input is required.");
  if (!normalizeText(payload.expectedOutput)) errors.push("Expected output is required.");
  if (!normalizeText(payload.reason)) errors.push("Reason is required.");
  if (payload.input.length > 12000) errors.push("Input is too large. Keep it under 12,000 characters.");
  if (payload.expectedOutput.length > 4000) errors.push("Expected output is too large. Keep it under 4,000 characters.");
  if (payload.reason.length > 200) errors.push("Reason is too long. Keep it under 200 characters.");

  const key = contributionCaseKey(payload.input, payload.expectedOutput);
  if (existingKeys.has(key)) {
    errors.push("This test case already exists for the problem.");
  }

  if (existingVideoUrls.size > 0) {
    warnings.push("This problem already has at least one video attached. Add a test case only if it covers a new edge or failure mode.");
  }

  return { passed: errors.length === 0, errors, warnings };
}

function validateVideoLink(payload: VideoLinkContributionPayload, existingUrls: Set<string>): ContributionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedUrl = normalizeText(payload.url);

  if (!normalizedUrl) errors.push("Video URL is required.");
  if (!normalizeText(payload.title)) errors.push("Video title is required.");
  if (!normalizeText(payload.reason)) errors.push("Reason is required.");
  if (normalizedUrl && !isYouTubeUrl(normalizedUrl)) {
    errors.push("Only HTTPS YouTube links are supported right now.");
  }
  if (existingUrls.has(normalizedUrl)) {
    errors.push("This video link already exists for the problem.");
  }
  if ((payload.recommendedFor ?? []).length === 0) {
    warnings.push("Consider marking whether this video is better for Beginner or Pro mode.");
  }

  return { passed: errors.length === 0, errors, warnings };
}

export function listContributions(): ContributionRecord[] {
  return getContributionStore().items
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function validateContribution(input: ContributionInput): ContributionValidationResult {
  const problem = findProblemOrThrow(input.problemId);
  const existingKeys = new Set(
    (problem.testCases ?? []).map((testCase) => contributionCaseKey(testCase.input, testCase.expectedOutput))
  );
  const existingVideoUrls = new Set<string>();
  if (problem.video?.url) {
    existingVideoUrls.add(normalizeText(problem.video.url));
  }

  const priorContributions = listContributions().filter((item) => item.problemId === problem.id && item.status !== "rejected");
  priorContributions.forEach((item) => {
    if (item.type === "test-case") {
      const payload = item.payload as TestCaseContributionPayload;
      existingKeys.add(contributionCaseKey(payload.input, payload.expectedOutput));
    } else if (item.type === "bulk-test-cases") {
      const payload = item.payload as { cases: TestCaseContributionPayload[] };
      payload.cases.forEach((testCase) => existingKeys.add(contributionCaseKey(testCase.input, testCase.expectedOutput)));
    } else if (item.type === "video-link") {
      const payload = item.payload as VideoLinkContributionPayload;
      existingVideoUrls.add(normalizeText(payload.url));
    }
  });

  if (input.type === "test-case") {
    return validateSingleTestCase(input.payload, existingKeys, existingVideoUrls);
  }

  if (input.type === "bulk-test-cases") {
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenBatchKeys = new Set<string>();

    if (!Array.isArray(input.payload.cases) || input.payload.cases.length === 0) {
      return {
        passed: false,
        errors: ["Add at least one test case in the bulk submission."],
        warnings: []
      };
    }

    if (input.payload.cases.length > 25) {
      errors.push("Bulk submissions can include up to 25 test cases at a time.");
    }

    input.payload.cases.forEach((testCase, index) => {
      const result = validateSingleTestCase(testCase, existingKeys, existingVideoUrls);
      result.errors.forEach((error) => errors.push(`Case ${index + 1}: ${error}`));
      result.warnings.forEach((warning) => warnings.push(`Case ${index + 1}: ${warning}`));

      const key = contributionCaseKey(testCase.input, testCase.expectedOutput);
      if (seenBatchKeys.has(key)) {
        errors.push(`Case ${index + 1}: Duplicate test case within this bulk submission.`);
      }
      seenBatchKeys.add(key);
    });

    return { passed: errors.length === 0, errors, warnings };
  }

  return validateVideoLink(input.payload, existingVideoUrls);
}

function buildRecord(input: ContributionInput, validation: ContributionValidationResult, status: ContributionRecord["status"]): ContributionRecord {
  const now = new Date().toISOString();
  return {
    id: createContributionId(),
    type: input.type,
    problemId: input.problemId,
    topicId: input.topicId ?? getTopicIdForProblem(input.problemId) ?? "unknown",
    appVersion: APP_VERSION,
    createdAt: now,
    updatedAt: now,
    status,
    payload: input.payload,
    localValidation: validation,
    remoteRef: null
  };
}

function persistContribution(record: ContributionRecord): ContributionMutationResult {
  const store = getContributionStore();
  store.items.unshift(record);
  saveContributionStore(store);
  return {
    record,
    contributions: listContributions()
  };
}

function applyReviewUpdate(record: ContributionRecord, update: ContributionReviewUpdate, syncedAt: string): ContributionRecord {
  return {
    ...record,
    status: update.status,
    reviewNote: update.note ?? record.reviewNote ?? null,
    reviewedAt: update.reviewedAt ?? record.reviewedAt ?? syncedAt,
    publishedAt: update.publishedAt ?? record.publishedAt ?? null,
    lastSyncedAt: syncedAt
  };
}

export function saveContributionDraft(input: ContributionInput): ContributionMutationResult {
  const validation = validateContribution(input);
  const status: ContributionRecord["status"] = validation.passed ? "validated" : "draft";
  const record = buildRecord(input, validation, status);
  return persistContribution(record);
}

export function submitContribution(input: ContributionInput): ContributionMutationResult {
  const validation = validateContribution(input);
  if (!validation.passed) {
    const record = buildRecord(input, validation, "draft");
    return persistContribution(record);
  }

  const record = buildRecord(input, validation, "submitted");
  const outboxPath = path.join(getContributionOutboxDir(), `${record.id}.json`);
  record.remoteRef = {
    provider: "pending-automation",
    reference: outboxPath
  };
  writeJson(outboxPath, record);
  return persistContribution(record);
}

export async function syncContributionStatuses(): Promise<{ contributions: ContributionRecord[]; status: ContributionSyncStatus; updated: number }> {
  const statusUrl = getConfiguredContributionStatusUrl();
  const currentState = readContributionSyncState();
  if (!statusUrl) {
    const nextState: StoredContributionSyncState = {
      ...currentState,
      statusUrl: null,
      message: "Contribution review sync is not configured yet."
    };
    saveContributionSyncState(nextState);
    return {
      contributions: listContributions(),
      status: getContributionSyncStatus(),
      updated: 0
    };
  }

  const now = new Date().toISOString();

  try {
    const feed = await fetchJson<ContributionStatusFeed>(statusUrl);
    const updatesById = new Map(feed.items.map((item) => [item.id, item]));
    const store = getContributionStore();
    let updated = 0;
    store.items = store.items.map((record) => {
      const update = updatesById.get(record.id);
      if (!update || update.status === record.status) {
        return record;
      }
      updated += 1;
      return applyReviewUpdate(record, update, now);
    });
    saveContributionStore(store);

    saveContributionSyncState({
      statusUrl,
      lastCheckedAt: now,
      remoteGeneratedAt: feed.generatedAt ?? now,
      updateCount: updated,
      message: updated > 0 ? `Updated ${updated} contribution status${updated === 1 ? "" : "es"}.` : "No contribution status changes found."
    });

    return {
      contributions: listContributions(),
      status: getContributionSyncStatus(),
      updated
    };
  } catch (error) {
    saveContributionSyncState({
      ...currentState,
      statusUrl,
      lastCheckedAt: now,
      message: error instanceof Error ? error.message : "Failed to refresh contribution statuses."
    });
    return {
      contributions: listContributions(),
      status: getContributionSyncStatus(),
      updated: 0
    };
  }
}

export function contributionStatusLabel(status: ContributionRecord["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "validated":
      return "Validated";
    case "submitted":
      return "Submitted";
    case "under-review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "published":
      return "Published";
    default:
      return status;
  }
}

export function contributionModeLabel(modes?: PracticeMode[]): string {
  if (!modes?.length) return "Any mode";
  return modes.map((mode) => mode === "pro" ? "Pro" : "Beginner").join(", ");
}

export function buildContributionIssueUrl(record: ContributionRecord): string | null {
  const repo = readGitHubRepositoryMetadata();
  if (!repo) return null;

  const template = record.type === "video-link" ? "video-link-contribution.md" : "test-case-contribution.md";
  const labels = record.type === "video-link" ? "contribution,video-link" : "contribution,test-case";
  const title = `[Contribution][${record.type === "video-link" ? "Video" : "Test Case"}] ${record.problemId} · ${record.id}`;
  const body = [
    `Contribution ID: ${record.id}`,
    `Problem ID: ${record.problemId}`,
    `Contribution Type: ${record.type}`,
    "",
    "Exported Contribution Payload:",
    "```json",
    JSON.stringify(record.payload, null, 2),
    "```",
    "",
    "Local Validation:",
    "```json",
    JSON.stringify(record.localValidation, null, 2),
    "```"
  ].join("\n");

  const params = new URLSearchParams({
    template,
    title,
    labels,
    body
  });

  return `https://github.com/${repo.owner}/${repo.repo}/issues/new?${params.toString()}`;
}
