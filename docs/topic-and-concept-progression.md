# Topic And Concept Progression

This document is the human-readable reference for learning order in DSA Sheet.

It separates two levels of ordering:

- `Topic order`: the global progression across DSA areas
- `Concept order`: the internal teaching ladder inside each topic

Important rule:

- We do not rely on raw problem file order.
- We rely on concept progression, concept dependencies, learner state, and problem learning role.

## Global Topic Order

Canonical source:

- [src/data/topics/index.ts](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/index.ts)

Current topic order:

1. Arrays
2. Bit Manipulation
3. Linked List
4. Stack
5. Queue
6. Recursion
7. Binary Search
8. Trees
9. Graphs
10. Dynamic Programming

## Curation Status

`Curated` means the topic has explicit concept order and dependencies in content metadata.

`Roadmap only` means the topic has a roadmap order, but the fine-grained concept ladder is not yet fully curated.

| Topic | Status |
|---|---|
| Arrays | Curated |
| Bit Manipulation | Curated |
| Linked List | Curated |
| Stack | Curated |
| Queue | Curated |
| Recursion | Curated |
| Binary Search | Curated |
| Trees | Roadmap only |
| Graphs | Roadmap only |
| Dynamic Programming | Roadmap only |

## Curated Topics

### Arrays

Canonical sources:

- [src/data/topics/arrays/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/arrays/concepts.json)
- [src/data/topics/arrays/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/arrays/problems.json)

Concept order:

1. `array-traversal`
2. `sorted-check`
3. `min-max-array`
4. `reverse-array`
5. `second-largest`
6. `frequency-counting`
7. `prefix-sum`
8. `stock-profit`
9. `two-pointers`
10. `in-place-array-update`
11. `kadane-algorithm`
12. `sliding-window`

Concept dependencies:

- `array-traversal`: none
- `sorted-check`: `array-traversal`
- `min-max-array`: `array-traversal`
- `reverse-array`: `array-traversal`
- `second-largest`: `min-max-array`
- `frequency-counting`: `array-traversal`
- `prefix-sum`: `array-traversal`
- `stock-profit`: `min-max-array`
- `two-pointers`: `sorted-check`, `reverse-array`
- `in-place-array-update`: `two-pointers`
- `kadane-algorithm`: `array-traversal`, `min-max-array`
- `sliding-window`: `prefix-sum`, `two-pointers`

Typical learning shape:

- Introduce traversal and simple comparison
- Build min/max and reversal confidence
- Move into frequency and prefix ideas
- Unlock two pointers and in-place updates
- Finish with Kadane and sliding window style problems

### Bit Manipulation

Canonical sources:

- [src/data/topics/bit-manipulation/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/bit-manipulation/concepts.json)
- [src/data/topics/bit-manipulation/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/bit-manipulation/problems.json)

Concept order:

1. `binary-representation`
2. `bitwise-and`
3. `odd-even-check`
4. `left-shift`
5. `check-ith-bit`
6. `bitwise-or`
7. `set-ith-bit`
8. `bitwise-not`
9. `clear-ith-bit`
10. `bitwise-xor`
11. `toggle-ith-bit`
12. `right-shift`
13. `count-set-bits`
14. `brian-kernighan`
15. `power-of-two`
16. `xor-tricks`
17. `single-number`
18. `missing-number`
19. `two-unique-numbers`
20. `subsets-using-bits`
21. `bitmasking-basics`

Concept dependencies:

- `binary-representation`: none
- `bitwise-and`: `binary-representation`
- `odd-even-check`: `binary-representation`, `bitwise-and`
- `left-shift`: `binary-representation`
- `check-ith-bit`: `bitwise-and`, `left-shift`
- `bitwise-or`: `binary-representation`
- `set-ith-bit`: `check-ith-bit`, `bitwise-or`
- `bitwise-not`: `binary-representation`
- `clear-ith-bit`: `set-ith-bit`, `bitwise-not`, `bitwise-and`
- `bitwise-xor`: `binary-representation`
- `toggle-ith-bit`: `check-ith-bit`, `bitwise-xor`
- `right-shift`: `binary-representation`, `check-ith-bit`
- `count-set-bits`: `odd-even-check`, `right-shift`, `bitwise-and`
- `brian-kernighan`: `count-set-bits`, `bitwise-and`
- `power-of-two`: `count-set-bits`, `brian-kernighan`
- `xor-tricks`: `bitwise-xor`
- `single-number`: `xor-tricks`
- `missing-number`: `xor-tricks`
- `two-unique-numbers`: `single-number`, `bitwise-and`
- `subsets-using-bits`: `check-ith-bit`, `left-shift`
- `bitmasking-basics`: `subsets-using-bits`, `set-ith-bit`, `check-ith-bit`

Typical learning shape:

- Learn how bits are represented
- Build operator fluency: AND, shifts, OR, NOT, XOR
- Target individual bits safely
- Count and classify set bits
- Use XOR tricks for unique and missing number patterns
- Finish with subset enumeration and bitmask state thinking

### Linked List

Canonical sources:

- [src/data/topics/linked-list/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/linked-list/concepts.json)
- [src/data/topics/linked-list/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/linked-list/problems.json)

