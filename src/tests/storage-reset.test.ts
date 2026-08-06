import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { createInitialGameProfile } from "../services/game";
import {
  createInitialProgress,
  createInitialSkillProfile,
  getGameProfile,
  getProgress,
  getSkillProfile,
  resetLearningState,
  saveGameProfile,
  saveProgress,
  saveSkillProfile
} from "../services/storage";

const originalBaseDir = process.env.DSA_SHEET_HOME;

test.after(() => {
  if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
  else process.env.DSA_SHEET_HOME = originalBaseDir;
});

test("resetLearningState clears both progress and skill profile", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-storage-reset-"));

  const progress = createInitialProgress();
  progress.problems["arr-001"] = {
    problemId: "arr-001",
    status: "solved",
    attempts: 2,
    bestScore: 96
  };
  saveProgress(progress);

  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["array-traversal"] = 88;
  skillProfile.strongConcepts = ["array-traversal"];
  saveSkillProfile(skillProfile);

  const gameProfile = createInitialGameProfile();
  gameProfile.xp = 250;
  saveGameProfile(gameProfile);

  resetLearningState();

  assert.deepEqual(getProgress().problems, {});
  assert.equal(getSkillProfile().conceptScores["array-traversal"], 0);
  assert.deepEqual(getSkillProfile().strongConcepts, []);
  assert.equal(getGameProfile().xp, 0);
});
