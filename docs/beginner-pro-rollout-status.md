# Beginner / Pro Rollout Status

This document is the restart checkpoint for the Beginner + Pro rollout.

Use it to resume work without depending on chat history.

## Current Checkpoint

Last verified on: `2026-07-01`

- total problems: `205`
- Beginner-ready problems: `68`
- missing Beginner-mode coverage: `137`
- Pro-ready problems: `205`

## Topic Status

- Bit Manipulation: `40 / 40` Beginner-ready
- Arrays: `17 / 30` Beginner-ready
- Trees: `2 / 15` Beginner-ready
- Binary Search: `1 / 12` Beginner-ready
- Stack: `1 / 30` Beginner-ready
- Linked List: `1 / 16` Beginner-ready
- Queue: `1 / 10` Beginner-ready
- Recursion: `1 / 13` Beginner-ready
- Graphs: `1 / 24` Beginner-ready

## What Is Done

- Bit Manipulation is fully complete for both modes.
- Beginner mode now supports scalar, pair, array, array-return, nested-list, matrix-input, and several bit-specific driver families.
- Pro mode remains universal across the catalog.
- Focused Java/C++/workspace regression suite is green.

## Latest Verification

These commands were the last known-good checkpoint:

```bash
npm run build
env DSA_SHEET_HOME=/tmp/dsa-sheet-bundled-tests-13 node --test dist/tests/java-runner.test.js dist/tests/cpp-runner.test.js dist/tests/workspace.test.js
node scripts/audit-beginner-pro-coverage.mjs
```

Latest focused test result:

- `70 / 70` passing

## Driver Families Currently Supported

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
- `bit-binary-string`
- `bit-odd-even`
- `bit-check`
- `bit-count-set-bits`
- `bit-count-set-bits-kernighan`
- `bit-set`
- `bit-clear`
- `bit-toggle`
- `bit-check-right-shift`
- `bit-power-of-two`
- `bit-xor-1-to-n`
- `bit-single-number`
- `bit-two-unique-numbers`
- `bit-missing-number`
- `bit-decode-xored-array`
- `bit-invert-all`
- `bit-base10-complement`
- `bit-power-of-four`
- `bit-count-bits-dp`
- `bit-count-odd-array`
- `bit-swap-two-numbers`
- `bit-clear-rightmost-set-bit`
- `bit-set-query-batch`
- `bit-toggle-range`
- `bit-subset-sum-count`
- `bit-generate-subsets`
- `bit-assignment-mask-count`
- `bit-reverse-bits`
- `bit-max-xor-pair`
- `bit-range-bitwise-and`
- `bit-sum-without-plus`
- `bit-hamming-distance`
- `bit-min-bit-flips`
- `recursion-factorial`
- `graph-bfs`
- `dp-fibonacci`

## Recommended Next Topic

Next recommended rollout target: `Binary Search`

Why:

- it has only `12` total problems
- it is smaller than Arrays
- it gives another “fully complete topic” quickly
- it should reuse several scalar / array / boundary driver patterns cleanly

## Resume Workflow

Whenever work resumes, start with these steps:

1. Run build.
2. Run the focused Java/C++/workspace test suite.
3. Run the audit script.
4. Confirm the next target topic from this file.
5. Convert the next topic in reusable driver batches, not one-off problem hacks.

## Resume Prompt

When restarting, this is the minimal context:

- Bit Manipulation is fully complete: `40 / 40`
- overall Beginner-ready coverage is `68 / 205`
- focused suite last known green: `70 / 70`
- next target topic: `Binary Search`

## Notes

- Keep [beginner-pro-driver-roadmap.md](/Users/piyushkhandelwal/Documents/dsa-sheet/docs/beginner-pro-driver-roadmap.md) as the architecture/strategy doc.
- Keep this file as the operational checkpoint.