Concept order:

1. `ll-traversal`
2. `ll-length`
3. `ll-search`
4. `ll-head-tail-update`
5. `ll-node-delete`
6. `ll-reverse`
7. `ll-fast-slow`
8. `ll-middle`
9. `ll-cycle-detection`
10. `ll-merge-sorted`
11. `ll-remove-duplicates`

Concept dependencies:

- `ll-traversal`: none
- `ll-length`: `ll-traversal`
- `ll-search`: `ll-traversal`
- `ll-head-tail-update`: `ll-traversal`
- `ll-node-delete`: `ll-head-tail-update`
- `ll-reverse`: `ll-traversal`, `ll-head-tail-update`
- `ll-fast-slow`: `ll-traversal`
- `ll-middle`: `ll-fast-slow`
- `ll-cycle-detection`: `ll-fast-slow`
- `ll-merge-sorted`: `ll-traversal`, `ll-head-tail-update`
- `ll-remove-duplicates`: `ll-traversal`, `ll-merge-sorted`

Typical learning shape:

- Start with pointer walking, counting, and searching
- Move into safe head and tail updates
- Learn deletion and in-place pointer rewiring
- Unlock fast-slow pointer thinking for middle and cycle tasks
- Finish with multi-list merge logic and cleanup patterns

### Stack

Canonical sources:

- [src/data/topics/stack/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/stack/concepts.json)
- [src/data/topics/stack/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/stack/problems.json)

Concept order:

1. `stack-intro`
2. `stack-array-implementation`
3. `stack-operations`
4. `reverse-using-stack`
5. `balanced-parentheses`
6. `stack-simulation`
7. `postfix-evaluation`
8. `min-stack`
9. `monotonic-stack`
10. `stock-span`
11. `next-greater-element`
12. `previous-smaller-element`
13. `expression-conversion`
14. `largest-rectangle-histogram`

Concept dependencies:

- `stack-intro`: none
- `stack-array-implementation`: `stack-intro`
- `stack-operations`: `stack-intro`, `stack-array-implementation`
- `reverse-using-stack`: `stack-operations`
- `balanced-parentheses`: `stack-operations`
- `stack-simulation`: `stack-operations`
- `postfix-evaluation`: `stack-operations`
- `min-stack`: `stack-operations`
- `monotonic-stack`: `stack-operations`
- `stock-span`: `monotonic-stack`
- `next-greater-element`: `monotonic-stack`
- `previous-smaller-element`: `monotonic-stack`
- `expression-conversion`: `balanced-parentheses`, `postfix-evaluation`
- `largest-rectangle-histogram`: `monotonic-stack`, `previous-smaller-element`

Typical learning shape:

- Start with LIFO behavior and constant-time push/pop/peek
- Use simple reversal and bracket matching to build stack instinct
- Move into simulation-style problems where stack state changes drive the answer
- Introduce evaluation and conversion of expressions
- Unlock monotonic-stack reasoning for spans and nearest-element problems
- Finish with histogram-style area optimization and advanced applications

### Queue

Canonical sources:

- [src/data/topics/queue/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/queue/concepts.json)
- [src/data/topics/queue/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/queue/problems.json)

Concept order:

1. `queue-intro`
2. `array-queue-implementation`
3. `queue-operations`
4. `circular-queue`
5. `queue-simulation`
6. `generate-binary-numbers`
7. `bfs-on-grid`
8. `deque-technique`
9. `sliding-window-queue`
10. `top-k-elements`
11. `task-scheduling-queue`

Concept dependencies:

- `queue-intro`: none
- `array-queue-implementation`: `queue-intro`
- `queue-operations`: `queue-intro`, `array-queue-implementation`
- `circular-queue`: `array-queue-implementation`, `queue-operations`
- `queue-simulation`: `queue-operations`
- `generate-binary-numbers`: `queue-simulation`
- `bfs-on-grid`: `queue-simulation`
- `deque-technique`: `queue-operations`
- `sliding-window-queue`: `deque-technique`
- `top-k-elements`: `queue-intro`
- `task-scheduling-queue`: `queue-simulation`, `top-k-elements`

Typical learning shape:

- Start with FIFO behavior and constant-time enqueue/dequeue
- Add circular reuse and direct simulation confidence
- Use queue layering for generated sequences and BFS-style spread problems
- Introduce deque-based window maintenance for harder linear-time problems
- Finish with heap-backed scheduling and advanced hybrid queue workflows

### Recursion

Canonical sources:

- [src/data/topics/recursion/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/recursion/concepts.json)
- [src/data/topics/recursion/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/recursion/problems.json)

Concept order:

1. `recursion-intro`
2. `base-case`
3. `parameterized-recursion`
4. `functional-recursion`
5. `recursion-on-strings`
6. `tree-recursion`
7. `recursion-on-arrays`
8. `backtracking-basics`
9. `subsequence-generation`
10. `permutations`
11. `memoization`
12. `divide-and-conquer`
13. `recursive-search`

Concept dependencies:

