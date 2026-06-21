export type FactExpectation =
  | { fact: string }
  | { allOf: FactExpectation[] }
  | { anyOf: FactExpectation[] };

const fact = (id: string): FactExpectation => ({ fact: id });
const allOf = (...rules: FactExpectation[]): FactExpectation => ({ allOf: rules });
const anyOf = (...rules: FactExpectation[]): FactExpectation => ({ anyOf: rules });

export const conceptExpectations: Record<string, FactExpectation> = {
  "array-traversal": allOf(fact("array"), fact("loop")),
  "min-max-array": fact("min-max-tracking"),
  "sorted-check": fact("adjacent-order-check"),
  "reverse-array": anyOf(fact("array-reversal"), allOf(fact("two-pointers"), fact("in-place-array-update"))),
  "second-largest": fact("second-extreme-tracking"),
  "frequency-counting": fact("frequency-counting"),
  "prefix-sum": anyOf(fact("prefix-sum"), fact("prefix-product")),
  "kadane-algorithm": fact("kadane-algorithm"),
  "two-pointers": fact("two-pointers"),
  "in-place-array-update": fact("in-place-array-update"),
  "sliding-window": fact("sliding-window"),
  "stock-profit": fact("stock-profit"),
  "stack-intro": anyOf(fact("stack-like"), fact("stack-array-implementation")),
  "stack-array-implementation": fact("stack-array-implementation"),
  "stack-operations": fact("stack-operations"),
  "balanced-parentheses": fact("parenthesis-matching"),
  "reverse-using-stack": fact("reverse-using-stack"),
  "postfix-evaluation": fact("stack-expression-evaluation"),
  "min-stack": fact("min-stack"),
  "monotonic-stack": fact("monotonic-stack"),
  "stock-span": fact("stock-span"),
  "next-greater-element": fact("next-greater-element"),
  "previous-smaller-element": fact("previous-smaller-element"),
  "expression-conversion": anyOf(fact("expression-conversion"), fact("stack-expression-evaluation")),
  "largest-rectangle-histogram": fact("largest-rectangle-histogram"),
  "stack-simulation": fact("stack-simulation"),
  "ll-traversal": fact("linked-list-traversal"),
  "ll-length": fact("linked-list-length"),
  "ll-search": fact("linked-list-search"),
  "ll-head-tail-update": fact("head-tail-update"),
  "ll-node-delete": fact("node-deletion"),
  "ll-reverse": fact("linked-list-reversal"),
  "ll-middle": fact("linked-list-middle"),
  "ll-fast-slow": fact("fast-slow-pointers"),
  "ll-cycle-detection": fact("linked-list-cycle-detection"),
  "ll-merge-sorted": fact("merge-sorted-linked-lists"),
  "ll-remove-duplicates": fact("linked-list-duplicate-removal"),
  "queue-intro": anyOf(fact("queue-like"), fact("array-queue-implementation")),
  "queue-operations": fact("queue-operations"),
  "array-queue-implementation": fact("array-queue-implementation"),
  "circular-queue": anyOf(fact("circular-queue"), fact("circular-tour")),
  "queue-simulation": anyOf(fact("queue-simulation"), fact("circular-tour")),
  "generate-binary-numbers": fact("generate-binary-numbers"),
  "bfs-on-grid": fact("bfs-grid-processing"),
  "sliding-window-queue": fact("deque-window"),
  "deque-technique": fact("deque-window"),
  "top-k-elements": fact("bounded-priority-queue"),
  "task-scheduling-queue": fact("task-scheduling-queue"),
  "binary-search-intro": fact("binary-search"),
  "sorted-mid-check": fact("sorted-mid-check"),
  "lower-bound": fact("lower-bound-search"),
  "upper-bound": fact("upper-bound-search"),
  "first-last-occurrence": fact("first-last-occurrence"),
  "search-insert-position": fact("search-insert-position"),
  "rotated-array-search": fact("rotated-array-search"),
  "peak-element": fact("peak-element-search"),
  "answer-binary-search": fact("answer-space-search"),
  "sqrt-binary-search": fact("sqrt-binary-search"),
  "capacity-search": fact("capacity-search"),
  "partition-binary-search": fact("partition-binary-search"),
  "tree-intro": fact("tree-node"),
  "recursive-tree-traversal": fact("recursive-tree-traversal"),
  "level-order-traversal": fact("level-order-tree-traversal"),
  "tree-height": fact("tree-height"),
  "tree-diameter": fact("tree-diameter"),
  "balanced-tree-check": fact("balanced-tree-check"),
  "bst-search": fact("bst-search"),
  "bst-insert-delete": fact("bst-mutation"),
  "tree-view": fact("tree-view"),
  "lca-binary-tree": fact("lowest-common-ancestor"),
  "tree-construction": fact("tree-construction"),
  "serialize-tree": fact("tree-serialization"),
  "graph-intro": fact("graph-adjacency"),
  "adjacency-list": fact("graph-adjacency"),
  "dfs-graph": fact("graph-dfs"),
  "bfs-graph": fact("graph-bfs"),
  "connected-components": fact("connected-components"),
  "cycle-detection": fact("graph-cycle-detection"),
  "grid-bfs": fact("grid-graph-traversal"),
  "topological-sort": fact("topological-sort"),
  "shortest-path-unweighted": fact("unweighted-shortest-path"),
  "dijkstra": fact("dijkstra"),
  "union-find": fact("disjoint-set-union"),
  "mst": fact("minimum-spanning-tree"),
  "dp-intro": anyOf(fact("dp-memoization"), fact("bottom-up-dp")),
  "memoization": fact("dp-memoization"),
  "tabulation": fact("bottom-up-dp"),
  "state-transition": fact("dp-state-transition"),
  "space-optimization": fact("dp-space-optimization"),
  "grid-dp": fact("grid-dp"),
  "knapsack-dp": fact("knapsack-dp"),
  "lis-dp": fact("sequence-dp"),
  "string-dp": fact("string-dp"),
  "interval-dp": fact("interval-dp"),
  "recursion-intro": fact("recursive-call"),
  "base-case": fact("base-case"),
  "parameterized-recursion": fact("parameterized-recursion"),
  "functional-recursion": fact("functional-recursion"),
  "recursion-on-strings": fact("recursion-on-strings"),
  "recursion-on-arrays": fact("recursion-on-arrays"),
  "tree-recursion": fact("tree-recursion"),
  "backtracking-basics": allOf(fact("recursive-call"), fact("backtracking-undo")),
  "subsequence-generation": fact("subsequence-generation"),
  "permutations": fact("permutation-backtracking"),
  "divide-and-conquer": fact("divide-and-conquer"),
  "recursive-search": fact("recursive-search"),
  "binary-representation": anyOf(
    fact("right-shift"),
    fact("bitwise-and"),
    fact("modulo-division-by-two"),
    fact("binary-string-conversion")
  ),
  "bitwise-and": fact("bitwise-and"),
  "bitwise-or": fact("bitwise-or"),
  "bitwise-xor": fact("bitwise-xor"),
  "left-shift": fact("left-shift"),
  "right-shift": fact("right-shift"),
  "bitwise-not": fact("bitwise-not"),
  "odd-even-check": anyOf(fact("bitwise-and"), fact("modulo-division-by-two")),
  "check-ith-bit": allOf(fact("bitwise-and"), anyOf(fact("left-shift"), fact("right-shift"))),
  "set-ith-bit": allOf(fact("bitwise-or"), fact("left-shift")),
  "clear-ith-bit": allOf(fact("bitwise-and"), fact("bitwise-not"), fact("left-shift")),
  "toggle-ith-bit": allOf(fact("bitwise-xor"), fact("left-shift")),
  "count-set-bits": anyOf(fact("bitwise-and"), fact("clear-lowest-set-bit"), fact("right-shift")),
  "brian-kernighan": fact("clear-lowest-set-bit"),
  "power-of-two": fact("clear-lowest-set-bit"),
  "xor-tricks": fact("bitwise-xor"),
  "single-number": fact("bitwise-xor"),
  "two-unique-numbers": fact("bitwise-xor"),
  "missing-number": fact("bitwise-xor"),
  "subsets-using-bits": anyOf(fact("left-shift"), fact("bitwise-and"), fact("bitwise-or")),
  "bitmasking-basics": anyOf(fact("left-shift"), fact("bitwise-and"), fact("bitwise-or"))
};

