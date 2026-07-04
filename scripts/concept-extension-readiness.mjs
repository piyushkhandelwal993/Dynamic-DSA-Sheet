import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const { topicOrder, topicPacks } = require(path.join(root, "dist", "data", "topics", "index.js"));
const { getConceptExpectation } = require(path.join(root, "dist", "services", "analysis-engine", "expectations.js"));

const curatedTopics = new Set(["arrays", "bit-manipulation"]);

function parseArgs(argv) {
  const options = {
    topic: null,
    concept: null,
    strict: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--topic") {
      options.topic = argv[index + 1] ?? null;
      index += 1;
    } else if (value === "--concept") {
      options.concept = argv[index + 1] ?? null;
      index += 1;
    } else if (value === "--strict") {
      options.strict = true;
    }
  }

  return options;
}

function unique(values) {
  return Array.from(new Set(values));
}

function validateTopic(topicId, pack, options) {
  const strict = options.strict || Boolean(options.topic) || curatedTopics.has(topicId);
  const repoAudit = !options.topic && !options.strict;
  const errors = [];
  const warnings = [];
  const concepts = pack.concepts;
  const problems = pack.problems;
  const problemIds = new Set(problems.map((problem) => problem.id));
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const filteredConcepts = options.concept
    ? concepts.filter((concept) => concept.id === options.concept)
    : concepts;

  if (options.concept && filteredConcepts.length === 0) {
    errors.push(`Concept '${options.concept}' does not exist in topic '${topicId}'.`);
  }

    if (strict) {
      const ordered = concepts.filter((concept) => typeof concept.progressionOrder === "number");
      if (ordered.length !== concepts.length) {
        errors.push(`Topic '${topicId}' is missing progressionOrder on ${concepts.length - ordered.length} concepts.`);
    }
    const orders = ordered.map((concept) => concept.progressionOrder);
    const duplicateOrders = unique(orders.filter((order, index) => orders.indexOf(order) !== index));
    if (duplicateOrders.length > 0) {
      errors.push(`Topic '${topicId}' has duplicate progressionOrder values: ${duplicateOrders.join(", ")}.`);
    }
  }

  for (const concept of filteredConcepts) {
    const conceptProblems = problems.filter((problem) => problem.expectedConcepts.includes(concept.id));
    const milestoneProblems = problems.filter((problem) => problem.independenceMilestoneFor?.includes(concept.id));
    const introduceProblems = conceptProblems.filter((problem) => problem.learningRole === "introduce");
    const reinforceProblems = conceptProblems.filter((problem) => problem.learningRole === "reinforce");
    const masteryProblems = conceptProblems.filter((problem) => problem.learningRole === "mastery");
    const expectation = getConceptExpectation(conceptProblems[0]?.id ?? "", concept.id);

    if (conceptProblems.length === 0) {
      errors.push(`[${topicId}] Concept '${concept.id}' is not attached to any expectedConcepts problem.`);
      continue;
    }

    if (strict && typeof concept.progressionOrder !== "number") {
      errors.push(`[${topicId}] Concept '${concept.id}' is missing progressionOrder.`);
    }

    if (strict && !Array.isArray(concept.dependsOn)) {
      errors.push(`[${topicId}] Concept '${concept.id}' is missing dependsOn.`);
    }

    const dependsOn = Array.isArray(concept.dependsOn) ? concept.dependsOn : [];
    dependsOn.forEach((dependencyId) => {
      if (!conceptIds.has(dependencyId)) {
        errors.push(`[${topicId}] Concept '${concept.id}' depends on unknown concept '${dependencyId}'.`);
      }
      const dependency = concepts.find((candidate) => candidate.id === dependencyId);
      if (
        strict &&
        typeof concept.progressionOrder === "number" &&
        typeof dependency?.progressionOrder === "number" &&
        dependency.progressionOrder >= concept.progressionOrder
      ) {
        errors.push(
          `[${topicId}] Concept '${concept.id}' depends on '${dependencyId}' but progressionOrder is not lower.`
        );
      }
    });

    if (!expectation) {
      errors.push(`[${topicId}] Concept '${concept.id}' has no analyzer expectation.`);
    }

    if (!Array.isArray(concept.practiceProblems) || concept.practiceProblems.length === 0) {
      errors.push(`[${topicId}] Concept '${concept.id}' has no practiceProblems.`);
    } else {
      concept.practiceProblems.forEach((problemId) => {
        if (!problemIds.has(problemId)) {
          errors.push(`[${topicId}] Concept '${concept.id}' references unknown practice problem '${problemId}'.`);
          return;
        }
        const problem = problems.find((candidate) => candidate.id === problemId);
        if (
          problem &&
          !problem.expectedConcepts.includes(concept.id) &&
          !problem.independenceMilestoneFor?.includes(concept.id)
        ) {
          (strict ? errors : warnings).push(
            `[${topicId}] Practice problem '${problemId}' does not teach or milestone concept '${concept.id}'.`
          );
        }
      });
    }

    const conceptPrimaryProblems = conceptProblems.filter((problem) => problem.expectedConcepts[0] === concept.id);
    if (strict && introduceProblems.length === 0 && conceptPrimaryProblems.length === 0) {
      warnings.push(`[${topicId}] Concept '${concept.id}' has no primary teaching problem yet.`);
    }

    if (strict && introduceProblems.length === 0 && conceptPrimaryProblems.length > 0) {
      warnings.push(`[${topicId}] Concept '${concept.id}' has no explicit introduce problem yet.`);
    }

    if (strict && reinforceProblems.length === 0 && masteryProblems.length === 0 && milestoneProblems.length === 0) {
      warnings.push(`[${topicId}] Concept '${concept.id}' has no reinforce/mastery follow-up yet.`);
    }

    conceptProblems.forEach((problem) => {
      if (!problem.learningRole) {
        (strict && !repoAudit ? errors : warnings).push(
          `[${topicId}] Problem '${problem.id}' is missing learningRole for concept '${concept.id}'.`
        );
      }
    });
  }

  return { errors, warnings };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const selectedTopicIds = options.topic ? [options.topic] : topicOrder;

  if (options.concept && !options.topic) {
    throw new Error("--concept requires --topic.");
  }

  const allErrors = [];
  const allWarnings = [];
  const validatedTopics = [];

  selectedTopicIds.forEach((topicId) => {
    const pack = topicPacks[topicId];
    assert.ok(pack, `Missing topic pack: ${topicId}`);
    const result = validateTopic(topicId, pack, options);
    validatedTopics.push(topicId);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  console.log("Concept extension readiness");
  console.log(`Topics checked: ${validatedTopics.join(", ")}`);
  if (options.concept) {
    console.log(`Concept checked: ${options.concept}`);
  }
  console.log(`Mode: ${options.strict || options.topic ? "strict" : "repo-audit"}`);
  console.log("");

  if (allWarnings.length > 0) {
    console.log("Warnings:");
    allWarnings.forEach((warning) => console.log(`- ${warning}`));
    console.log("");
  }

  if (allErrors.length > 0) {
    console.log("Errors:");
    allErrors.forEach((error) => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("All concept extension checks passed.");
}

main();
