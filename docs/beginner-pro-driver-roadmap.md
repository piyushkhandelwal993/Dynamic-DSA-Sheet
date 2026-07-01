# Beginner / Pro Driver Roadmap

This document defines how DSA Sheet reaches the point where:

- every existing problem supports both `Beginner` and `Pro` mode
- new problems can be added by content sync only
- app releases are needed only when a brand-new driver family is introduced

## Current State

Use the audit script to measure coverage:

```bash
node scripts/audit-beginner-pro-coverage.mjs
```

At the time of writing:

- total problems: `205`
- Beginner-ready problems: `29`
- Pro-ready problems: `205`
- missing Beginner-mode coverage: `176`

Pro mode is already universal because the app can always fall back to full-program workspaces.
Beginner mode is the limiting factor because it depends on reusable function harness drivers.

## Current Driver Catalog

These drivers are already implemented in app code:

- `linked-list-length`
- `linked-list-search`
- `linked-list-reverse`
- `array-maximum`
- `array-sorted-check`
- `array-second-largest`
- `array-range-sum`
- `array-highest-frequency`
- `array-max-subarray`
- `array-move-zeroes`
- `array-remove-duplicates`
- `array-longest-sum-k-positive`
- `array-stock-profit`
- `array-product-except-self`
- `array-count-positive`
- `array-running-sum`
- `array-pair-sum-sorted`
- `array-left-rotate-one`
- `array-max-consecutive-ones`
- `array-reverse`
- `tree-height`
- `tree-preorder`
- `stack-balanced-brackets`
- `queue-reverse-first-k`
- `binary-search-exact`
- `bit-check`
- `recursion-factorial`
- `graph-bfs`
- `dp-fibonacci`

Any future problem that fits one of these drivers can already be shipped through content sync only.

## Target Architecture

Each Beginner-mode problem should be content-only and declare:

- `solutionMode`
- `functionContract.functionName`
- `functionContract.javaSignature`
- `functionContract.cppSignature`
- `functionContract.providedTypes`
- `functionContract.driverStrategy`

The app should own all logic for:

- parsing input
- constructing provided helper structures
- invoking the student function
- serializing output
- comparing expected results for Java and C++

## Rule For Future Additions

Adding a new problem should require only content sync when both conditions hold:

1. the problem reuses an existing `driverStrategy`
2. the input/output shape already matches that driver family

An app release is required only when:

- a new driver strategy is introduced
- a new helper structure is required
- a new result serialization rule is needed
- the analyzer/scoring/runtime behavior changes

## Execution Plan

### Phase 1: Audit and Group

Group every missing Beginner-mode problem into a reusable driver family.

The goal is not one driver per problem.
The goal is one driver per interaction shape.

Examples:

- bit integer transform
- bit boolean check
- bit count / single integer return
- array integer return
- array boolean return
- array in-place mutate and print
- array vector return
- linked-list head return
- linked-list boolean detect
- tree integer return
- tree traversal list return
- graph traversal list return
- graph scalar answer
- stack scalar answer
- stack string transform
- queue scalar answer
- recursion scalar return
- DP scalar return

### Phase 2: Build Driver Families

Add the missing families to:

- `src/types/index.ts`
- `src/services/functionHarness.ts`
- `src/tests/workspace.test.ts`

Each driver must support:

- Java template stubs
- C++ template stubs
- Java execution harness
- C++ execution harness

### Phase 3: Convert Existing Problems

For each existing problem that fits a supported driver:

- add `solutionMode: "guided-function"`
- add a `functionContract`

Once converted, that problem becomes Beginner + Pro ready with no further app logic.

### Phase 4: Add Content Validation

Create content validation rules so new problems fail fast when:

- `solutionMode` is scaffolded but `functionContract` is missing
- `driverStrategy` is unknown
- signature shape does not match the driver family

This is what protects the “content sync only” promise.

### Phase 5: Publish Contributor Guidance

Document a short checklist for future authors:

1. choose an existing driver
2. write metadata
3. add official test cases
4. publish content

## Immediate Priority Order

To maximize coverage quickly, implement the next driver families in this order:

1. bit integer transform drivers
2. bit integer return drivers
3. linked-list mutation and boolean drivers
4. binary-search boundary / answer drivers
5. queue scalar and array-return drivers
6. stack scalar and string-transform drivers
7. tree boolean / integer / construction drivers
8. graph scalar and shortest-path drivers
9. recursion array/string/backtracking drivers
10. DP table / sequence / boolean drivers

## Practical Definition Of Done

We can say this system is complete when:

- every current problem is Beginner + Pro ready
- `node scripts/audit-beginner-pro-coverage.mjs` reports zero missing Beginner-mode problems
- adding a normal new problem requires no app code change
- content sync alone is enough for new problem publication
