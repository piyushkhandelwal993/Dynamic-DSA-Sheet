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

test("reverse words in a string becomes a supported cataloged roadmap target", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-reverse-words-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/reverse-words-in-a-string/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/reverse-words-in-a-string/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.verdict === "unsupported", false);
  assert.equal(assessment.matchedProblem?.id, "ext-lc-reverse-words-in-string");
  assert.equal(internalIds.includes("str-008"), true);
  assert.equal(internalIds.includes("str-005") || internalIds.includes("str-002"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Reverse Words in a String");
});

test("valid anagram becomes a supported cataloged strings roadmap target", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-valid-anagram-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/valid-anagram/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/valid-anagram/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.id, "ext-lc-valid-anagram");
  assert.equal(internalIds.includes("str-004"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Valid Anagram");
});

test("valid palindrome routes through the strings topic instead of the legacy recursion catalog entry", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-valid-palindrome-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/valid-palindrome/",
    progress,
    skillProfile
  );

  assert.equal(assessment.matchedProblem?.id, "ext-lc-valid-palindrome");
  assert.equal(assessment.matchedProblem?.topicId, "strings");
});

test("word break now uses string bridges instead of dp-only routing", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-word-break-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/word-break/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/word-break/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.topicId, "strings");
  assert.equal(internalIds.includes("str-008"), true);
  assert.equal(internalIds.includes("str-010"), true);
});

test("edit distance now routes through string dp bridges", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-edit-distance-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/edit-distance/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/edit-distance/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.topicId, "strings");
  assert.equal(internalIds.includes("str-010"), true);
  assert.equal(internalIds.includes("str-011"), true);
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

test("unique paths roadmap prefers the direct grid-dp bridge over generic tabulation fillers", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-unique-paths-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/unique-paths/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds[0], "dp-006");
  assert.equal(internalIds.includes("dp-004"), false);
  assert.equal(roadmap.steps.at(-1)?.title, "Unique Paths");
});

test("course schedule roadmap can pull indegree-building readiness before graph topo practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-course-schedule-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/course-schedule/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-038"), true);
  assert.equal(internalIds.includes("gr-010"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Course Schedule");
});

test("network delay roadmap can pull heap-distance readiness before dijkstra practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-network-delay-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/network-delay-time/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-024"), true);
  assert.equal(internalIds.includes("gr-013"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Network Delay Time");
});

test("binary tree level order roadmap can pull queue toolkit readiness before tree practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-level-order-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-001"), false);
  assert.equal(internalIds.includes("lt-006"), true);
  assert.equal(internalIds.includes("tr-004"), true);
  assert.deepEqual(internalIds, ["lt-006", "tr-004"]);
  assert.equal(roadmap.steps.at(-1)?.title, "Binary Tree Level Order Traversal");
});

test("diameter roadmap avoids the internal twin and weak path-sum transfer", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-diameter-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/diameter-of-binary-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);
  const externalTitles = roadmap.steps
    .filter((step) => step.type === "external")
    .map((step) => step.title);

  assert.equal(internalIds.includes("tr-006"), false);
  assert.equal(internalIds.includes("tr-001"), true);
  assert.equal(internalIds.includes("tr-005"), true);
  assert.deepEqual(internalIds, ["tr-001", "tr-005"]);
  assert.equal(externalTitles.includes("Path Sum"), false);
  assert.equal(roadmap.steps.at(-1)?.title, "Diameter of Binary Tree");
});

test("binary tree maximum path sum becomes a supported trees roadmap target", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-max-path-sum-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.verdict === "unsupported", false);
  assert.equal(assessment.matchedProblem?.id, "ext-lc-binary-tree-maximum-path-sum");
  assert.deepEqual(internalIds, ["tr-001", "tr-005", "tr-006", "tr-016"]);
  assert.equal(roadmap.steps.some((step) => step.type === "external"), false);
  assert.equal(roadmap.steps.at(-1)?.title, "Binary Tree Maximum Path Sum");
});

