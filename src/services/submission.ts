import fs from "fs";
import { AnalysisResult, ConceptDetectionResult, ExecutionResult, ExplainableAnalysisFeedback, PracticeMode, Problem, ProblemProgress, ProgrammingLanguage, RecommendationResult, ScoreBreakdown } from "../types";
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
import { effectiveProblemForPracticeMode, resolveSubmissionPath } from "./workspace";
import { runJavaSubmission } from "./javaRunner";
import { runCppSubmission } from "./cppRunner";
import { analyzeFileForProblem } from "./analyzer";
import { analyzeCodeFacts } from "./analysis-engine/analyzeCode";
import { matchProblemExpectations } from "./analysis-engine/matcher";
import { buildExplainableFeedback } from "./analysis-engine/feedback";
import { scoreSubmissionFromFacts } from "./analysis-engine/factScoring";
import { chooseRevisionDays, buildRevisionDate } from "./revision";
import { isNonBitwiseFoundationSolve } from "./approachRules";
import { recommendAfterSubmission } from "./recommendation";
import { clearsMasteryGate, isProblemSolvedState } from "./progressionState";
import { updateSkillProfileFromSubmission } from "./skillProfile";
import { applySubmissionRewards, RewardResult } from "./game";

export interface SubmissionOutcome {
  problem: Problem;
  resolvedPath: string;
  execution: ExecutionResult;
  analysis: AnalysisResult;
  detection: ConceptDetectionResult;
  score: ScoreBreakdown;
  analysisFeedback: ExplainableAnalysisFeedback;
  recommendation: RecommendationResult;
  rewardResult: RewardResult;
  acceptedByExecution: boolean;
  masteredSubmission: boolean;
  solvedByExecution: boolean;
  revisionDays: number;
}

export function submitProblemSolution(
  problemId: string,
  filePath?: string,
  language: ProgrammingLanguage = "java",
  practiceMode: PracticeMode = "beginner"
): SubmissionOutcome {
  const catalogProblem = getProblemById(problemId);
  if (!catalogProblem) {
    throw new Error(`Problem not found: ${problemId}`);
  }
  const problem = effectiveProblemForPracticeMode(catalogProblem, practiceMode);

  const resolvedPath = resolveSubmissionPath(catalogProblem, filePath, language, practiceMode);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`${language === "cpp" ? "C++" : "Java"} file not found: ${resolvedPath}.`);
  }

  copySubmission(problemId, resolvedPath);

  const execution = language === "cpp" ? runCppSubmission(problem, resolvedPath) : runJavaSubmission(problem, resolvedPath);
  const facts = analyzeCodeFacts(language, fs.readFileSync(resolvedPath, "utf-8"));
  const analysis = analyzeFileForProblem(problem, resolvedPath, language);
  const factExpectation = matchProblemExpectations(problem, facts);
  const detection = factExpectation.detection;
  const score = scoreSubmissionFromFacts(problem, facts, factExpectation, execution);
  const analysisFeedback = buildExplainableFeedback(problem, facts, factExpectation, score, execution);

  const progress = getProgress();
  const current = progress.problems[problemId] ?? {
    problemId,
    status: "pending" as const,
    attempts: 0,
    bestScore: 0
  };
  const solutionMode = problem.solutionMode ?? "complete-program";
  const previouslyCompletedModes = current.completedSolutionModes ?? [];

  const passedAllTests = execution.usedTestCases && execution.compileSucceeded && execution.passedCount === execution.totalCount;
  const solvedByExecution = execution.usedTestCases ? passedAllTests : score.finalScore >= 70;
  const improvedSolvedSubmission =
    isProblemSolvedState(current) &&
    score.finalScore > current.bestScore;
  const revisionDays = chooseRevisionDays(score.finalScore);

  const nextProgressEntry: ProblemProgress = {
    ...current,
    status: isProblemSolvedState(current) ? "solved" : "submitted",
    attempts: current.attempts + 1,
    lastScore: score.finalScore,
    bestScore: Math.max(current.bestScore, score.finalScore),
    lastSubmittedAt: new Date().toISOString(),
    completedAt: current.completedAt,
    nextRevisionDate: buildRevisionDate(revisionDays),
    analysisSummary: [...analysis.detected, ...analysis.warnings],
    approachTags: isNonBitwiseFoundationSolve(problem, analysis) ? ["non-bitwise-foundation"] : [],
    retryRequired: false,
    retryConceptIds: [],
    retryReason: undefined,
    bestImplementationScore: Math.max(
      current.bestImplementationScore ?? 0,
      Math.min(score.finalScore, problem.solutionMode === "guided-function" ? 60 : problem.solutionMode === "function" ? 72 : problem.solutionMode === "partial-program" ? 85 : 100)
    ),
    completedSolutionModes: current.completedSolutionModes ?? []
  };
  progress.problems[problemId] = nextProgressEntry;

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

  const masteredSubmission = solvedByExecution && clearsMasteryGate(score, Boolean(progress.problems[problemId].retryRequired));
  const newSolveMilestone = masteredSubmission && !previouslyCompletedModes.includes(solutionMode);
  progress.problems[problemId].status = masteredSubmission || isProblemSolvedState(current) ? "solved" : "submitted";
  progress.problems[problemId].completedAt = newSolveMilestone ? new Date().toISOString() : current.completedAt;
  progress.problems[problemId].completedSolutionModes = newSolveMilestone
    ? Array.from(new Set([...previouslyCompletedModes, solutionMode]))
    : current.completedSolutionModes ?? [];
  saveProgress(progress);

  const updatedSkillProfile = updateSkillProfileFromSubmission(skillProfile, problem, detection, score, analysis);
  saveSkillProfile(updatedSkillProfile);

  const rewardResult = applySubmissionRewards(getGameProfile(), {
    problemId,
    score,
    firstSolvedAttempt: current.attempts === 0 && solvedByExecution,
    retryRequired: Boolean(progress.problems[problemId].retryRequired),
    solvedByExecution: masteredSubmission,
    newSolveMilestone,
    improvedSolvedSubmission: masteredSubmission && improvedSolvedSubmission,
    previousBestScore: current.bestScore
  });
  saveGameProfile(rewardResult.updatedProfile);

  return {
    problem,
    resolvedPath,
    execution,
    analysis,
    detection,
    score,
    analysisFeedback,
    recommendation,
    rewardResult,
    acceptedByExecution: solvedByExecution,
    masteredSubmission,
    solvedByExecution: masteredSubmission,
    revisionDays
  };
}
