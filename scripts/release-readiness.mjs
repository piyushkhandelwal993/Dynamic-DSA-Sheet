import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const packageJson = require(path.join(root, "package.json"));
const topicRegistry = require(path.join(root, "dist", "data", "topics", "index.js"));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

function requireFile(relativePath) {
  const target = path.join(root, relativePath);
  assert.ok(fs.existsSync(target), `Missing release file: ${relativePath}`);
  assert.ok(fs.statSync(target).size > 0, `Release file is empty: ${relativePath}`);
}

function checkVersion() {
  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/, "package.json must use semantic versioning");
  const ref = process.env.GITHUB_REF ?? "";
  if (ref.startsWith("refs/tags/")) {
    assert.equal(ref.slice("refs/tags/".length), `v${packageJson.version}`, "Git tag must match package version");
  }
}

function checkAssets() {
  [
    "build/icon.png",
    "build/icon.ico",
    "build/icon.icns",
    "desktop/index.html",
    "desktop/main.js",
    "desktop/preload.js",
    "desktop/renderer.js",
    "desktop/styles.css",
    "desktop/assets/owl-mentor.svg"
  ].forEach(requireFile);
}

function checkElectronSecurity() {
  const main = read("desktop/main.js");
  const html = read("desktop/index.html");
  assert.match(main, /contextIsolation:\s*true/, "Electron contextIsolation must remain enabled");
  assert.match(main, /nodeIntegration:\s*false/, "Electron nodeIntegration must remain disabled");
  assert.match(main, /sandbox:\s*true/, "Electron renderer sandbox must remain enabled");
  assert.match(main, /setWindowOpenHandler\(\(\)\s*=>\s*\(\{\s*action:\s*"deny"/, "New windows must be denied");
  assert.match(html, /Content-Security-Policy/, "Desktop HTML must define a CSP");
}

function checkPackaging() {
  assert.equal(packageJson.build?.appId, "com.dsasheet.desktop");
  assert.ok(packageJson.build?.publish?.some((entry) => entry.provider === "github"), "GitHub publishing must be configured");
  assert.ok(packageJson.build?.mac?.target?.includes("zip"), "macOS zip target is required for updates");
  assert.ok(packageJson.build?.mac?.target?.includes("dmg"), "macOS dmg target is required");
  assert.ok(packageJson.build?.win?.target?.includes("nsis"), "Windows NSIS target is required");
  assert.ok(packageJson.build?.linux?.target?.includes("AppImage"), "Linux AppImage target is required");
}

function checkWorkflow() {
  const workflow = read(".github/workflows/release-desktop.yml");
  assert.match(workflow, /npm run release:check/, "Release workflow must run the unified release gate");
  assert.match(workflow, /macos-13/, "Release workflow must include Intel macOS");
  assert.match(workflow, /macos-14/, "Release workflow must include Apple Silicon macOS");
  assert.match(workflow, /windows-latest/, "Release workflow must include Windows");
  assert.match(workflow, /ubuntu-latest/, "Release workflow must include Linux");
  assert.match(workflow, /choco install mingw/, "Windows release CI must install a C++ compiler");
  assert.match(workflow, /GITHUB_PATH/, "Windows release CI must expose the C++ compiler to later steps");
}

function checkTopicLearningPaths() {
  const missingGuided = [];
  const missingMilestone = [];
  for (const topicId of topicRegistry.topicOrder) {
    const problems = topicRegistry.topicPacks[topicId].problems;
    if (!problems.some((problem) => problem.functionContract && problem.solutionMode === "guided-function")) {
      missingGuided.push(topicId);
    }
    if (!problems.some((problem) => problem.independenceMilestoneFor?.length)) {
      missingMilestone.push(topicId);
    }
  }
  assert.deepEqual(missingGuided, [], `Topics missing guided functions: ${missingGuided.join(", ")}`);
  assert.deepEqual(missingMilestone, [], `Topics missing independence milestones: ${missingMilestone.join(", ")}`);
}

function checkDataSeparation() {
  const storage = read("src/services/storage.ts");
  assert.match(storage, /\.dsa-sheet/, "User data must remain outside the installed application");
  const updater = read("desktop/main.js");
  assert.match(updater, /autoDownload\s*=\s*false/, "Updates must remain user-controlled");
  assert.match(updater, /autoInstallOnAppQuit\s*=\s*false/, "Updates must not install silently");
}

checkVersion();
checkAssets();
checkElectronSecurity();
checkPackaging();
checkWorkflow();
checkTopicLearningPaths();
checkDataSeparation();

console.log(`Release readiness passed for DSA Sheet v${packageJson.version}.`);
console.log(`Validated ${topicRegistry.topicOrder.length} topic learning paths, desktop security, updater policy, assets, and platform packaging.`);
