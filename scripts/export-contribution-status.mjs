import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePath = path.join(root, "contributions", "review-status.json");
const outputDir = path.join(root, "release", "contributions");
const outputPath = path.join(outputDir, "status.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function ensureValidFeed(feed) {
  if (!feed || typeof feed !== "object") {
    throw new Error("Contribution status feed is missing.");
  }
  if (!Array.isArray(feed.items)) {
    throw new Error("Contribution status feed must include an items array.");
  }
  feed.items.forEach((item, index) => {
    if (!item?.id || !item?.status) {
      throw new Error(`Contribution status item ${index + 1} is missing id or status.`);
    }
  });
}

const sourceFeed = readJson(sourcePath);
const exportedFeed = {
  generatedAt: sourceFeed.generatedAt || new Date().toISOString(),
  items: sourceFeed.items
};

ensureValidFeed(exportedFeed);
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(exportedFeed, null, 2)}\n`, "utf-8");

console.log("Exported contribution status feed: release/contributions/status.json");
