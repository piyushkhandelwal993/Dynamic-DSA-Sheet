import { Badge, GameProfile, ScoreBreakdown } from "../types";

interface RewardInput {
  problemId: string;
  score: ScoreBreakdown;
  firstSolvedAttempt: boolean;
  retryRequired: boolean;
}

export interface RewardResult {
  updatedProfile: GameProfile;
  xpGained: number;
  leveledUp: boolean;
  earnedBadges: Badge[];
  questStatus: "quest-complete" | "training-quest";
}

const rankTitles = [
  "Code Novice",
  "Pattern Scout",
  "Logic Ranger",
  "Algo Adventurer",
  "Puzzle Hunter",
  "Concept Knight",
  "Grand Strategist"
];

function levelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function rankFromLevel(level: number): string {
  const index = Math.min(rankTitles.length - 1, Math.floor((level - 1) / 2));
  return rankTitles[index];
}

function todayText(): string {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  const aDate = new Date(`${a}T00:00:00Z`);
  const bDate = new Date(`${b}T00:00:00Z`);
  return Math.round((aDate.getTime() - bDate.getTime()) / 86400000);
}

function addBadge(badges: Badge[], badge: Omit<Badge, "earnedAt">): Badge[] {
  if (badges.some((item) => item.id === badge.id)) {
    return badges;
  }
  return [...badges, { ...badge, earnedAt: new Date().toISOString() }];
}

export function createInitialGameProfile(): GameProfile {
  return {
    studentId: "local",
    xp: 0,
    level: 1,
    rankTitle: rankFromLevel(1),
    topicTitles: {},
    streakDays: 0,
    badges: [],
    questsCompleted: 0,
    highQualitySubmissions: 0,
    perfectConceptMatches: 0
  };
}

export function buildXpBar(xp: number, width = 20): string {
  const progress = xp % 100;
  const filled = Math.round((progress / 100) * width);
  return `[${"#".repeat(filled)}${"-".repeat(width - filled)}] ${progress}/100`;
}

export function getTopicTitle(profile: GameProfile, topicId?: string): string | undefined {
  if (!topicId) {
    return undefined;
  }

  return profile.topicTitles?.[topicId];
}

export function applySubmissionRewards(profile: GameProfile, input: RewardInput): RewardResult {
  const updatedProfile: GameProfile = {
    ...profile,
    topicTitles: { ...(profile.topicTitles ?? {}) },
    badges: [...profile.badges]
  };

  const today = todayText();
  if (!updatedProfile.lastActiveDate) {
    updatedProfile.streakDays = 1;
  } else {
    const gap = diffDays(today, updatedProfile.lastActiveDate);
    if (gap === 0) {
      updatedProfile.streakDays = Math.max(updatedProfile.streakDays, 1);
    } else if (gap === 1) {
      updatedProfile.streakDays += 1;
    } else {
      updatedProfile.streakDays = 1;
    }
  }
  updatedProfile.lastActiveDate = today;

  let xpGained = 10;
  xpGained += Math.round(input.score.finalScore / 5);
  if (input.score.conceptMatchScore >= 80) xpGained += 10;
  if (input.score.qualityScore >= 85) xpGained += 8;
  if (input.score.complexityScore >= 85) xpGained += 5;
  if (input.firstSolvedAttempt) xpGained += 7;
  if (updatedProfile.streakDays >= 3) xpGained += 5;
  if (input.retryRequired) xpGained = Math.max(12, xpGained - 8);

  updatedProfile.xp += xpGained;
  const previousLevel = updatedProfile.level;
  updatedProfile.level = levelFromXp(updatedProfile.xp);
  updatedProfile.rankTitle = rankFromLevel(updatedProfile.level);

  if (!input.retryRequired && input.score.finalScore >= 70) {
    updatedProfile.questsCompleted += 1;
  }
  if (input.score.qualityScore >= 85) {
    updatedProfile.highQualitySubmissions += 1;
  }
  if (input.score.conceptMatchScore === 100) {
    updatedProfile.perfectConceptMatches += 1;
  }

  if (updatedProfile.questsCompleted >= 1) {
    updatedProfile.badges = addBadge(updatedProfile.badges, {
      id: "first-blood",
      name: "First Blood",
      description: "Completed your first quest."
    });
  }
  if (updatedProfile.highQualitySubmissions >= 3) {
    updatedProfile.badges = addBadge(updatedProfile.badges, {
      id: "clean-coder",
      name: "Clean Coder",
      description: "Earned strong code quality three times."
    });
  }
  if (updatedProfile.perfectConceptMatches >= 3) {
    updatedProfile.badges = addBadge(updatedProfile.badges, {
      id: "concept-sniper",
      name: "Concept Sniper",
      description: "Matched the intended concept perfectly three times."
    });
  }
  if (updatedProfile.streakDays >= 3) {
    updatedProfile.badges = addBadge(updatedProfile.badges, {
      id: "streak-spark",
      name: "Streak Spark",
      description: "Maintained a 3-day solving streak."
    });
  }

  return {
    updatedProfile,
    xpGained,
    leveledUp: updatedProfile.level > previousLevel,
    earnedBadges: updatedProfile.badges.filter((badge) => !profile.badges.some((oldBadge) => oldBadge.id === badge.id)),
    questStatus: input.retryRequired ? "training-quest" : "quest-complete"
  };
}
