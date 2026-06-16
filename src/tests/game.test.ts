import test from "node:test";
import assert from "node:assert/strict";
import { applySubmissionRewards, createInitialGameProfile } from "../services/game";

test("game profile starts with a neutral global rank and topic title slots", () => {
  const profile = createInitialGameProfile();
  assert.equal(profile.rankTitle, "Code Novice");
  assert.deepEqual(profile.topicTitles, {});
});

test("game rewards grant xp and complete quest on strong submission", () => {
  const result = applySubmissionRewards(createInitialGameProfile(), {
    problemId: "bit-003",
    score: {
      finalScore: 88,
      correctnessScore: 70,
      conceptMatchScore: 100,
      qualityScore: 90,
      complexityScore: 90
    },
    firstSolvedAttempt: true,
    retryRequired: false
  });

  assert.ok(result.xpGained > 0);
  assert.equal(result.questStatus, "quest-complete");
  assert.equal(result.updatedProfile.questsCompleted, 1);
  assert.equal(result.updatedProfile.badges.some((badge) => badge.id === "first-blood"), true);
});

test("game rewards keep retry flows as training quests", () => {
  const result = applySubmissionRewards(createInitialGameProfile(), {
    problemId: "bit-001",
    score: {
      finalScore: 82,
      correctnessScore: 70,
      conceptMatchScore: 100,
      qualityScore: 85,
      complexityScore: 65
    },
    firstSolvedAttempt: true,
    retryRequired: true
  });

  assert.equal(result.questStatus, "training-quest");
  assert.equal(result.updatedProfile.questsCompleted, 0);
});