- `recursion-intro`: none
- `base-case`: `recursion-intro`
- `parameterized-recursion`: `recursion-intro`, `base-case`
- `functional-recursion`: `recursion-intro`, `base-case`
- `recursion-on-strings`: `functional-recursion`
- `tree-recursion`: `functional-recursion`
- `recursion-on-arrays`: `functional-recursion`
- `backtracking-basics`: `recursion-intro`, `base-case`
- `subsequence-generation`: `backtracking-basics`
- `permutations`: `backtracking-basics`, `subsequence-generation`
- `memoization`: `tree-recursion`
- `divide-and-conquer`: `recursion-on-arrays`
- `recursive-search`: `backtracking-basics`, `permutations`

Typical learning shape:

- Start by understanding what a recursive call does and why base cases matter
- Build both parameterized and return-based recursion styles
- Apply recursion to strings, number/array ranges, and branching call trees
- Move into backtracking with include/exclude and permutation state management
- Introduce memoization once repeated subproblems are visible
- Finish with divide-and-conquer and full recursive search problems

### Binary Search

Canonical sources:

- [src/data/topics/binary-search/concepts.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/binary-search/concepts.json)
- [src/data/topics/binary-search/problems.json](/Users/piyushkhandelwal/Documents/dsa-sheet/src/data/topics/binary-search/problems.json)

Concept order:

1. `binary-search-intro`
2. `sorted-mid-check`
3. `lower-bound`
4. `upper-bound`
5. `first-last-occurrence`
6. `search-insert-position`
7. `rotated-array-search`
8. `peak-element`
9. `answer-binary-search`
10. `sqrt-binary-search`
11. `capacity-search`
12. `partition-binary-search`

Concept dependencies:

- `binary-search-intro`: none
- `sorted-mid-check`: `binary-search-intro`
- `lower-bound`: `binary-search-intro`, `sorted-mid-check`
- `upper-bound`: `lower-bound`
- `first-last-occurrence`: `lower-bound`, `upper-bound`
- `search-insert-position`: `lower-bound`
- `rotated-array-search`: `sorted-mid-check`
- `peak-element`: `binary-search-intro`
- `answer-binary-search`: `binary-search-intro`
- `sqrt-binary-search`: `answer-binary-search`
- `capacity-search`: `answer-binary-search`
- `partition-binary-search`: `lower-bound`, `capacity-search`

Typical learning shape:

- Start with exact-match binary search on sorted arrays
- Move into left and right boundary searches
- Reuse boundary thinking for occurrence ranges and insertion points
- Introduce modified search logic for rotated arrays and peaks
- Shift from searching arrays to searching numeric answers
- Finish with advanced partition-style binary search

## Roadmap-Only Topics

These topics already have topic-level roadmap order, but their concept ladders are not yet fully curated.

### Linked List

Roadmap:

1. Linked list basics
2. Traversal and length
3. Insertion and deletion
4. Reversal
5. Fast and slow pointers
6. Merge and cleanup

### Stack

Roadmap:

1. Stack basics
2. Stack simulation
3. Balanced brackets
4. Reverse using stack
5. Expression evaluation
6. Min stack
7. Monotonic stack
8. Stock span
9. Next greater and previous smaller
10. Expression conversion
11. Largest rectangle in histogram
12. Advanced stack applications

### Queue

Roadmap:

1. Queue basics
2. Queue simulation
3. Circular queue
4. Generate sequences with queue
5. BFS-style queue
6. Task scheduling
7. Deque techniques
8. Sliding window with deque
9. Priority queue applications
10. Advanced queue applications

### Recursion

Roadmap:

1. What recursion is
2. Base case and recursive case
3. Parameterized recursion
4. Functional recursion
5. Recursion on strings
6. Recursion on arrays
7. Backtracking basics
8. Subsequences and subsets
9. Permutations
10. Memoization
11. Divide and conquer
12. Recursive search problems

### Binary Search

Roadmap:

1. Binary search basics
2. Boundaries and occurrences
3. Search insert position
4. Rotated arrays and peaks
5. Square root and answer search
6. Capacity and feasibility search
7. Advanced binary search

### Trees

Roadmap:

1. Tree basics
2. DFS traversals
3. BFS traversals
4. Tree height and properties
5. BST operations
6. Tree views
7. LCA and paths
8. Tree construction
9. Advanced tree applications

### Graphs

Roadmap:

1. Graph basics
2. Graph traversals
3. Components and cycles
4. Grid traversal
5. Directed acyclic graphs
6. Shortest paths
7. Disjoint set and MST
8. Advanced graph applications

### Dynamic Programming

Roadmap:

1. DP basics
2. 1D DP basics
3. Tabulation basics
4. Grid DP
5. String DP basics
6. Knapsack style DP
7. Sequence DP
8. Advanced DP

## Recommendation Rule

The engine should choose:

1. the next unlocked concept for the learner
2. then the right problem role for that concept:
   - `introduce`
   - `reinforce`
   - `mastery`
3. then personalize within that safe boundary

This keeps the app adaptive without allowing random jumps.

## Next Documentation Updates

As each topic is curated, update this document with:

- explicit concept order
- explicit concept dependencies
- any major introduce/reinforce/mastery patterns worth noting
