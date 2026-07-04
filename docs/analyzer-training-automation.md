# Analyzer Training Automation

This workflow helps DSA Sheet improve the rule-based analyzer safely over time.

The loop is:

1. Generate prompts for a problem.
2. Ask ChatGPT or another model to produce code candidates.
3. Import those candidates into the repo.
4. Evaluate them with the real execution engine and analyzer.
5. Review only the suspicious cases.
6. Later convert approved reviewed cases into benchmark fixtures.

## Phase 1 scripts

### 1. Generate prompts

```bash
npm run training:prompts -- --problem arr-004
```

Or for a topic:

```bash
npm run training:prompts -- --topic arrays
```

Outputs prompt JSON files into:

- `training/prompts/`

Each prompt file contains:

- problem metadata
- language
- practice mode
- a ready-to-copy prompt

### 2. Import generated candidates

Prepare a JSON file with either:

- a single candidate object
- or an array of candidate objects

Minimal example:

```json
[
  {
    "problemId": "arr-004",
    "language": "java",
    "practiceMode": "beginner",
    "candidateType": "correct-optimal",
    "label": "one-pass-enhanced-for",
    "code": "class Solution { public int secondLargest(int[] nums) { return 0; } }",
    "notes": "Example only"
  }
]
```

Import it:

```bash
npm run training:import -- --input /absolute/path/to/candidates.json
```

Outputs normalized candidate files into:

- `training/generated/<problemId>/`

### 3. Evaluate generated candidates

```bash
npm run training:evaluate
```

Optional filters:

```bash
npm run training:evaluate -- --problem arr-004
npm run training:evaluate -- --candidate cand_123456789abc
```

Outputs:

- evaluated results: `training/evaluated/<problemId>/`
- suspicious review cases: `training/review-queue/<problemId>/`

## What gets flagged as suspicious

Phase 1 flags candidates when they look useful for analyzer improvement, including:

- passed all tests but concept match is still low
- passed all tests but expected concepts are missing
- failed tests but concept score is unexpectedly high
- passed tests but score is too low for progression
- hardcoded candidates that scored too strongly
- candidates labeled correct that failed execution

## Review queue shape

Each flagged file contains:

- candidate metadata
- execution result
- analyzer facts and concepts
- suspicious reasons
- reviewer fields to fill later:
  - `reviewerNotes`
  - `resolution`
  - `expectedFacts`
  - `forbiddenFacts`

## Recommended workflow

1. Start with a small batch of high-value problems.
2. Generate 8 to 12 candidates per problem.
3. Review only the suspicious queue.
4. Convert approved cases into benchmark fixtures in the next phase.

## Suggested first problems

- `arr-003`
- `arr-004`
- `arr-005`
- `bit-003`
- `ll-008`

## Next phase

Phase 2 should add:

- reviewed-case to fixture conversion
- concept coverage reports
- CI regression gates from reviewed cases
