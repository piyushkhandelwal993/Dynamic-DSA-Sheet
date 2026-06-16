import test from "node:test";
import assert from "node:assert/strict";
import { createInitialProgress, createInitialSkillProfile, getTopicProblems } from "../services/storage";
import { buildActiveQuests, buildWorldZones, getMasterySummary, getMasteryTier } from "../services/progression";

test("mastery tiers classify concept strength sensibly", () => {
  assert.equal(getMasteryTier(0, 0), "Unseen");
  assert.equal(getMasteryTier(30, 1), "Training");
  assert.equal(getMasteryTier(60, 1), "Comfortable");
  assert.equal(getMasteryTier(80, 2), "Strong");
  assert.equal(getMasteryTier(90, 3), "Mastered");
});

test("active quests prioritize retry-required problems", () => {
  const progress = createInitialProgress();
  progress.problems["bit-001"] = {
    problemId: "bit-001",
    status: "solved",
    attempts: 1,
    bestScore: 82,
    retryRequired: true,
    retryConceptIds: ["binary-representation"],
    retryReason: "Retry with bit operators."
  };

  const quests = buildActiveQuests(getTopicProblems("bit-manipulation"), progress, createInitialSkillProfile());
  assert.equal(quests[0].problemId, "bit-001");
  assert.equal(quests[0].title, "Retry Quest");
});

test("world zones unlock progressively from concept strength", () => {
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["binary-representation"] = 75;
  skillProfile.conceptScores["odd-even-check"] = 72;
  const zones = buildWorldZones(getTopicProblems("bit-manipulation"), createInitialProgress(), skillProfile);

  assert.equal(zones[0].status, "unlocked");
  assert.equal(zones[1].status, "unlocked");
  assert.equal(zones[3].status, "locked");
});

test("recursion world zones are built from recursion topic data", () => {
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["recursion-intro"] = 75;
  skillProfile.conceptScores["base-case"] = 72;
  const zones = buildWorldZones(getTopicProblems("recursion"), createInitialProgress(), skillProfile, "recursion");

  assert.equal(zones[0].name, "Base Camp");
  assert.equal(zones[1].status, "unlocked");
});

test("quests stay inside the selected topic pack", () => {
  const quests = buildActiveQuests(getTopicProblems("recursion"), createInitialProgress(), createInitialSkillProfile(), "recursion");
  assert.equal(quests[0].problemId?.startsWith("rec-"), true);
});

test("mastery summary sorts strongest concepts first", () => {
  const skillProfile = createInitialSkillProfile();
  skillProfile.conceptScores["binary-representation"] = 65;
  skillProfile.conceptAttempts["binary-representation"] = 1;
  skillProfile.conceptScores["bitwise-and"] = 84;
  skillProfile.conceptAttempts["bitwise-and"] = 2;

  const summary = getMasterySummary(skillProfile);
  assert.equal(summary[0].conceptId, "bitwise-and");
  assert.equal(summary[0].tier, "Strong");
});
