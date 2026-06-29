import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getDesktopBootstrap, startDesktopProblem } from "../services/desktopApp";
import { initializeStudentFiles, isInitialized } from "../services/storage";
import { StudentProfile } from "../types";

test("a new desktop user receives a recommendation and an editable workspace", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-onboarding-smoke-"));

  const profile: StudentProfile = {
    studentId: "local",
    name: "New Learner",
    batch: "self-paced",
    preferredLanguage: "java",
    currentLevel: "beginner",
    activeTopicId: "bit-manipulation",
    createdAt: new Date().toISOString()
  };

  try {
    initializeStudentFiles(profile);
    assert.equal(isInitialized(), true);

    const bootstrap = getDesktopBootstrap();
    assert.equal(bootstrap.preferences.currentView, "practice");
    assert.equal(bootstrap.preferences.currentProblemView, "description");
    assert.equal(bootstrap.activeTopicId, "bit-manipulation");
    assert.ok(bootstrap.nextRecommendation.problem);

    const session = startDesktopProblem(bootstrap.nextRecommendation.problem.id, "java");
    assert.equal(session.language, "java");
    assert.ok(fs.existsSync(session.workspacePath));
    assert.ok(session.workspaceCode.trim().length > 0);
    assert.match(session.workspaceCode, /TODO|Write your code here/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});
