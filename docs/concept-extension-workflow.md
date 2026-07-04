# Concept Extension Workflow

This document defines how to add a new concept to an existing topic without breaking progression, scoring, or recommendation.

The goal is:

- add new concepts safely
- keep the recommendation engine extendible
- use the training module to improve analyzer recognition
- avoid partial concept rollouts

## Core Principle

Adding a concept has two separate parts:

1. `Content extension`
   - what the concept is
   - where it sits in the topic ladder
   - which problems introduce, reinforce, and test it

2. `Analyzer extension`
   - how the engine recognizes the concept from code
   - how we validate that recognition over time

The training module is mainly for analyzer extension, not for defining the concept ladder itself.

## What Must Exist For A New Concept

Before a new concept is considered ready, it should have:

- a concept entry in the topic `concepts.json`
- explicit `progressionOrder`
- explicit `dependsOn`
- at least one problem that teaches it through `expectedConcepts`
- at least one `introduce` problem
- ideally one follow-up:
  - `reinforce`, or
  - `mastery`, or
  - `independenceMilestoneFor`
- an analyzer expectation in:
  - [src/services/analysis-engine/expectations.ts](/Users/piyushkhandelwal/Documents/dsa-sheet/src/services/analysis-engine/expectations.ts)

## Validation Command

Use:

```bash
npm run audit:concept-extension
```

This runs a repo-wide readiness audit.

For a strict rollout check on one topic:

```bash
npm run audit:concept-extension -- --topic arrays
```

For a strict check on one concept:

```bash
npm run audit:concept-extension -- --topic arrays --concept stock-profit
```

Strict mode is automatically enabled when `--topic` is used.

## Step-By-Step Rollout

### 1. Add the concept to content

Update the topic concept file:

- `src/data/topics/<topic>/concepts.json`

Add:

- `id`
- `name`
- `description`
- `exampleJava`
- `commonMistakes`
- `practiceProblems`
- `progressionOrder`
- `dependsOn`

### 2. Attach the concept to problems

Update:

- `src/data/topics/<topic>/problems.json`

For the relevant problems:

- include the concept in `expectedConcepts`
- make sure `prerequisiteConcepts` reflect unlock logic
- set `learningRole`

Use this pattern:

- first problem: `introduce`
- next problem(s): `reinforce`
- harder or independence check: `mastery`

### 3. Add analyzer expectation

Update:

- [src/services/analysis-engine/expectations.ts](/Users/piyushkhandelwal/Documents/dsa-sheet/src/services/analysis-engine/expectations.ts)

If needed:

- add a concept-level expectation
- add a problem-specific override

This tells the analyzer what evidence counts as successful concept usage.

### 4. Run the concept validator

```bash
npm run audit:concept-extension -- --topic <topic-id> --concept <concept-id>
```

If this fails, do not move to training yet.

### 5. Generate training prompts

Use the training module for the new concept’s problems:

```bash
npm run training:prompts -- --problem <problem-id>
```

or

```bash
npm run training:prompts -- --topic <topic-id>
```

### 6. Import and evaluate candidates

```bash
npm run training:import -- --input /absolute/path/to/candidates.json
npm run training:evaluate -- --problem <problem-id>
```

Review suspicious cases in:

- `training/review-queue/<problem-id>/`

### 7. Fix analyzer gaps

Use reviewed failures to improve:

- fact extraction
- concept expectations
- scoring
- false-positive suppression

Then regenerate regression coverage.

### 8. Generate regressions

```bash
npm run training:generate-tests
```

This keeps the new concept stable after fixes.

### 9. Publish content

When the concept is ready:

- export updated content bundle
- publish content sync assets
- refresh the app content

## Recommended Rollout Policy

When introducing a concept into an already published topic:

1. first add content metadata
2. then validate concept-extension readiness
3. then use training to improve recognition
4. only then publish the content update

This keeps recommendation safer than publishing the concept first and fixing analyzer support later.

## What The Validator Checks

The validator currently checks:

- topic exists
- concept exists
- curated topics have explicit `progressionOrder`
- curated topics have explicit `dependsOn`
- dependencies reference valid concepts
- dependency order is forward-safe
- concept has at least one teaching problem
- concept has analyzer expectation
- practice problem references are valid
- teaching problems have `learningRole`
- strict mode warns when there is no follow-up reinforcement/mastery path

## Current Extendibility Status

We are now ready for a structured concept rollout flow, but not full zero-touch automation.

What is ready:

- content model
- progression metadata
- analyzer expectation system
- training prompt/import/evaluate flow
- reviewed regression generation
- concept extension validator

What still remains manual:

- designing the actual concept dependency ladder
- choosing introduce/reinforce/mastery problems
- reviewing suspicious training candidates
- fixing analyzer rules from training output

## Best Practice

Treat concept addition as:

- `content design`
- then `analyzer training`
- then `publish`

Not the other way around.
