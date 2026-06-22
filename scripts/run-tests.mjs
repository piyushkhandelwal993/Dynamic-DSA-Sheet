import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const testDir = join(process.cwd(), "dist", "tests");
const testFiles = readdirSync(testDir)
  .filter((file) => file.endsWith(".test.js"))
  .sort()
  .map((file) => join(testDir, file));

if (testFiles.length === 0) {
  console.error("No compiled test files found. Run `npm run build` first.");
  process.exit(1);
}

// Runner tests spawn compilers and JVMs; serial files avoid CI-only timeouts
// caused by several constrained language processes competing at once.
const result = spawnSync(process.execPath, ["--test", "--test-concurrency=1", ...testFiles], {
  stdio: "inherit"
});

process.exit(result.status ?? 1);
