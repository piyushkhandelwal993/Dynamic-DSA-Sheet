import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getMasterySummary } from "../services/progression";
import { updateSkillProfileFromSubmission, isConceptMastered } from "../services/skillProfile";
import { createInitialSkillProfile, getProblemById, getSkillProfile } from "../services/storage";
import { effectiveProblemForPracticeMode } from "../services/workspace";
import { AnalysisResult, ConceptDetectionResult, ScoreBreakdown } from "../types";
import { makeSignals } from "./helpers";

const strongScore: ScoreBreakdown = {
  finalScore: 95,
  correctnessScore: 100,
  conceptMatchScore: 100,
  qualityScore: 90,
  complexityScore: 90
};

function strongDetection(concepts: string[]): ConceptDetectionResult {
  return {
    matchedConcepts: concepts,
    missingConcepts: []
  };
}

function cleanAnalysis(): AnalysisResult {
  return {
    detected: [],
    warnings: [],
    signals: makeSignals({
      usesLinkedListTraversal: true,
      usesLinkedListReverse: true
    })
  };
}

test("guided function success strengthens concepts but caps implementation independence", () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  let profile = createInitialSkillProfile();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    profile = updateSkillProfileFromSubmission(
      profile,
      problem,
      strongDetection(problem.expectedConcepts),
      strongScore,
      cleanAnalysis()
    );
  }

  const conceptId = problem.expectedConcepts[0];
  assert.ok(profile.conceptScores[conceptId] >= 80);
  assert.equal(profile.implementationScores[conceptId], 60);
  assert.equal(profile.implementationStrongHits[conceptId], 0);
  assert.equal(isConceptMastered(profile, conceptId), false);
  assert.equal(profile.submissionHistory.at(-1)?.solutionMode, "guided-function");
});

test("complete-program evidence can unlock full mastery", () => {
  const original = getProblemById("ll-006");
  assert.ok(original);
  const problem = { ...original, solutionMode: "complete-program" as const, functionContract: undefined };
  let profile = createInitialSkillProfile();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    profile = updateSkillProfileFromSubmission(
      profile,
      problem,
      strongDetection(problem.expectedConcepts),
      strongScore,
      cleanAnalysis()
    );
  }

  const conceptId = problem.expectedConcepts[0];
  assert.equal(profile.implementationScores[conceptId], 95);
  assert.equal(profile.implementationStrongHits[conceptId], 3);
  assert.equal(isConceptMastered(profile, conceptId), true);
  assert.equal(profile.strongConcepts.includes(conceptId), true);
});

test("mastery summary exposes algorithm and implementation dimensions", () => {
  const profile = createInitialSkillProfile();
  profile.conceptScores["ll-reverse"] = 90;
  profile.conceptAttempts["ll-reverse"] = 3;
  profile.implementationScores["ll-reverse"] = 60;
  profile.implementationAttempts["ll-reverse"] = 3;

  const item = getMasterySummary(profile).find((entry) => entry.conceptId === "ll-reverse");
  assert.ok(item);
  assert.equal(item.tier, "Mastered");
  assert.equal(item.implementationTier, "Comfortable");
  assert.equal(item.fullyMastered, false);
});

test("legacy skill profiles migrate complete-program evidence without data loss", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-legacy-skill-profile-"));
  process.env.DSA_SHEET_HOME = baseDir;
  fs.writeFileSync(
    path.join(baseDir, "skill-profile.json"),
    JSON.stringify({
      studentId: "local",
      conceptScores: { "ll-reverse": 88 },
      weakConcepts: [],
      strongConcepts: ["ll-reverse"],
      submissionHistory: [],
      conceptAttempts: { "ll-reverse": 3 },
      conceptStrongHits: { "ll-reverse": 3 }
    }),
    "utf-8"
  );

  try {
    const migrated = getSkillProfile();
    assert.equal(migrated.implementationScores["ll-reverse"], 88);
    assert.equal(migrated.implementationAttempts["ll-reverse"], 3);
    assert.equal(migrated.implementationStrongHits["ll-reverse"], 3);
    assert.equal(isConceptMastered(migrated, "ll-reverse"), true);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("complete-program milestone credits the guided concept family", () => {
  const original = getProblemById("arr-004");
  assert.ok(original);
  const problem = effectiveProblemForPracticeMode(original, "pro");
  const profile = updateSkillProfileFromSubmission(
    createInitialSkillProfile(),
    problem,
    strongDetection(problem.expectedConcepts),
    strongScore,
    {
      detected: [],
      warnings: [],
      signals: makeSignals({ usesArrayTraversal: true })
    }
  );

  assert.equal(profile.implementationScores["array-traversal"], 95);
  assert.equal(profile.implementationStrongHits["array-traversal"], 1);
  assert.equal(profile.implementationScores["min-max-array"], 95);
});
