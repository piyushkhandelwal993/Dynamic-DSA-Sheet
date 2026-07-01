import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getProblemById, getTopicIdForProblem } = require("../dist/services/storage.js");

const root = process.cwd();
const reviewStatusPath = path.join(root, "contributions", "review-status.json");

const SUPPORTED_STATUSES = new Set([
  "submitted",
  "under-review",
  "approved",
  "rejected",
  "published"
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function ensureFeedShape(feed) {
  if (!feed || typeof feed !== "object") {
    return { generatedAt: new Date().toISOString(), items: [] };
  }
  if (!Array.isArray(feed.items)) {
    return { generatedAt: feed.generatedAt ?? new Date().toISOString(), items: [] };
  }
  return {
    generatedAt: feed.generatedAt ?? new Date().toISOString(),
    items: feed.items.filter((item) => item && typeof item.id === "string" && typeof item.status === "string")
  };
}

function parseFencedJson(body, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedHeading}:\\s*\\n+\\\`\\\`\\\`json\\s*\\n([\\s\\S]*?)\\n\\\`\\\`\\\``, "i");
  const match = body.match(pattern);
  if (!match) {
    return null;
  }
  const source = match[1].trim();
  if (!source) {
    return null;
  }
  return JSON.parse(source);
}

function parseSimpleField(body, fieldName) {
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedField}:\\s*(.+)$`, "im");
  const match = body.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isYouTubeUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    return parsed.protocol === "https:" && (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be");
  } catch {
    return false;
  }
}

function validateContributionPayload(type, payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    errors.push("Contribution payload must be a JSON object.");
    return errors;
  }

  if (type === "test-case") {
    if (!normalizeText(payload.input)) errors.push("Test-case payload is missing input.");
    if (!normalizeText(payload.expectedOutput)) errors.push("Test-case payload is missing expectedOutput.");
    if (!normalizeText(payload.reason)) errors.push("Test-case payload is missing reason.");
    return errors;
  }

  if (type === "bulk-test-cases") {
    if (!Array.isArray(payload.cases) || payload.cases.length === 0) {
      errors.push("Bulk test-case payload must include a non-empty cases array.");
      return errors;
    }
    payload.cases.forEach((testCase, index) => {
      if (!normalizeText(testCase?.input)) errors.push(`Bulk case ${index + 1} is missing input.`);
      if (!normalizeText(testCase?.expectedOutput)) errors.push(`Bulk case ${index + 1} is missing expectedOutput.`);
      if (!normalizeText(testCase?.reason)) errors.push(`Bulk case ${index + 1} is missing reason.`);
    });
    return errors;
  }

  if (type === "video-link") {
    if (!normalizeText(payload.url)) errors.push("Video contribution payload is missing url.");
    if (!normalizeText(payload.title)) errors.push("Video contribution payload is missing title.");
    if (!normalizeText(payload.reason)) errors.push("Video contribution payload is missing reason.");
    if (normalizeText(payload.url) && !isYouTubeUrl(payload.url)) {
      errors.push("Video contribution URL must be an HTTPS YouTube link.");
    }
    return errors;
  }

  errors.push(`Unsupported contribution type: ${type}`);
  return errors;
}

function parseContributionIssue(issue) {
  const body = issue?.body ?? "";
  const errors = [];

  const contributionId = parseSimpleField(body, "Contribution ID");
  const problemId = parseSimpleField(body, "Problem ID");
  const contributionType = parseSimpleField(body, "Contribution Type");

  let payload = null;
  let localValidation = null;

  try {
    payload = parseFencedJson(body, "Exported Contribution Payload");
  } catch (error) {
    errors.push(`Contribution payload JSON could not be parsed: ${error.message}`);
  }

  try {
    localValidation = parseFencedJson(body, "Local Validation");
  } catch (error) {
    errors.push(`Local validation JSON could not be parsed: ${error.message}`);
  }

  if (!contributionId) errors.push("Contribution ID is missing.");
  if (contributionId && !/^contrib_[a-z0-9_]+$/i.test(contributionId)) {
    errors.push("Contribution ID format is invalid.");
  }

  if (!problemId) {
    errors.push("Problem ID is missing.");
  } else if (!getProblemById(problemId)) {
    errors.push(`Unknown problem ID: ${problemId}`);
  }

  if (!contributionType) {
    errors.push("Contribution Type is missing.");
  } else if (!["test-case", "bulk-test-cases", "video-link"].includes(contributionType)) {
    errors.push(`Unsupported contribution type: ${contributionType}`);
  }

  if (contributionType) {
    errors.push(...validateContributionPayload(contributionType, payload));
  }

  if (localValidation && typeof localValidation === "object") {
    if (localValidation.passed === false && Array.isArray(localValidation.errors) && localValidation.errors.length > 0) {
      errors.push(`Local validation failed: ${localValidation.errors.join("; ")}`);
    }
  }

  return {
    contributionId,
    problemId,
    contributionType,
    payload,
    localValidation,
    errors
  };
}

function computeStatus(issue, parsed) {
  const labels = new Set((issue.labels ?? []).map((label) => (typeof label === "string" ? label : label.name)).filter(Boolean));

  if (labels.has("contribution-published")) return "published";
  if (labels.has("contribution-approved")) return "approved";
  if (labels.has("contribution-rejected")) return "rejected";
  if (labels.has("contribution-under-review")) return "under-review";
  if (parsed.errors.length > 0) return "rejected";
  if (issue.state === "closed") return "rejected";
  return "submitted";
}

function computeNote(issue, parsed, status) {
  if (parsed.errors.length > 0) {
    return `Automated validation failed for issue #${issue.number}: ${parsed.errors.join(" | ")}`;
  }

  if (status === "published") {
    return `Published from GitHub issue #${issue.number}.`;
  }

  if (status === "approved") {
    return `Approved in GitHub issue #${issue.number}.`;
  }

  if (status === "under-review") {
    return `Under review in GitHub issue #${issue.number}.`;
  }

  if (status === "rejected") {
    return `Closed or rejected in GitHub issue #${issue.number}.`;
  }

  const topicId = parsed.problemId ? getTopicIdForProblem(parsed.problemId) : null;
  const topicText = topicId ? ` for topic ${topicId}` : "";
  return `Submitted via GitHub issue #${issue.number}${topicText}.`;
}