test("boundary of binary tree becomes a supported trees roadmap target", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-boundary-tree-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/boundary-of-binary-tree/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/boundary-of-binary-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.verdict === "unsupported", false);
  assert.equal(assessment.matchedProblem?.id, "ext-lc-boundary-of-binary-tree");
  assert.deepEqual(internalIds, ["tr-001", "tr-017", "tr-018"]);
  assert.deepEqual(roadmap.notes, []);
  assert.equal(roadmap.steps.some((step) => step.type === "external"), false);
  assert.equal(roadmap.steps.at(-1)?.title, "Boundary of Binary Tree");
});

test("sliding window maximum roadmap can pull queue toolkit readiness before deque practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-window-max-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/sliding-window-maximum/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-014"), true);
  assert.equal(internalIds.includes("q-008"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Sliding Window Maximum");
});

test("shortest subarray roadmap prefers prefix-plus-deque bridges over raw deque-only routing", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-shortest-subarray-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("arr-006"), true);
  assert.equal(internalIds.includes("lt-013"), true);
  assert.equal(internalIds.includes("q-008"), true);
  assert.equal(internalIds.includes("q-009"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Shortest Subarray with Sum at Least K");
});

test("task scheduler roadmap pulls toolkit plus top-k bridges before the final queue challenge", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-task-scheduler-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/task-scheduler/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-009"), true);
  assert.equal(internalIds.includes("lt-015"), true);
  assert.equal(internalIds.includes("q-011"), true);
  assert.equal(internalIds.includes("q-012"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Task Scheduler");
});

test("right side view roadmap uses queue readiness before tree-view practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-right-view-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/binary-tree-right-side-view/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-006"), true);
  assert.equal(internalIds.includes("tr-004"), true);
  assert.equal(internalIds.includes("tr-009"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Binary Tree Right Side View");
});

test("top view of binary tree becomes a supported trees roadmap target", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-top-view-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/top-view-of-a-binary-tree/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/top-view-of-a-binary-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.verdict === "unsupported", false);
  assert.equal(assessment.matchedProblem?.id, "ext-lc-top-view-binary-tree");
  assert.deepEqual(internalIds, ["tr-004", "tr-012"]);
  assert.equal(roadmap.steps.at(-1)?.title, "Top View of Binary Tree");
});

test("bottom view of binary tree becomes a supported trees roadmap target", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-bottom-view-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/bottom-view-of-a-binary-tree/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/bottom-view-of-a-binary-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.verdict === "unsupported", false);
  assert.equal(assessment.matchedProblem?.id, "ext-lc-bottom-view-binary-tree");
  assert.deepEqual(internalIds, ["tr-004", "tr-012"]);
  assert.equal(roadmap.steps.at(-1)?.title, "Bottom View of Binary Tree");
});

test("kth smallest bst roadmap pulls sorted-check and inorder traversal before bst search practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-kth-smallest-bst-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("arr-002"), true);
  assert.equal(internalIds.includes("tr-002"), true);
  assert.equal(internalIds.includes("tr-008"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Kth Smallest Element in a BST");
});

test("reverse words roadmap pulls toolkit tokenization before string-level transfer practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-reverse-words-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/reverse-words-in-a-string/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-017"), true);
  assert.equal(internalIds.includes("str-008"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Reverse Words in a String");
});

test("vertical order roadmap uses the dedicated vertical-order bridge after level order and top view", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-vertical-order-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.deepEqual(internalIds, ["tr-004", "tr-012", "tr-019"]);
  assert.equal(roadmap.steps.at(-1)?.title, "Vertical Order Traversal of a Binary Tree");
});

test("vertical order prepends at most one severe toolkit bridge when support skills are very weak", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-vertical-order-support-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["queue-library-usage"] = 20;
  skillProfile.conceptScores["ordered-map-usage"] = 20;
  skillProfile.conceptScores["pair-collection-usage"] = 20;
  skillProfile.conceptScores["map-iteration-order-usage"] = 20;

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);
  const toolkitIds = internalIds.filter((problemId) => problemId?.startsWith("lt-"));

  assert.equal(internalIds.includes("tr-004"), true);
  assert.equal(internalIds.includes("tr-012"), true);
  assert.equal(internalIds.includes("tr-019"), true);
  assert.equal(toolkitIds.length <= 1, true);
});