const problemConceptOverrides: Record<string, Record<string, FactExpectation>> = {
  "dp-001": {
    memoization: anyOf(fact("dp-memoization"), fact("bottom-up-dp")),
    tabulation: anyOf(fact("bottom-up-dp"), fact("dp-memoization"))
  },
  "dp-003": {
    memoization: anyOf(fact("dp-memoization"), fact("bottom-up-dp"))
  },
  "rec-004": {
    "parameterized-recursion": anyOf(fact("parameterized-recursion"), fact("functional-recursion")),
    "functional-recursion": anyOf(fact("functional-recursion"), fact("parameterized-recursion"))
  },
  "rec-019": {
    memoization: anyOf(fact("memoization"), fact("dp-memoization"))
  },
  "rec-020": {
    memoization: anyOf(fact("memoization"), fact("dp-memoization"))
  },
  "rec-024": {
    permutations: anyOf(fact("permutation-backtracking"), fact("recursive-search"))
  },
  "bs-008": {
    "answer-binary-search": allOf(fact("binary-search"), fact("sqrt-binary-search"))
  },
  "gr-012": {
    "shortest-path-unweighted": fact("shortest-path-relaxation")
  },
  "q-012": {
    "top-k-elements": fact("priority-queue")
  }
};

export function getConceptExpectation(problemId: string, conceptId: string): FactExpectation | undefined {
  return problemConceptOverrides[problemId]?.[conceptId] ?? conceptExpectations[conceptId];
}
