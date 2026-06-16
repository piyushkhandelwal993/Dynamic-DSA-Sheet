import fs from "fs";
import { AnalysisResult, ConceptDetectionResult, ExecutionResult, Problem, RecommendationResult, ScoreBreakdown } from "../types";
import {
  copySubmission,
  getGameProfile,
  getProblemById,
  getProgress,
  getSkillProfile,
  getTopicIdForProblem,
  getTopicProblems,
  saveGameProfile,
  saveProgress,
  saveSkillProfile
} from "./storage";
import { resolveSubmissionPath } from "./workspace";
import { runJavaSubmission } from "./javaRunner";
import { analyzeJavaFileForProblem } from "./analyzer";
import { detectConceptsForTopic } from "./conceptDetector";
import { scoreSubmission } from "./scoring";
import { chooseRevisionDays, buildRevisionDate } from "./revision";
import { isNonBitwiseFoundationSolve } from "./approachRules";
import { recommendAfterSubmission } from "./recommendation";
import { updateSkillProfileFromSubmission } from "./skillProfile";
import { applySubmissionRewards, RewardResult } from "./game";

export interface SubmissionOutcome {
  problem: Problem;
  resolvedPath: string;
  execution: ExecutionResult;
  analysis: AnalysisResult;
  detection: ConceptDetectionResult;
  score: ScoreBreakdown;
  recommendation: RecommendationResult;
  rewardResult: RewardResult;
  solvedByExecution: boolean;
  revisionDays: number;
}

export function submitProblemSolution(problemId: string, filePath?: string): SubmissionOutcome {
  const problem = getProblemById(problemId);
  if (!problem) {
    throw new Error(`Problem not found: ${problemId}`);
  }

  const resolvedPath = resolveSubmissionPath(problem, filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Java file not found: ${resolvedPath}. Run dsa start ${problemId} first or pass a custom file path.`);
  }

  copySubmission(problemId, resolvedPath);

  const execution = runJavaSubmission(problem, resolvedPath);
  const analysis = analyzeJavaFileForProblem(problem, resolvedPath);
  const detection = detectConceptsForTopic(problem, analysis);
  const score = scoreSubmission(problem, analysis, detection, execution);

  const progress = getProgress();
  const current = progress.problems[problemId] ?? {
    problemId,
    status: "pending" as const,
    attempts: 0,
    bestScore: 0
  };

  const passedAllTests = execution.usedTestCases && execution.compileSucceeded && execution.passedCount === execution.totalCount;
  const solvedByExecution = execution.usedTestCases ? passedAllTests : score.finalScore >= 70;
  const revisionDays = chooseRevisionDays(score.finalScore);

  progress.problems[problemId] = {
    ...current,
    status: solvedByExecution ? "solved" : "submitted",
    attempts: current.attempts + 1,
    lastScore: score.finalScore,
    bestScore: Math.max(current.bestScore, score.finalScore),
    lastSubmittedAt: new Date().toISOString(),
    completedAt: solvedByExecution ? new Date().toISOString() : current.completedAt,
    nextRevisionDate: buildRevisionDate(revisionDays),
    analysisSummary: [...analysis.detected, ...analysis.warnings],
    approachTags: isNonBitwiseFoundationSolve(problem, analysis) ? ["non-bitwise-foundation"] : [],
    retryRequired: false,
    retryConceptIds: [],
    retryReason: undefined
  };

  const skillProfile = getSkillProfile();
  const topicId = getTopicIdForProblem(problem.id);
  const topicProblems = getTopicProblems(topicId);
  const recommendation = recommendAfterSubmission(problem, topicProblems, progress, skillProfile, score, analysis);
  progress.problems[problemId].retryRequired = recommendation.type === "revise-prerequisite" && recommendation.suggestedProblemIds[0] === problem.id;
  progress.problems[problemId].retryConceptIds = recommendation.conceptIds;
  progress.problems[problemId].retryReason = recommendation.reasons[0];
  if (progress.problems[problemId].retryRequired) {
    progress.problems[problemId].approachTags = Array.from(
      new Set([...(progress.problems[problemId].approachTags ?? []), "retry-required"])
    );
  } else {
    progress.problems[problemId].approachTags = [];
  }
  saveProgress(progress);

  const updatedSkillProfile = updateSkillProfileFromSubmission(skillProfile, problem, detection, score, analysis);
  saveSkillProfile(updatedSkillProfile);

  const rewardResult = applySubmissionRewards(getGameProfile(), {
    problemId,
    score,
    firstSolvedAttempt: current.attempts === 0 && solvedByExecution,
    retryRequired: Boolean(progress.problems[problemId].retryRequired)
  });
  saveGameProfile(rewardResult.updatedProfile);

  return {
    problem,
    resolvedPath,
    execution,
    analysis,
    detection,
    score,
    recommendation,
    rewardResult,
    solvedByExecution,
    revisionDays
  };
}