function upsertFeedItem(feed, item) {
  const index = feed.items.findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    feed.items[index] = {
      ...feed.items[index],
      ...item
    };
    return;
  }
  feed.items.unshift(item);
}

function main() {
  const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("Missing GitHub event payload path.");
  }

  const event = readJson(eventPath);
  const issue = event.issue;
  if (!issue) {
    console.log("No issue payload found. Nothing to process.");
    return;
  }

  const title = normalizeText(issue.title);
  const labels = new Set((issue.labels ?? []).map((label) => (typeof label === "string" ? label : label.name)).filter(Boolean));
  const isContributionIssue = labels.has("contribution")
    || /Contribution ID:/i.test(issue.body ?? "")
    || /^\[Contribution\]/i.test(title);

  if (!isContributionIssue) {
    console.log(`Issue #${issue.number} is not a contribution issue. Skipping.`);
    return;
  }

  const parsed = parseContributionIssue(issue);
  if (!parsed.contributionId) {
    console.log(`Contribution issue #${issue.number} is missing a contribution ID. Skipping status file update.`);
    return;
  }

  const feed = ensureFeedShape(readJson(reviewStatusPath));
  const status = computeStatus(issue, parsed);
  if (!SUPPORTED_STATUSES.has(status)) {
    throw new Error(`Unsupported computed status: ${status}`);
  }

  const reviewedAt = new Date().toISOString();
  const item = {
    id: parsed.contributionId,
    status,
    reviewedAt,
    note: computeNote(issue, parsed, status),
    publishedAt: status === "published" ? reviewedAt : undefined
  };

  upsertFeedItem(feed, item);
  feed.generatedAt = reviewedAt;
  writeJson(reviewStatusPath, feed);

  console.log(`Updated contribution review status for ${parsed.contributionId}: ${status}`);
}

main();