test("beginner roadmap keeps multiple toolkit foundations when support skills are weak", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-vertical-order-beginner-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["queue-library-usage"] = 20;
  skillProfile.conceptScores["ordered-map-usage"] = 20;
  skillProfile.conceptScores["pair-collection-usage"] = 20;
  skillProfile.conceptScores["map-iteration-order-usage"] = 20;

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/",
    progress,
    skillProfile,
    undefined,
    { practiceMode: "beginner" }
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);
  const toolkitIds = internalIds.filter((problemId) => problemId?.startsWith("lt-"));

  assert.equal(toolkitIds.length >= 2, true);
  assert.equal(internalIds.includes("tr-004"), true);
  assert.equal(internalIds.includes("tr-012"), true);
  assert.equal(internalIds.includes("tr-019"), true);
});

test("network delay roadmap can pull heap-of-pairs readiness before graph dijkstra practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-network-delay-pairs-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/network-delay-time/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-024"), true);
  assert.equal(internalIds.includes("gr-013"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Network Delay Time");
});

test("group anagrams roadmap can pull map-order toolkit readiness before string transfer practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-group-anagrams-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/group-anagrams/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-022"), true);
  assert.equal(internalIds.includes("str-004"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Group Anagrams");
});

test("path exists in graph roadmap can pull adjacency-list toolkit readiness before graph traversal practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-path-exists-graph-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/find-if-path-exists-in-graph/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-036"), true);
  assert.equal(internalIds.includes("gr-002"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Find if Path Exists in Graph");
});

test("course schedule roadmap can pull indegree-building toolkit readiness before graph topo practice", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-course-schedule-indegree-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/course-schedule/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("lt-038"), true);
  assert.equal(internalIds.includes("gr-010"), true);
  assert.equal(roadmap.steps.at(-1)?.title, "Course Schedule");
});

test("frog jump roadmap distinguishes cost-minimization bridges from jump-memory reachability bridges", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-frog-jump-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/frog-jump/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/frog-jump/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.id, "ext-lc-frog-jump");
  assert.equal(assessment.matchedProblem?.topicId, "dp");
  assert.ok(assessment.missingConceptIds.includes("jump-reachability-dp"));
  assert.equal(internalIds.includes("dp-016"), true);
  assert.equal(internalIds.includes("dp-017"), true);
  assert.ok(internalIds.indexOf("dp-016") < internalIds.indexOf("dp-017"));
  assert.equal(roadmap.steps.at(-1)?.title, "Frog Jump");
});

test("stock cooldown roadmap uses the dedicated cooldown-state bridge", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-stock-cooldown-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.id, "ext-lc-best-time-stock-cooldown");
  assert.ok(internalIds.includes("dp-018"));
  assert.equal(roadmap.steps.at(-1)?.title, "Best Time to Buy and Sell Stock with Cooldown");
});

test("knight probability roadmap uses the probability-dp bridge", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-knight-probability-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/knight-probability-in-chessboard/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/knight-probability-in-chessboard/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.id, "ext-lc-knight-probability");
  assert.ok(internalIds.includes("dp-019"));
  assert.equal(roadmap.steps.at(-1)?.title, "Knight Probability in Chessboard");
});

test("stock iii roadmap uses the transaction-budget bridge", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-stock-iii-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/",
    progress,
    skillProfile
  );
  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(assessment.matchedProblem?.id, "ext-lc-best-time-stock-iii");
  assert.ok(internalIds.includes("dp-020"));
  assert.equal(roadmap.steps.at(-1)?.title, "Best Time to Buy and Sell Stock III");
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

