import test from "node:test";
import assert from "node:assert/strict";
import { assessTargetProblemReadiness, createTargetProblemRoadmap, findCatalogedTargetProblem } from "../services/targetRoadmap";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";

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

  assert.equal(internalIds[0], "arr-013");
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

  assert.deepEqual(internalIds.slice(0, 2), ["rec-010", "arr-013"]);
  assert.equal(internalIds.includes("arr-001"), false);
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
