import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const packageJson = require(path.join(root, "package.json"));
const { defaultTopicId, topicOrder, topicPacks } = require(path.join(root, "dist", "data", "topics", "index.js"));

const now = new Date();
const versionStamp = [
  now.getUTCFullYear(),
  String(now.getUTCMonth() + 1).padStart(2, "0"),
  String(now.getUTCDate()).padStart(2, "0")
].join(".");

const contentVersion = process.env.CONTENT_VERSION?.trim() || `${versionStamp}.1`;
const outputDir = path.join(root, "release", "content");
const bundleFileName = `catalog-${contentVersion}.json`;
const baseUrl = process.env.CONTENT_BASE_URL?.trim() || "";

const bundle = {
  schemaVersion: 1,
  contentVersion,
  generatedAt: new Date().toISOString(),
  minAppVersion: packageJson.version,
  defaultTopicId,
  topicOrder,
  topicPacks
};

const manifest = {
  schemaVersion: 1,
  contentVersion,
  generatedAt: bundle.generatedAt,
  minAppVersion: packageJson.version,
  bundleUrl: baseUrl ? new URL(bundleFileName, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString() : bundleFileName
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, bundleFileName), `${JSON.stringify(bundle, null, 2)}\n`, "utf-8");
fs.writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");

console.log(`Exported content bundle: release/content/${bundleFileName}`);
console.log("Exported manifest: release/content/manifest.json");