test("count primes roadmap prefers internal prime and sieve bridges over generic math detours", () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-target-roadmap-count-primes-"));
  invalidateCatalogCache();
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["divisibility-check"] = 66;
  skillProfile.conceptScores["primality-test"] = 52;
  skillProfile.conceptScores["sieve-precomputation"] = 38;

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/count-primes/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);
  const externalTitles = roadmap.steps
    .filter((step) => step.type === "external")
    .map((step) => step.title);

  assert.equal(internalIds.includes("pm-006"), true);
  assert.equal(internalIds.includes("pm-008"), true);
  assert.equal(roadmap.steps.some((step) => /greatest common divisor/i.test(step.title)), false);
  assert.equal(externalTitles.includes("Ugly Number"), false);
  assert.equal(roadmap.steps.at(-1)?.title, "Count Primes");
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

test("non-adjacent subsequence max-sum url uses the dedicated range-merge dp bridge", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["dp-intro"] = 64;
  skillProfile.conceptScores["state-transition"] = 52;
  skillProfile.conceptScores["tabulation"] = 44;
  skillProfile.conceptScores["space-optimization"] = 38;
  skillProfile.conceptScores["segment-merge-dp"] = 20;

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/maximum-sum-of-subsequence-with-non-adjacent-elements/",
    progress,
    skillProfile
  );

  assert.equal(assessment.matchedProblem?.id, "ext-lc-max-non-adjacent-subsequence-updates");
  assert.ok(assessment.missingConceptIds.includes("segment-merge-dp"));

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/maximum-sum-of-subsequence-with-non-adjacent-elements/",
    progress,
    skillProfile
  );

  const internalIds = roadmap.steps
    .filter((step) => step.type === "internal")
    .map((step) => step.internalProblemId);

  assert.equal(internalIds.includes("dp-003"), true);
  assert.equal(internalIds.includes("dp-004"), true);
  assert.equal(internalIds.includes("dp-022"), true);
  assert.equal(roadmap.steps[0]?.type, "internal");
  assert.equal(roadmap.steps.at(-1)?.title, "Maximum Sum of Subsequence With Non-adjacent Elements");
});

test("spiral matrix gets heuristic array-roadmap support", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["array-traversal"] = 82;
  skillProfile.conceptScores["matrix-traversal"] = 54;
  skillProfile.conceptScores["boundary-traversal"] = 41;

  const assessment = assessTargetProblemReadiness(
    "https://leetcode.com/problems/spiral-matrix/",
    progress,
    skillProfile
  );

  assert.equal(assessment.matchedProblem, undefined);
  assert.equal(assessment.inferredTopicId, "arrays");
  assert.equal(assessment.confidence, "High");
  assert.ok(assessment.missingConceptIds.includes("matrix-traversal"));
  assert.ok(assessment.missingConceptIds.includes("boundary-traversal"));

  const roadmap = createTargetProblemRoadmap(
    "https://leetcode.com/problems/spiral-matrix/",
    progress,
    skillProfile
  );

  assert.ok(roadmap.steps.length >= 2);
  assert.equal(roadmap.steps.some((step) => step.internalProblemId === "arr-037"), true);
  assert.equal(roadmap.steps.some((step) => step.internalProblemId === "arr-038"), true);
  assert.equal(roadmap.steps[0]?.type, "internal");
  assert.equal(roadmap.steps.at(-1)?.type, "target");
});

test("matrix traversal family urls get heuristic array-roadmap support", () => {
  const progress = createInitialProgress();
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["array-traversal"] = 62;
  skillProfile.conceptScores["in-place-array-update"] = 57;

  const urls = [
    "https://leetcode.com/problems/set-matrix-zeroes/",
    "https://leetcode.com/problems/rotate-image/",
    "https://leetcode.com/problems/diagonal-traverse/",
    "https://leetcode.com/problems/reshape-the-matrix/",
    "https://leetcode.com/problems/toeplitz-matrix/"
  ];

  for (const url of urls) {
    const assessment = assessTargetProblemReadiness(url, progress, skillProfile);
    assert.equal(assessment.matchedProblem, undefined);
    assert.equal(assessment.inferredTopicId, "arrays");

    const roadmap = createTargetProblemRoadmap(url, progress, skillProfile);
    assert.ok(roadmap.steps.length >= 2, `expected roadmap for ${url}`);
    assert.equal(roadmap.steps[0]?.type, "internal");
    assert.equal(roadmap.steps.at(-1)?.type, "target");
  }
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
