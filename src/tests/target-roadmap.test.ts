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
