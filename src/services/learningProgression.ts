import { Concept, Problem, ProblemLearningRole, SkillProfile } from "../types";
import { isConceptMastered } from "./skillProfile";

const conceptReadinessThreshold = 60;

export interface TopicConceptProgression {
  orderedConceptIds: string[];
  dependenciesByConcept: Record<string, string[]>;
  firstProblemByConcept: Record<string, string>;
}

function unique(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

function inferConceptOrderFromProblems(problems: Problem[]): string[] {
  const ordered: string[] = [];
  problems.forEach((problem) => {
    const introducedConceptId = problem.expectedConcepts.find((conceptId) => !ordered.includes(conceptId)) ?? problem.expectedConcepts[0];
    if (introducedConceptId && !ordered.includes(introducedConceptId)) {
      ordered.push(introducedConceptId);
    }
  });
  return ordered;
}

function inferConceptDependencies(problems: Problem[]): Record<string, string[]> {
  const dependenciesByConcept: Record<string, string[]> = {};
  problems.forEach((problem) => {
    problem.expectedConcepts.forEach((conceptId) => {
      const current = dependenciesByConcept[conceptId] ?? [];
      dependenciesByConcept[conceptId] = unique([
        ...current,
        ...problem.prerequisiteConcepts.filter((prerequisiteId) => prerequisiteId !== conceptId)
      ]);
    });
  });
  return dependenciesByConcept;
}

export function buildTopicConceptProgression(problems: Problem[], concepts: Concept[] = []): TopicConceptProgression {
  const explicitOrder = concepts
    .filter((concept) => typeof concept.progressionOrder === "number")
    .sort((left, right) => (left.progressionOrder ?? 0) - (right.progressionOrder ?? 0))
    .map((concept) => concept.id);
  const problemOrder = inferConceptOrderFromProblems(problems);
  const conceptListOrder = concepts.map((concept) => concept.id);
  const orderedConceptIds = unique([...explicitOrder, ...problemOrder, ...conceptListOrder]);
  const inferredDependencies = inferConceptDependencies(problems);
  const firstProblemByConcept: Record<string, string> = {};

  problems.forEach((problem) => {
    problem.expectedConcepts.forEach((conceptId) => {
      if (!firstProblemByConcept[conceptId]) {
        firstProblemByConcept[conceptId] = problem.id;
      }
    });
  });
  problems.forEach((problem) => {
    const primaryConceptId = problem.expectedConcepts[0];
    if (primaryConceptId) {
      firstProblemByConcept[primaryConceptId] = firstProblemByConcept[primaryConceptId] ?? problem.id;
    }
  });

  const dependenciesByConcept = Object.fromEntries(
    orderedConceptIds.map((conceptId) => {
      const concept = concepts.find((candidate) => candidate.id === conceptId);
      const hasExplicitDependencies = Array.isArray(concept?.dependsOn);
      const explicitDependencies = concept?.dependsOn?.filter((dependencyId) => dependencyId !== conceptId) ?? [];
      const inferred = inferredDependencies[conceptId] ?? [];
      return [conceptId, hasExplicitDependencies ? unique(explicitDependencies) : unique(inferred)];
    })
  );

  return {
    orderedConceptIds,
    dependenciesByConcept,
    firstProblemByConcept
  };
}

export function isConceptUnlocked(
  conceptId: string,
  progression: TopicConceptProgression,
  skillProfile: SkillProfile
): boolean {
  const dependencies = progression.dependenciesByConcept[conceptId] ?? [];
  return dependencies.every(
    (dependencyId) =>
      isConceptMastered(skillProfile, dependencyId) || (skillProfile.conceptScores[dependencyId] ?? 0) >= conceptReadinessThreshold
  );
}

export function getNextUnlockedConceptId(
  progression: TopicConceptProgression,
  skillProfile: SkillProfile,
  preferredConceptIds: string[] = []
): string | undefined {
  const preferred = preferredConceptIds.find(
    (conceptId) =>
      progression.orderedConceptIds.includes(conceptId) &&
      !isConceptMastered(skillProfile, conceptId) &&
      isConceptUnlocked(conceptId, progression, skillProfile)
  );
  if (preferred) {
    return preferred;
  }

  return progression.orderedConceptIds.find(
    (conceptId) => !isConceptMastered(skillProfile, conceptId) && isConceptUnlocked(conceptId, progression, skillProfile)
  );
}

export function getProblemLearningRole(
  problem: Problem,
  targetConceptId: string | undefined,
  progression: TopicConceptProgression
): ProblemLearningRole {
  if (problem.learningRole) {
    return problem.learningRole;
  }

  if (targetConceptId && problem.independenceMilestoneFor?.includes(targetConceptId)) {
    return "mastery";
  }

  if (problem.poolRole === "review" || problem.poolRole === "practice") {
    return "reinforce";
  }

  if (problem.poolRole === "challenge" || problem.difficulty === "Hard") {
    return "mastery";
  }

  if (targetConceptId && progression.firstProblemByConcept[targetConceptId] === problem.id) {
    return "introduce";
  }

  return "reinforce";
}

export function learningRolePriority(
  role: ProblemLearningRole,
  conceptId: string | undefined,
  skillProfile: SkillProfile
): number {
  if (!conceptId) {
    return role === "introduce" ? 0 : role === "reinforce" ? 1 : 2;
  }

  const score = skillProfile.conceptScores[conceptId] ?? 0;
  const attempts = skillProfile.conceptAttempts[conceptId] ?? 0;
  const order =
    skillProfile.weakConcepts.includes(conceptId)
      ? ["reinforce", "introduce", "mastery"]
      : skillProfile.strongConcepts.includes(conceptId)
        ? ["mastery", "reinforce", "introduce"]
        : attempts === 0 || score < 40
      ? ["introduce", "reinforce", "mastery"]
        : score < 75
          ? ["reinforce", "introduce", "mastery"]
          : ["mastery", "reinforce", "introduce"];
  return order.indexOf(role);
}
