import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { invalidateCatalogCache } from "../services/catalog";
import { assessTargetProblemReadiness, createTargetProblemRoadmap, findCatalogedTargetProblem } from "../services/targetRoadmap";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";

const originalBaseDir = process.env.DSA_SHEET_HOME;
process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-tests-"));
invalidateCatalogCache();

test.after(() => {
  if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
  else process.env.DSA_SHEET_HOME = originalBaseDir;
  invalidateCatalogCache();
});

test("findCatalogedTargetProblem normalizes catalog URLs", () => {
  const matched = findCatalogedTargetProblem("https://leetcode.com/problems/best-time-to-buy-and-sell-stock/?envType=list");
  assert.equal(matched?.id, "ext-lc-best-time-stock");
});

test("assessTargetProblemReadiness returns unsupported for unknown targets", () => {
  const assessment = assessTargetProblemReadiness("https://leetcode.com/problems/does-not-exist/");
  assert.equal(assessment.verdict, "unsupported");
  assert.equal(assessment.readyNow, false);
});

test("readiness becomes ready when prerequisites and mapped internal solves are strong", () => {
  const progress = createInitialProgress();
  progress.problems["arr-011"] = {
    problemId: "arr-011",
    status: "solved",
    attempts: 1,
    bestScore: 95
  };

  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["stock-profit"] = 92;
  skillProfile.conceptScores["min-max-array"] = 88;

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    progress,
    skillProfile
  );

  assert.equal(assessment.verdict, "ready");
  assert.equal(assessment.readyNow, true);
  assert.equal(assessment.missingConceptIds.length, 0);
});

test("roadmap prioritizes internal steps before external transfer and target retry", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["sliding-window"] = 52;
  skillProfile.conceptScores["variable-size-window"] = 49;

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/fruit-into-baskets/",
    progress,
    skillProfile
  );

  assert.equal(roadmap.assessment.verdict, "not-ready");
  assert.ok(roadmap.steps.length >= 2);
  assert.equal(roadmap.steps.at(-1)?.type, "target");

  const firstExternalIndex = roadmap.steps.findIndex((step) => step.type === "external");
  const firstTargetIndex = roadmap.steps.findIndex((step) => step.type === "target");
  const internalCount = roadmap.steps.filter((step) => step.type === "internal").length;

  assert.ok(internalCount >= 1);
  if (firstExternalIndex >= 0) {
    assert.ok(firstExternalIndex > 0);
    assert.equal(roadmap.steps[firstExternalIndex - 1]?.type, "internal");
  }
  assert.ok(firstTargetIndex === roadmap.steps.length - 1);
});

test("stock roadmap excludes the target twin and avoids redundant overlap steps", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["stock-profit"] = 40;
  skillProfile.conceptScores["min-max-array"] = 50;
  skillProfile.conceptScores["array-traversal"] = 65;

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("arr-011"), false);
  assert.equal(internalIds.includes("arr-004"), false);
  assert.equal(internalIds[0], "arr-001");
  assert.equal(roadmap.steps.at(-1)?.type, "target");
});

test("cataloged roadmap prefers mapped internal bridge before generic concept fallback", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/find-numbers-with-even-number-of-digits/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.ok(internalIds.includes("arr-013"));
  assert.equal(roadmap.steps.at(-1)?.type, "target");
});

test("cataloged roadmap can inject cross-topic bridge problems before topic practice", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/find-numbers-with-even-number-of-digits/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.deepEqual(internalIds.slice(0, 2), ["pm-001", "arr-013"]);
  assert.equal(internalIds.includes("arr-001"), false);
  assert.equal(roadmap.steps.some((step) => step.type === "external"), false);
});

test("validate bst roadmap uses cross-topic sorted-check and tree traversal bridges before target retry", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/validate-binary-search-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("arr-002"), true);
  assert.equal(internalIds.includes("tr-002"), true);
  assert.equal(internalIds.includes("tr-008"), true);
  assert.equal(roadmap.steps.some((step) => step.type === "external"), false);
  assert.equal(roadmap.steps.at(-1)?.type, "target");
});

test("two sum sorted roadmap can pull array prerequisites through the cross-topic concept chain", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-two-sum-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("arr-015"), true);
  assert.equal(roadmap.steps.at(-1)?.type, "target");
});

test("dp climbing stairs roadmap can pull recursion foundations before dp practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-dp-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/climbing-stairs/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("rec-001"), true);
  assert.equal(internalIds.includes("dp-001") || internalIds.includes("dp-002"), true);
  assert.equal(roadmap.steps.at(-1)?.type, "target");
});

test("house robber roadmap avoids using the harder sequel as the transfer step", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-house-robber-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/house-robber/",
    progress,
    skillProfile
  );

  const externalTitles = roadmap.steps
    .filter((step) => step.type === "external")
    .map((step) => step.title);

  assert.equal(externalTitles.includes("House Robber II"), false);
  assert.equal(roadmap.steps.at(-1)?.title, "House Robber");
});

test("combination sum iii roadmap prefers progressive backtracking foundations over generic recursion detours", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-combination-sum-iii-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/combination-sum-iii/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("rec-012"), false);
  assert.equal(internalIds.includes("rec-013"), true);
  assert.equal(internalIds.includes("rec-015"), true);
  assert.ok(internalIds.indexOf("rec-013") < internalIds.indexOf("rec-015"));
});

test("roadmap generation respects the passed transient progress and skill profile instead of falling back to saved state", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-transient-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    progress,
    skillProfile
  );

  assert.equal(assessment.missingConceptIds.includes("two-pointers"), true);
  assert.equal(roadmap.assessment.missingConceptIds.includes("two-pointers"), true);
  assert.equal(roadmap.steps.some((step) => step.type === "internal"), true);
});

test("non-cataloged leetcode urls get heuristic readiness and roadmap", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["binary-search-intro"] = 68;
  skillProfile.conceptScores["sorted-mid-check"] = 64;

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/search-in-nearly-sorted-array/",
    progress,
    skillProfile
  );

  assert.equal(assessment.matchedProblem, undefined);
  assert.equal(assessment.inferredTopicId, "binary-search");
  assert.equal(assessment.confidence, "High");
  assert.ok(assessment.missingConceptIds.includes("binary-search-intro"));

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/search-in-nearly-sorted-array/",
    progress,
    skillProfile
  );

  assert.ok(roadmap.steps.length >= 2);
  assert.equal(roadmap.steps.at(-1)?.type, "target");
  assert.equal(roadmap.steps[0]?.type, "internal");
});

test("problem statement improves non-cataloged inference accuracy", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["sliding-window"] = 60;
  skillProfile.conceptScores["variable-size-window"] = 58;
  skillProfile.conceptScores["prefix-sum"] = 30;

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/alpha-problem/",
    "Given a string s, find the length of the longest substring without repeating characters using a sliding window technique.",
    progress,
    skillProfile
  );

  assert.equal(assessment.inferredTopicId, "sliding-window");
  assert.equal(assessment.usedProblemStatement, true);
  assert.equal(assessment.confidence, "Medium");
  assert.ok(assessment.missingConceptIds.includes("sliding-window"));
});

test("ambiguous uncataloged targets expose alternate hypotheses", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/search-in-sorted-array/",
    progress,
    skillProfile
  );

  assert.equal(assessment.inferredTopicId, "binary-search");
  assert.ok((assessment.alternateHypotheses?.length ?? 0) >= 1);
  assert.equal(assessment.alternateHypotheses?.[0]?.topicId, "two-pointers");
});
