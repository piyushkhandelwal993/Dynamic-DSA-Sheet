import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getProblemById } from "../services/storage";
import { ensureProblemWorkspace } from "../services/workspace";

test("start workspace generation creates a stable Main.java template", () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-workspace-test-"));

  try {
    const first = ensureProblemWorkspace(problem);
    const second = ensureProblemWorkspace(problem);

    assert.ok(fs.existsSync(first.filePath));
    assert.equal(first.filePath, second.filePath);
    assert.equal(second.created, false);

    const content = fs.readFileSync(first.filePath, "utf-8");
    assert.match(content, /public class Main/);
    assert.match(content, /Problem: Convert Decimal to Binary/);
  } finally {
    if (originalBaseDir === undefined) {
      delete process.env.DSA_SHEET_HOME;
    } else {
      process.env.DSA_SHEET_HOME = originalBaseDir;
    }
  }
});
