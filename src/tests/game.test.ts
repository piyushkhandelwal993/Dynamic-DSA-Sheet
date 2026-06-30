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
    retryRequired: false,
    solvedByExecution: true,
    newSolveMilestone: true,
    improvedSolvedSubmission: false,
    previousBestScore: 0
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
    retryRequired: true,
    solvedByExecution: true,
    newSolveMilestone: true,
    improvedSolvedSubmission: false,
    previousBestScore: 0
  });

  assert.equal(result.questStatus, "training-quest");
  assert.equal(result.updatedProfile.questsCompleted, 0);
});

test("repeat equivalent solved submissions do not farm xp or quest counters", () => {
  const seeded = applySubmissionRewards(createInitialGameProfile(), {
    problemId: "arr-003",
    score: {
      finalScore: 92,
      correctnessScore: 100,
      conceptMatchScore: 100,
      qualityScore: 88,
      complexityScore: 90
    },
    firstSolvedAttempt: true,
    retryRequired: false,
    solvedByExecution: true,
    newSolveMilestone: true,
    improvedSolvedSubmission: false,
    previousBestScore: 0
  }).updatedProfile;

  const repeat = applySubmissionRewards(seeded, {
    problemId: "arr-003",
    score: {
      finalScore: 92,
      correctnessScore: 100,
      conceptMatchScore: 100,
      qualityScore: 88,
      complexityScore: 90
    },
    firstSolvedAttempt: false,
    retryRequired: false,
    solvedByExecution: true,
    newSolveMilestone: false,
    improvedSolvedSubmission: false,
    previousBestScore: 92
  });

  assert.equal(repeat.xpGained, 0);
  assert.equal(repeat.updatedProfile.questsCompleted, seeded.questsCompleted);
  assert.equal(repeat.updatedProfile.highQualitySubmissions, seeded.highQualitySubmissions);
  assert.equal(repeat.updatedProfile.perfectConceptMatches, seeded.perfectConceptMatches);
});

test("better re-solves earn only a capped improvement bonus", () => {
  const baseline = applySubmissionRewards(createInitialGameProfile(), {
    problemId: "arr-003",
    score: {
      finalScore: 76,
      correctnessScore: 80,
      conceptMatchScore: 80,
      qualityScore: 70,
      complexityScore: 75
    },
    firstSolvedAttempt: true,
    retryRequired: false,
    solvedByExecution: true,
    newSolveMilestone: true,
    improvedSolvedSubmission: false,
    previousBestScore: 0
  }).updatedProfile;

  const improved = applySubmissionRewards(baseline, {
    problemId: "arr-003",
    score: {
      finalScore: 92,
      correctnessScore: 100,
      conceptMatchScore: 100,
      qualityScore: 88,
      complexityScore: 90
    },
    firstSolvedAttempt: false,
    retryRequired: false,
    solvedByExecution: true,
    newSolveMilestone: false,
    improvedSolvedSubmission: true,
    previousBestScore: 76
  });

  assert.ok(improved.xpGained > 0);
  assert.ok(improved.xpGained < 30);
  assert.equal(improved.updatedProfile.questsCompleted, baseline.questsCompleted);
});
