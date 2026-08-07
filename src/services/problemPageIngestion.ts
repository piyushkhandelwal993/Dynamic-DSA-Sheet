import fs from "fs";
import path from "path";
import { getProblemMetadataCachePath } from "./paths";

export type ProblemPagePlatform = "leetcode" | "gfg" | "generic";
export type ProblemPageSource = "leetcode-next-data" | "gfg-html" | "html" | "cache";

export interface IngestedProblemPage {
  url: string;
  normalizedUrl: string;
  platform: ProblemPagePlatform;
  title?: string;
  difficulty?: string;
  statementText?: string;
  constraints?: string[];
  examples?: Array<{
    input?: string;
    output?: string;
    explanation?: string;
  }>;
  tags?: string[];
  fetchedAt?: string;
  source: ProblemPageSource;
}

interface ProblemPageCacheStore {
  records: Record<string, IngestedProblemPage>;
}

function normalizeUrl(inputUrl: string): string {
  try {
    const url = new URL(inputUrl.trim());
    url.hash = "";
    url.search = "";
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return inputUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function detectPlatform(inputUrl: string): ProblemPagePlatform {
  const normalized = normalizeUrl(inputUrl);
  if (normalized.includes("leetcode.com/problems/")) return "leetcode";
  if (normalized.includes("geeksforgeeks.org/problems/")) return "gfg";
  return "generic";
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtmlToText(html: string): string {
  return collapseWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeJson(targetPath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readCacheStore(): ProblemPageCacheStore {
  const targetPath = getProblemMetadataCachePath();
  if (!fs.existsSync(targetPath)) {
    return { records: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as ProblemPageCacheStore;
  } catch {
    return { records: {} };
  }
}

function saveCacheRecord(record: IngestedProblemPage): void {
  const store = readCacheStore();
  store.records[record.normalizedUrl] = record;
  writeJson(getProblemMetadataCachePath(), store);
}

function loadCachedRecord(inputUrl: string): IngestedProblemPage | null {
  const store = readCacheStore();
  const normalizedUrl = normalizeUrl(inputUrl);
  const record = store.records[normalizedUrl];
  if (!record) {
    return null;
  }
  return {
    ...record,
    source: "cache"
  };
}

function extractTitleFromHtml(html: string): string | undefined {
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch?.[1]) return collapseWhitespace(decodeHtmlEntities(ogMatch[1]));
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) return collapseWhitespace(decodeHtmlEntities(titleMatch[1]));
  return undefined;
}

function extractTagMatches(html: string): string[] {
  const tagMatches = [...html.matchAll(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/gi)];
  const tags = tagMatches
    .map((match) => collapseWhitespace(decodeHtmlEntities(match[1] ?? "")))
    .filter(Boolean);
  return [...new Set(tags)];
}

function collectListItems(html: string): string[] {
  return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtmlToText(match[1] ?? ""))
    .filter(Boolean);
}

function splitConstraintLikeItems(items: string[]): string[] {
  return items.filter((item) =>
    /<=|>=|constraints?|follow up|range|length|nodes?|edges?|minutes?|return/i.test(item)
  );
}

function collectExamplesFromHtml(html: string): Array<{ input?: string; output?: string; explanation?: string }> {
  const blockMatches = [...html.matchAll(/example\s*\d*[\s\S]{0,600}?input[\s\S]{0,300}?output[\s\S]{0,300}/gi)];
  const examples = blockMatches.map((match) => {
    const block = stripHtmlToText(match[0] ?? "");
    const input = block.match(/input[:\s]+(.+?)(?:output[:\s]+|$)/i)?.[1]?.trim();
    const output = block.match(/output[:\s]+(.+?)(?:explanation[:\s]+|$)/i)?.[1]?.trim();
    const explanation = block.match(/explanation[:\s]+(.+)$/i)?.[1]?.trim();
    return { input, output, explanation };
  }).filter((example) => example.input || example.output || example.explanation);

  return examples.slice(0, 3);
}

function walkForLeetCodeQuestionData(node: unknown): {
  title?: string;
  difficulty?: string;
  content?: string;
  topicTags?: Array<{ name?: string }>;
  exampleTestcases?: string;
} | null {
  if (!node || typeof node !== "object") {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkForLeetCodeQuestionData(item);
      if (found?.content || found?.title) return found;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  const directContent = typeof record.content === "string" ? record.content : undefined;
  const directTitle = typeof record.title === "string" ? record.title : undefined;
  const directDifficulty = typeof record.difficulty === "string"
    ? record.difficulty
    : (record.difficulty && typeof record.difficulty === "object" && typeof (record.difficulty as Record<string, unknown>).label === "string"
      ? String((record.difficulty as Record<string, unknown>).label)
      : undefined);

  if (directContent && directTitle) {
    return {
      title: directTitle,
      difficulty: directDifficulty,
      content: directContent,
      topicTags: Array.isArray(record.topicTags) ? record.topicTags as Array<{ name?: string }> : undefined,
      exampleTestcases: typeof record.exampleTestcases === "string" ? record.exampleTestcases : undefined
    };
  }

  for (const value of Object.values(record)) {
    const found = walkForLeetCodeQuestionData(value);
    if (found?.content || found?.title) return found;
  }

  return null;
}

function extractLeetCodePage(inputUrl: string, html: string): IngestedProblemPage | null {
  const normalizedUrl = normalizeUrl(inputUrl);
  const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch?.[1]) {
    return null;
  }

  const nextData = safeJsonParse<unknown>(nextDataMatch[1]);
  const question = walkForLeetCodeQuestionData(nextData);
  if (!question?.content && !question?.title) {
    return null;
  }

  const contentHtml = question.content ?? "";
  const examples = collectExamplesFromHtml(contentHtml);
  const constraints = splitConstraintLikeItems(collectListItems(contentHtml));
  const tags = (question.topicTags ?? [])
    .map((tag) => collapseWhitespace(String(tag?.name ?? "")))
    .filter(Boolean);

  return {
    url: inputUrl,
    normalizedUrl,
    platform: "leetcode",
    title: question.title,
    difficulty: question.difficulty,
    statementText: contentHtml ? stripHtmlToText(contentHtml) : undefined,
    constraints,
    examples,
    tags,
    fetchedAt: new Date().toISOString(),
    source: "leetcode-next-data"
  };
}

function extractSectionHtml(html: string, markers: string[]): string | undefined {
  for (const marker of markers) {
    const regex = new RegExp(`${marker}[\\s\\S]{0,2500}`, "i");
    const match = html.match(regex);
    if (match?.[0]) {
      return match[0];
    }
  }
  return undefined;
}

function extractGfgDifficulty(html: string): string | undefined {
  const match = html.match(/difficulty[^a-z0-9]{0,20}(easy|medium|hard)/i);
  return match?.[1] ? `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}` : undefined;
}

function extractGfgPage(inputUrl: string, html: string): IngestedProblemPage | null {
  const normalizedUrl = normalizeUrl(inputUrl);
  const title = extractTitleFromHtml(html);
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const statementSection = extractSectionHtml(body, [
    "problem\\s*statement",
    "given[\\s\\S]{0,300}return",
    "given[\\s\\S]{0,300}find"
  ]) ?? body;

  const statementText = stripHtmlToText(statementSection);
  if (!title && !statementText) {
    return null;
  }

  const constraintsSection = extractSectionHtml(body, ["constraints?"]);
  const examplesSection = extractSectionHtml(body, ["examples?"]);
  const constraints = constraintsSection ? splitConstraintLikeItems(collectListItems(constraintsSection)) : [];
  const examples = examplesSection ? collectExamplesFromHtml(examplesSection) : [];

  return {
    url: inputUrl,
    normalizedUrl,
    platform: "gfg",
    title,
    difficulty: extractGfgDifficulty(body),
    statementText,
    constraints,
    examples,
    tags: extractTagMatches(html),
    fetchedAt: new Date().toISOString(),
    source: "gfg-html"
  };
}

function extractGenericPage(inputUrl: string, html: string): IngestedProblemPage | null {
  const normalizedUrl = normalizeUrl(inputUrl);
  const title = extractTitleFromHtml(html);
  const statementSource = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const statementText = stripHtmlToText(statementSource);
  if (!title && !statementText) {
    return null;
  }

  return {
    url: inputUrl,
    normalizedUrl,
    platform: "generic",
    title,
    statementText,
    constraints: splitConstraintLikeItems(collectListItems(statementSource)),
    examples: collectExamplesFromHtml(statementSource),
    tags: extractTagMatches(html),
    fetchedAt: new Date().toISOString(),
    source: "html"
  };
}

export function extractProblemPageFromHtml(inputUrl: string, html: string): IngestedProblemPage | null {
  const platform = detectPlatform(inputUrl);
  if (platform === "leetcode") {
    return extractLeetCodePage(inputUrl, html) ?? extractGenericPage(inputUrl, html);
  }
  if (platform === "gfg") {
    return extractGfgPage(inputUrl, html) ?? extractGenericPage(inputUrl, html);
  }
  return extractGenericPage(inputUrl, html);
}

export async function fetchProblemPage(inputUrl: string, options?: { forceRefresh?: boolean }): Promise<IngestedProblemPage | null> {
  if (!options?.forceRefresh) {
    const cached = loadCachedRecord(inputUrl);
    if (cached) {
      return cached;
    }
  }

  const response = await fetch(inputUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Dynamic-DSA-Sheet/2.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${inputUrl}`);
  }

  const html = await response.text();
  const record = extractProblemPageFromHtml(inputUrl, html);
  if (record) {
    saveCacheRecord(record);
  }
  return record;
}

function buildStructuredStatement(page: IngestedProblemPage): string | undefined {
  const parts: string[] = [];
  if (page.title) parts.push(`Title: ${page.title}`);
  if (page.difficulty) parts.push(`Difficulty: ${page.difficulty}`);
  if (page.tags?.length) parts.push(`Tags: ${page.tags.join(", ")}`);
  if (page.statementText) parts.push(`Statement: ${page.statementText}`);
  if (page.constraints?.length) parts.push(`Constraints: ${page.constraints.join(" | ")}`);
  if (page.examples?.length) {
    const serializedExamples = page.examples
      .map((example, index) => `Example ${index + 1}: Input=${example.input ?? ""}; Output=${example.output ?? ""}; Explanation=${example.explanation ?? ""}`)
      .join(" | ");
    if (serializedExamples.trim()) {
      parts.push(serializedExamples);
    }
  }
  return parts.length ? parts.join("\n") : undefined;
}

export async function buildRoadmapInferenceStatement(
  inputUrl: string,
  providedProblemStatement?: string
): Promise<string | undefined> {
  const manual = providedProblemStatement?.trim();
  try {
    const page = await fetchProblemPage(inputUrl);
    const fetched = page ? buildStructuredStatement(page)?.trim() : undefined;
    if (fetched && manual) {
      return `${fetched}\n\nManual Notes: ${manual}`;
    }
    return fetched || manual || undefined;
  } catch {
    return manual || undefined;
  }
}
