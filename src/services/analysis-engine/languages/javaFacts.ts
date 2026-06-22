import { addFact, CodeFacts, createEmptyCodeFacts, hasFact } from "../facts";
import { detectOpposingPointerMovement } from "./pointerMovement";

const variableDeclarationRegex = /\b(?:int|long|boolean|char|String|Integer|List|ArrayList|Map|HashMap|Set|HashSet|Deque|Queue|Stack|PriorityQueue|Node|ListNode|TreeNode)\s+(?:\[\]\s*)?([a-zA-Z_]\w*)/g;

export function extractJavaCodeFacts(content: string): CodeFacts {
  const facts = createEmptyCodeFacts("java");
  const loopMatches = content.match(/\b(for|while)\s*\(/g) ?? [];
  const methodMatches = content.match(/\b(?:public|private|protected)?\s*(?:static\s+)?(?:void|int|long|boolean|String|char|double|float|List<[^>]+>|Map<[^>]+>|Set<[^>]+>)\s+[a-zA-Z_]\w*\s*\(/g) ?? [];
  const arrayAccessMatches = content.match(/\[[^\]]+\]/g) ?? [];

  facts.metrics.loopCount = loopMatches.length;
  facts.metrics.methodCount = methodMatches.length;
  facts.metrics.arrayAccessCount = arrayAccessMatches.length;
  facts.metrics.nestedLoopDepth = estimateNestedLoopDepth(content);
  facts.metrics.variableNames = extractVariableNames(content);

  if (facts.metrics.loopCount > 0) {
    addFact(facts, "controlFlow", "loop", "high", loopMatches);
  }
  if (facts.metrics.nestedLoopDepth >= 2) {
    addFact(facts, "controlFlow", "nested-loop", "medium", ["loop inside loop"]);
    addFact(facts, "complexitySignals", "quadratic-candidate", "medium", ["nested loop"]);
  } else if (facts.metrics.loopCount === 1) {
    addFact(facts, "complexitySignals", "single-pass", "medium", ["one loop"]);
  }

  if (arrayAccessMatches.length > 0 || /\bnew\s+(?:int|long|boolean|char|String)\s*\[/.test(content)) {
    addFact(facts, "dataStructures", "array", "high", arrayAccessMatches.slice(0, 4));
    addFact(facts, "structures", "indexed-access", "high", arrayAccessMatches.slice(0, 4));
  }
  if (/\b(?:HashMap|Map<)/.test(content)) addFact(facts, "dataStructures", "hash-map", "high", ["HashMap/Map"]);
  if (/\b(?:HashSet|Set<)/.test(content)) addFact(facts, "dataStructures", "hash-set", "high", ["HashSet/Set"]);
  if (/\b(?:Stack<|Deque<|ArrayDeque<|LinkedList<)/.test(content)) addFact(facts, "dataStructures", "stack-like", "high", ["Stack/Deque"]);
  if (/\b(?:Queue<|Deque<|ArrayDeque<|LinkedList<)/.test(content)) addFact(facts, "dataStructures", "queue-like", "high", ["Queue/Deque"]);
  if (/\bPriorityQueue</.test(content)) addFact(facts, "dataStructures", "priority-queue", "high", ["PriorityQueue"]);

  if (/(prefix|pref)\s*\[|runningSum|sum\s*\+=\s*\w+\s*\[/.test(content)) {
    addFact(facts, "algorithms", "prefix-sum", "high", ["prefix/running sum"]);
  }
  if (detectTwoPointerMovement(content)) {
    addFact(facts, "algorithms", "two-pointers", "high", ["opposite pointer movement"]);
    addFact(facts, "complexitySignals", "single-pass", "medium", ["pointer scan"]);
  }
  if (/(windowSum|curr(?:ent)?Sum|while\s*\(\s*\w*sum\w*\s*>|\w*sum\w*\s*-=|\w*sum\w*\s*\+=)/i.test(content) && facts.metrics.loopCount > 0) {
    addFact(facts, "algorithms", "sliding-window", "medium", ["window sum adjustment"]);
    addFact(facts, "complexitySignals", "linear-amortized", "medium", ["window boundaries move forward"]);
  }
  if (/(Arrays\.sort|Collections\.sort)/.test(content)) {
    addFact(facts, "algorithms", "sorting", "high", ["sort call"]);
    addFact(facts, "complexitySignals", "n-log-n-candidate", "medium", ["sort call"]);
  }
  detectArrayTechniques(facts, content);
  if (/\.(push|pop|peek)\s*\(|\.(addLast|removeLast|getLast|offerLast|pollLast|peekLast)\s*\(/.test(content)) {
    addFact(facts, "structures", "stack-operations", "high", ["push/pop/peek or deque end operation"]);
  }
  if (detectMonotonicStack(content)) {
    addFact(facts, "algorithms", "monotonic-stack", "high", ["while + stack peek comparison"]);
    addFact(facts, "complexitySignals", "linear-amortized", "medium", ["each element pushed/popped around once"]);
  }
  if (/[\(\)\[\]\{\}]/.test(content) && hasStackOperation(content)) {
    addFact(facts, "algorithms", "parenthesis-matching", "medium", ["bracket characters with stack operations"]);
  }
  if (/(precedence|isOperator|postfix|infix|prefix|Character\.isLetterOrDigit|Character\.isDigit|\+\s*" ")/.test(content) && hasStackOperation(content)) {
    addFact(facts, "algorithms", "expression-conversion", "medium", ["operator precedence/expression tokens"]);
  }
  if (/(minStack|minValues|minHistory|Math\.min|currentMin)/.test(content) && hasStackOperation(content)) {
    addFact(facts, "algorithms", "min-stack", "medium", ["minimum tracking with stack operations"]);
  }
  detectAdvancedStackTechniques(facts, content);
  const recursion = detectRecursion(content);
  if (recursion.hasRecursiveCall) {
    addFact(facts, "controlFlow", "recursive-call", "high", recursion.methodNames);
  }
  if (recursion.hasBaseCase) {
    addFact(facts, "controlFlow", "base-case", "medium", ["conditional return"]);
    addFact(facts, "edgeCaseSignals", "recursive-base-case", "medium", ["conditional return"]);
  }
  if (recursion.hasMultipleRecursiveCalls) {
    addFact(facts, "controlFlow", "multiple-recursive-calls", "high", recursion.methodNames);
    addFact(facts, "algorithms", "tree-recursion", "medium", ["method called more than once"]);
  }
  if (recursion.usesMemoization) {
    addFact(facts, "algorithms", "memoization", "medium", ["memo/dp map or table"]);
  }
  if (recursion.usesBacktrackingUndo) {
    addFact(facts, "algorithms", "backtracking-undo", "high", ["remove/reset/swap undo"]);
  }
  if (recursion.usesDivideAndConquer) {
    addFact(facts, "algorithms", "divide-and-conquer", "medium", ["mid/partition/merge with recursive branching"]);
  }
  if (recursion.missingRecursiveProgress) {
    addFact(facts, "antiPatterns", "missing-recursive-progress", "medium", ["recursive call without obvious smaller state"]);
  }
  detectAdvancedRecursion(facts, content, recursion.methodNames);
  const binarySearch = detectBinarySearch(content);
  if (binarySearch.usesBinarySearch) {
    addFact(facts, "algorithms", "binary-search", "high", ["mid with low/high bounds"]);
    addFact(facts, "complexitySignals", "logarithmic-search", "medium", ["bounds shrink around mid"]);
  }
  if (binarySearch.usesLowerUpperBoundPattern) {
    addFact(facts, "algorithms", "lower-upper-bound", "medium", ["answer/boundary tracking"]);
  }
  if (binarySearch.usesLowerBound) {
    addFact(facts, "algorithms", "lower-bound-search", "high", ["first position with value at least target"]);
  }
  if (binarySearch.usesUpperBound) {
    addFact(facts, "algorithms", "upper-bound-search", "high", ["first position with value greater than target"]);
  }
  if (binarySearch.usesFirstLastOccurrence) {
    addFact(facts, "algorithms", "first-last-occurrence", "high", ["separate first and last boundary searches"]);
  }
  if (binarySearch.usesSearchInsertPosition) {
    addFact(facts, "algorithms", "search-insert-position", "high", ["boundary pointer returned as insertion index"]);
  }
  if (binarySearch.usesAnswerBinarySearch) {
    addFact(facts, "algorithms", "answer-space-search", "medium", ["predicate search over answer range"]);
  }
  if (binarySearch.usesSortedMidCheck) {
    addFact(facts, "algorithms", "sorted-mid-check", "high", ["array mid comparison"]);
  }
  if (binarySearch.usesPartitionBinarySearch) {
    addFact(facts, "algorithms", "partition-binary-search", "medium", ["partition/cut boundary variables"]);
  }
  if (binarySearch.usesRotatedArraySearch) {
    addFact(facts, "algorithms", "rotated-array-search", "high", ["sorted half selected around rotation"]);
  }
  if (binarySearch.usesPeakSearch) {
    addFact(facts, "algorithms", "peak-element-search", "high", ["middle compared with neighboring element"]);
  }
  if (binarySearch.usesSqrtSearch) {
    addFact(facts, "algorithms", "sqrt-binary-search", "high", ["middle squared against target using wide arithmetic"]);
  }
  if (binarySearch.usesCapacitySearch) {
    addFact(facts, "algorithms", "capacity-search", "high", ["monotonic feasibility predicate tested at middle answer"]);
  }
  const linkedList = detectLinkedList(content);
  if (linkedList.usesLinkedListTraversal) {
    addFact(facts, "structures", "linked-list-traversal", "high", ["node cursor advances through .next"]);
  }
  if (linkedList.usesHeadUpdate) {
    addFact(facts, "structures", "head-update", "high", ["head or head-adjacent link update"]);
  }
  if (linkedList.usesHeadTailUpdate) {
    addFact(facts, "structures", "head-tail-update", "high", ["head or tail link updated"]);
  }
  if (linkedList.usesNodeDeletion) {
    addFact(facts, "structures", "node-deletion", "high", ["next pointer bypasses a node"]);
  }
  if (linkedList.usesLinkedListReverse) {
    addFact(facts, "algorithms", "linked-list-reversal", "high", ["current node points to previous node"]);
  }
  if (linkedList.usesFastSlowPointers) {
    addFact(facts, "algorithms", "fast-slow-pointers", "high", ["slow advances once while fast advances twice"]);
  }
  if (linkedList.usesDummyNode) {
    addFact(facts, "structures", "dummy-node", "high", ["dummy/sentinel node allocation"]);
  }
  if (linkedList.usesLengthCounting) {
    addFact(facts, "algorithms", "linked-list-length", "high", ["counter increments while advancing node cursor"]);
  }
  if (linkedList.usesSearch) {
    addFact(facts, "algorithms", "linked-list-search", "high", ["node value compared with target during traversal"]);
  }
  if (linkedList.usesMiddlePattern) {
    addFact(facts, "algorithms", "linked-list-middle", "high", ["slow pointer returned after fast/slow traversal"]);
  }
  if (linkedList.usesCycleDetection) {
    addFact(facts, "algorithms", "linked-list-cycle-detection", "high", ["fast and slow node references compared"]);
  }
  if (linkedList.usesSortedMerge) {
    addFact(facts, "algorithms", "merge-sorted-linked-lists", "high", ["tail selects and appends from two sorted cursors"]);
  }
  if (linkedList.usesDuplicateRemoval) {
    addFact(facts, "algorithms", "linked-list-duplicate-removal", "high", ["equal adjacent nodes skipped"]);
  }
  if (linkedList.hasEdgeCaseHandling) {
    addFact(facts, "edgeCaseSignals", "linked-list-edge-check", "medium", ["head/null/empty-list guard"]);
  }
  const queue = detectQueue(content);
  if (queue.usesEnqueueDequeue) {
    addFact(facts, "structures", "queue-operations", "high", ["offer/poll or front/back queue operation"]);
  }
  if (queue.usesArrayQueueImplementation) {
    addFact(facts, "dataStructures", "array-queue-implementation", "high", ["array with front and rear pointers"]);
    addFact(facts, "structures", "queue-operations", "high", ["front/rear array enqueue and dequeue"]);
  }
  if (queue.usesCircularQueuePattern) {
    addFact(facts, "algorithms", "circular-queue", "high", ["front/rear index wraps with modulo"]);
  }
  if (queue.usesDequeWindowPattern) {
    addFact(facts, "algorithms", "deque-window", "high", ["deque removes expired or noncompetitive window entries"]);
    addFact(facts, "complexitySignals", "linear-amortized", "medium", ["window entries enter and leave deque at most once"]);
  }
  if (queue.usesBfsStyleQueue) {
    addFact(facts, "algorithms", "bfs-queue-processing", "medium", ["queue drained until empty"]);
  }
  if (queue.usesQueueSimulation) {
    addFact(facts, "algorithms", "queue-simulation", "medium", ["FIFO state repeatedly consumed and extended"]);
  }
  if (queue.generatesBinaryNumbers) {
    addFact(facts, "algorithms", "generate-binary-numbers", "high", ["popped string produces 0 and 1 children"]);
  }
  if (queue.usesGridBfs) {
    addFact(facts, "algorithms", "bfs-grid-processing", "high", ["queued row/column states expanded through directions"]);
  }
  if (queue.usesBoundedPriorityQueue) {
    addFact(facts, "algorithms", "bounded-priority-queue", "high", ["heap maintained at size k"]);
  }
  if (queue.usesTaskScheduling) {
    addFact(facts, "algorithms", "task-scheduling-queue", "high", ["queued tasks or indices re-enter after time/order advances"]);
  }
  if (queue.usesCircularTour) {
    addFact(facts, "algorithms", "circular-tour", "high", ["running balance resets candidate start"]);
  }
  if (queue.hasEdgeCaseHandling) {
    addFact(facts, "edgeCaseSignals", "queue-edge-check", "medium", ["empty queue/input guard"]);
  }
  const tree = detectTree(content);
  if (tree.usesTreeNodePattern) {
    addFact(facts, "dataStructures", "tree-node", "high", ["tree node with left/right links"]);
  }
  if (tree.usesRecursiveTraversal) {
    addFact(facts, "algorithms", "recursive-tree-traversal", "high", ["recursive call on left or right child"]);
  }
  if (tree.usesQueueTraversal) {
    addFact(facts, "algorithms", "level-order-tree-traversal", "high", ["tree nodes processed through a queue"]);
  }
  if (tree.usesBstLogic) {
    addFact(facts, "algorithms", "bst-logic", "high", ["value comparison selects a tree branch"]);
  }
  if (tree.usesTreeConstruction) {
    addFact(facts, "algorithms", "tree-construction", "medium", ["tree node creation or traversal partition"]);
  }
  if (tree.usesLcaPattern) {
    addFact(facts, "algorithms", "lowest-common-ancestor", "high", ["left/right recursive results converge"]);
  }
  if (tree.hasEdgeCaseHandling) {
    addFact(facts, "edgeCaseSignals", "tree-edge-check", "medium", ["null root/node or empty queue guard"]);
  }
  detectAdvancedTreeTechniques(facts, content);
  const graph = detectGraph(content);
  if (graph.usesGraphAdjacency) {
    addFact(facts, "dataStructures", "graph-adjacency", "high", ["adjacency list, neighbors, or edges structure"]);
  }
  if (graph.usesGraphTraversal) {
    addFact(facts, "algorithms", "graph-traversal", "high", ["visited state with DFS/BFS or neighbor iteration"]);
  }
  if (graph.usesBfsTraversal) {
    addFact(facts, "algorithms", "graph-bfs", "high", ["queue-based graph traversal"]);
  }
  if (graph.usesDfsTraversal) {
    addFact(facts, "algorithms", "graph-dfs", "high", ["recursive or stack-based graph traversal"]);
  }
  if (graph.usesTopologicalSort) {
    addFact(facts, "algorithms", "topological-sort", "high", ["indegree or DFS finishing order"]);
  }
  if (graph.usesShortestPath) {
    addFact(facts, "algorithms", "shortest-path-relaxation", "high", ["distance update or weighted priority processing"]);
  }
  if (graph.usesDisjointSet) {
    addFact(facts, "dataStructures", "disjoint-set-union", "high", ["parent/rank with find and union"]);
  }
  if (graph.usesMstLogic) {
    addFact(facts, "algorithms", "minimum-spanning-tree", "medium", ["Kruskal/Prim style edge selection"]);
  }
  if (graph.hasEdgeCaseHandling) {
    addFact(facts, "edgeCaseSignals", "graph-edge-check", "medium", ["empty graph, visited state, or empty frontier guard"]);
  }
  detectAdvancedGraphTechniques(facts, content);
  const dp = detectDynamicProgramming(content);
  if (dp.usesMemoTable) {
    addFact(facts, "algorithms", "dp-memoization", "high", ["recursive state cached in a table or map"]);
  }
  if (dp.usesBottomUpDp) {
    addFact(facts, "algorithms", "bottom-up-dp", "high", ["DP table filled iteratively"]);
  }
  if (dp.usesStateTransition) {
    addFact(facts, "algorithms", "dp-state-transition", "high", ["DP state derived from prior states"]);
  }
  if (dp.usesSpaceOptimization) {
    addFact(facts, "algorithms", "dp-space-optimization", "medium", ["rolling previous/current state"]);
    addFact(facts, "complexitySignals", "reduced-dp-space", "medium", ["full table replaced by rolling state"]);
  }
  if (dp.usesKnapsackPattern) {
    addFact(facts, "algorithms", "knapsack-dp", "high", ["capacity/target state with take or skip transition"]);
  }
  if (dp.usesIntervalDp) {
    addFact(facts, "algorithms", "interval-dp", "high", ["states filled by increasing interval length"]);
  }
  if (dp.hasEdgeCaseHandling) {
    addFact(facts, "edgeCaseSignals", "dp-edge-check", "medium", ["empty/base target or index guard"]);
  }
  detectAdvancedDynamicProgramming(facts, content);
  const bit = detectBitManipulation(content);
  if (bit.usesAnd) addFact(facts, "structures", "bitwise-and", "high", ["single & operator"]);
  if (bit.usesOr) addFact(facts, "structures", "bitwise-or", "high", ["single | operator"]);
  if (bit.usesXor) addFact(facts, "structures", "bitwise-xor", "high", ["^ operator"]);
  if (bit.usesLeftShift) addFact(facts, "structures", "left-shift", "high", ["<< operator"]);
  if (bit.usesRightShift) addFact(facts, "structures", "right-shift", "high", [">> operator"]);
  if (bit.usesNot) addFact(facts, "structures", "bitwise-not", "high", ["~ operator"]);
  if (bit.usesPowerOfTwoPattern) {
    addFact(facts, "algorithms", "clear-lowest-set-bit", "high", ["n & (n - 1) pattern"]);
  }
  if (bit.usesStringConversion) {
    addFact(facts, "antiPatterns", "binary-string-conversion", "high", ["binary conversion through String APIs"]);
  }
  if (bit.usesModuloDivision) {
    addFact(facts, "antiPatterns", "modulo-division-by-two", "high", ["% 2 or / 2"]);
  }
  if (bit.hasBitHardcoding) {
    addFact(facts, "antiPatterns", "bit-hardcoding", "medium", ["literal branches or assignments without bit-mask logic"]);
  }
  if (bit.hasEdgeCaseHandling) {
    addFact(facts, "edgeCaseSignals", "bit-edge-check", "medium", ["zero, negative, or null guard"]);
  }

  if (/(n\s*==\s*0|\.length\s*==\s*0|\.isEmpty\(\)|null|target\s*==\s*0)/.test(content)) {
    addFact(facts, "edgeCaseSignals", "empty-or-null-check", "medium", ["empty/null/base input check"]);
  }
  if (/\breturn\s+(true|false|\d+|"[^"]*")\s*;/.test(content) && facts.metrics.loopCount === 0 && arrayAccessMatches.length === 0) {
    addFact(facts, "antiPatterns", "hardcoded-output", "medium", ["literal return without traversal"]);
  }
  if (hasPoorVariableNames(facts.metrics.variableNames)) {
    addFact(facts, "antiPatterns", "poor-variable-names", "low", ["short ambiguous variable names"]);
  }

  return facts;
}

function extractVariableNames(content: string): string[] {
  const names: string[] = [];
  let match = variableDeclarationRegex.exec(content);
  while (match) {
    names.push(match[1]);
    match = variableDeclarationRegex.exec(content);
  }
  return names;
}

function detectTwoPointerMovement(content: string): boolean {
  return detectOpposingPointerMovement(content);
}

function detectArrayTechniques(facts: CodeFacts, content: string): void {
  const hasArrayLoop = facts.metrics.loopCount > 0 && hasArrayEvidence(facts);
  if (hasArrayLoop) {
    addFact(facts, "algorithms", "array-traversal", "high", ["loop with indexed array access"]);
  }

  if (
    hasArrayLoop &&
    (/\b(?:min|max|minimum|maximum|largest|smallest|best)\w*\b\s*=\s*(?:Math\.(?:min|max)\s*\(|[^;]*(?:<|>)[^;]*\?)/i.test(content) ||
      /\b(?:min|max|minimum|maximum|largest|smallest|best)\w*\b[\s\S]{0,180}(?:<|>)[\s\S]{0,120}\b(?:min|max|minimum|maximum|largest|smallest|best)\w*\b\s*=/i.test(content))
  ) {
    addFact(facts, "algorithms", "min-max-tracking", "high", ["running minimum/maximum update"]);
  }

  if (/\w+\s*\[\s*\w+\s*\]\s*[<>]=?\s*\w+\s*\[\s*\w+\s*-\s*1\s*\]|\w+\s*\[\s*\w+\s*-\s*1\s*\]\s*[<>]=?\s*\w+\s*\[\s*\w+\s*\]/.test(content)) {
    addFact(facts, "algorithms", "adjacent-order-check", "high", ["adjacent array elements compared"]);
  }

  const indexedAssignment = /\w+\s*\[[^\]]+\]\s*=\s*[^=]/.test(content);
  if (indexedAssignment && hasArrayLoop) {
    addFact(facts, "structures", "in-place-array-update", "high", ["array element assigned during traversal"]);
  }

  const swapsArrayValues =
    /(?:Collections\.)?swap\s*\([^;]*\[[^\]]+\][^;]*\[[^\]]+\]\)|(?:\w+\s*=\s*\w+\s*\[[^\]]+\][\s\S]{0,180}\w+\s*\[[^\]]+\]\s*=\s*\w+\s*\[[^\]]+\][\s\S]{0,180}\w+\s*\[[^\]]+\]\s*=\s*\w+)/.test(content);
  if (swapsArrayValues && hasFact(facts, "two-pointers")) {
    addFact(facts, "algorithms", "array-reversal", "high", ["two-pointer array swap"]);
  }

  if (
    /\b(?:second|max2|secondMax|secondLargest|runnerUp)\w*\b/i.test(content) &&
    /\b(?:max|largest|first|max1)\w*\b/i.test(content) &&
    hasArrayLoop
  ) {
    addFact(facts, "algorithms", "second-extreme-tracking", "high", ["largest and second-largest state"]);
  }

  if (
    hasFact(facts, "hash-map") &&
    /(?:getOrDefault|merge|compute|put\s*\([^,]+,\s*\w+\.get|(?:freq|count|frequency)\w*\s*\[[^\]]+\]\s*(?:\+\+|\+=))/i.test(content)
  ) {
    addFact(facts, "algorithms", "frequency-counting", "high", ["map count updated per value"]);
  }

  if (
    /\b(?:currentSum|currSum|maxEndingHere|localMax|runningMax)\b/i.test(content) &&
    /Math\.max\s*\([^,]+,\s*[^)]*\+[^)]*\)|\b(?:currentSum|currSum|maxEndingHere|localMax)\b\s*=\s*Math\.max/i.test(content)
  ) {
    addFact(facts, "algorithms", "kadane-algorithm", "high", ["best ending-here recurrence"]);
  }

  if (
    /\b(?:prefixProduct|suffixProduct|leftProduct|rightProduct|prefix|suffix)\w*\b/i.test(content) &&
    /(?:\*=|=\s*[^;]*\*)/.test(content) &&
    hasArrayLoop
  ) {
    addFact(facts, "algorithms", "prefix-product", "high", ["prefix/suffix product accumulation"]);
  }

  if (
    /\b(?:minPrice|lowestPrice|buyPrice)\b/i.test(content) &&
    /\b(?:maxProfit|bestProfit|profit)\b/i.test(content) &&
    /(?:Math\.min|<[\s\S]{0,100}(?:minPrice|lowestPrice|buyPrice))/.test(content)
  ) {
    addFact(facts, "algorithms", "stock-profit", "high", ["minimum price and best profit tracked"]);
  }
}

function hasArrayEvidence(facts: CodeFacts): boolean {
  return facts.dataStructures.some((item) => item.id === "array");
}

function hasStackOperation(content: string): boolean {
  return /\.(push|pop|peek)\s*\(|\.(addLast|removeLast|getLast|offerLast|pollLast|peekLast)\s*\(/.test(content);
}

function detectMonotonicStack(content: string): boolean {
  const monotonicPattern =
    /(while\s*\(\s*!?\w+\.isEmpty\(\)\s*&&[\s\S]{0,140}(peek|getLast|peekLast)\s*\(\)[\s\S]{0,100}[<>]=?|while\s*\(\s*!?\w+\.isEmpty\(\)\s*&&[\s\S]{0,140}[<>]=?[\s\S]{0,100}(peek|getLast|peekLast)\s*\()/;
  return monotonicPattern.test(content) && hasStackOperation(content);
}

function detectAdvancedStackTechniques(facts: CodeFacts, content: string): void {
  const hasOperations = hasFact(facts, "stack-operations");
  const hasStack = hasFact(facts, "stack-like") || hasOperations;

  if (
    /\btop\s*=\s*-1\b/.test(content) &&
    /\w+\s*\[\s*(?:\+\+top|top\+\+|top)\s*\]\s*=/.test(content) &&
    /(?:--top|top--|\[\s*top\s*\])/.test(content)
  ) {
    addFact(facts, "dataStructures", "stack-array-implementation", "high", ["array with top pointer"]);
    addFact(facts, "structures", "stack-operations", "high", ["top pointer push/pop/peek"]);
  }

  if (
    hasOperations &&
    /(?:StringBuilder|StringBuffer|\bresult\b|\boutput\b|\breversed\b)/i.test(content) &&
    /while\s*\(\s*!\w+\.isEmpty\(\)\s*\)[\s\S]{0,220}\.pop\s*\(\)/.test(content)
  ) {
    addFact(facts, "algorithms", "reverse-using-stack", "high", ["append values while popping stack"]);
  }

  const popCount = content.match(/\.pop\s*\(\)/g)?.length ?? 0;
  if (
    hasOperations &&
    popCount >= 2 &&
    /(?:Character\.isDigit|isOperator|[+\-*/])/.test(content) &&
    /(?:switch\s*\(|case\s*['"][+\-*/]['"]|if\s*\([^)]*[+\-*/])/.test(content)
  ) {
    addFact(facts, "algorithms", "stack-expression-evaluation", "high", ["two operands popped and combined"]);
  }

  if (
    hasStack &&
    /(while\s*\(\s*!\w+\.isEmpty\(\)[\s\S]{0,180}\.(?:peek|pop)\s*\(|\.(?:peek|pop)\s*\(\)[\s\S]{0,160}\.(?:push|pop)\s*\()/i.test(content)
  ) {
    addFact(facts, "algorithms", "stack-simulation", "medium", ["conditional stack state simulation"]);
  }

  if (hasFact(facts, "monotonic-stack")) {
    if (/\bspan\b|i\s*-\s*\w+\.peek\s*\(\)|i\s*\+\s*1/.test(content)) {
      addFact(facts, "algorithms", "stock-span", "high", ["span derived from previous greater index"]);
    }
    if (
      /(?:nextGreater|dailyTemperatures|warmer|answer|ans)\w*/i.test(content) &&
      /(?:<=|<)[\s\S]{0,100}(?:peek|getLast|peekLast)\s*\(|(?:peek|getLast|peekLast)\s*\(\)[\s\S]{0,100}(?:<=|<)/.test(content)
    ) {
      addFact(facts, "algorithms", "next-greater-element", "high", ["monotonic stack resolves greater value"]);
    }
    if (
      /(?:previousSmaller|prevSmaller|smaller|answer|ans)\w*/i.test(content) &&
      /(?:>=|>)[\s\S]{0,100}(?:peek|getLast|peekLast)\s*\(|(?:peek|getLast|peekLast)\s*\(\)[\s\S]{0,100}(?:>=|>)/.test(content)
    ) {
      addFact(facts, "algorithms", "previous-smaller-element", "high", ["monotonic stack resolves smaller value"]);
    }
    if (
      /(?:histogram|heights?|maxArea|largestArea|rectangle|width)\w*/i.test(content) &&
      /(?:height|heights?)\s*\[[^\]]+\][\s\S]{0,220}(?:width|area|\*)/i.test(content)
    ) {
      addFact(facts, "algorithms", "largest-rectangle-histogram", "high", ["popped height multiplied by available width"]);
    }
  }
}

function detectRecursion(content: string) {
  const methodNames = detectMethodNames(content);
  const recursiveCallCounts = methodNames.map((name) => ({
    name,
    count: content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0
  }));
  const hasRecursiveCall = recursiveCallCounts.some((item) => item.count >= 2);
  const hasMultipleRecursiveCalls = recursiveCallCounts.some((item) => item.count >= 3);
  const hasBaseCase =
    hasRecursiveCall &&
    /(if\s*\([^)]*(==|<=|>=|<|>)\s*[^)]*\)\s*(return|{|System\.out\.print)|return\s+\w+\s*;)/.test(content);
  const usesMemoization = /(dp\s*\[|memo|HashMap|Map<)/.test(content);
  const usesBacktrackingUndo = /(\.remove\s*\(|used\s*\[\w+\]\s*=\s*false|swap\s*\([^)]*\)\s*;[\s\S]*swap\s*\([^)]*\)\s*;)/.test(content);
  const usesDivideAndConquer = /(mid\s*=|\(l\s*\+\s*r\)\s*\/\s*2|merge\s*\(|partition\s*\()/.test(content) && hasMultipleRecursiveCalls;
  const missingRecursiveProgress = hasRecursiveCall && !/(\w+\s*-\s*1|\w+\s*\+\s*1|mid|left|right|start|end|idx|index)/.test(content);

  return {
    methodNames,
    hasRecursiveCall,
    hasMultipleRecursiveCalls,
    hasBaseCase,
    usesMemoization,
    usesBacktrackingUndo,
    usesDivideAndConquer,
    missingRecursiveProgress
  };
}

function detectMethodNames(content: string): string[] {
  const methodRegex = /\b(?:public|private|protected|static|\s)*\s*(?:int|long|boolean|String|void|List<[^>]+>|ArrayList<[^>]+>|char|double)\s+([a-zA-Z_]\w*)\s*\(/g;
  const names: string[] = [];
  let match = methodRegex.exec(content);
  while (match) {
    names.push(match[1]);
    match = methodRegex.exec(content);
  }
  return Array.from(new Set(names));
}

function detectAdvancedRecursion(facts: CodeFacts, content: string, methodNames: string[]): void {
  if (!hasFact(facts, "recursive-call")) return;

  const recursiveCallPattern = methodNames.map(escapeRegex).join("|");
  const returnedRecursiveCall = new RegExp(`return\\s+[^;]*(?:${recursiveCallPattern})\\s*\\(`).test(content);
  const parameterizedCall = new RegExp(`(?:${recursiveCallPattern})\\s*\\([^)]*,[^)]*\\)`).test(content);

  if (returnedRecursiveCall) {
    addFact(facts, "algorithms", "functional-recursion", "high", ["recursive result returned or combined"]);
  }
  if (parameterizedCall && !returnedRecursiveCall) {
    addFact(facts, "algorithms", "parameterized-recursion", "high", ["state or accumulator carried through recursive arguments"]);
  }
  if (/\bString\b|charAt\s*\(|substring\s*\(/.test(content)) {
    addFact(facts, "algorithms", "recursion-on-strings", "high", ["recursive call processes a string or character range"]);
  }
  if (/\[\]|List<|ArrayList<|\[[^\]]+\]/.test(content)) {
    addFact(facts, "algorithms", "recursion-on-arrays", "medium", ["recursive call processes indexed collection state"]);
  }
  if (
    hasFact(facts, "multiple-recursive-calls") &&
    (/(?:pick|skip|take|notTake|include|exclude|path\.add|current\.add)/i.test(content) ||
      hasFact(facts, "recursion-on-arrays"))
  ) {
    addFact(facts, "algorithms", "subsequence-generation", "high", ["include/exclude recursive branches"]);
  }
  if (
    hasFact(facts, "recursive-call") &&
    hasFact(facts, "backtracking-undo") &&
    facts.metrics.loopCount > 0 &&
    /(?:used\s*\[|swap\s*\(|permutation|permute)/i.test(content)
  ) {
    addFact(facts, "algorithms", "permutation-backtracking", "high", ["choose unused element, recurse, then restore"]);
  }
  if (
    (hasFact(facts, "backtracking-undo") ||
      /(?:board|grid)\s*\[[^\]]+\]\s*\[[^\]]+\]\s*=\s*(?:0|'\.'|"\.")/.test(content)) &&
    /(?:isSafe|isValid|valid|canPlace|board|sudoku|queen|row|column)/i.test(content)
  ) {
    if (!hasFact(facts, "backtracking-undo")) {
      addFact(facts, "algorithms", "backtracking-undo", "high", ["board choice restored after recursive exploration"]);
    }
    addFact(facts, "algorithms", "recursive-search", "high", ["validity checks prune a recursive state-space search"]);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectBinarySearch(content: string) {
  const midPattern = /(mid\s*=|mid\s*=\s*(?:left|low)\s*\+\s*\((?:right|high)\s*-\s*(?:left|low)\)\s*\/\s*2|mid\s*=\s*\((?:left|low)\s*\+\s*(?:right|high)\)\s*\/\s*2)/;
  const boundPattern = /(ans\s*=|first\s*=|last\s*=|lowerBound|upperBound|leftMost|rightMost)/;
  const answerBinaryPattern =
    /(while\s*\(\s*(?:left|low)\s*<=?\s*(?:right|high)\s*\))[\s\S]{0,260}(mid)[\s\S]{0,260}(possible|can|isValid|isPossible|hours|capacity|days|bouquets|canFinish)/i;
  const sortedMidCheckPattern = /((?:arr|nums|values)\s*\[\s*mid\s*\]|midVal|midValue)/;
  const partitionPattern = /(partition|cut1|cut2|left1|left2|right1|right2|maxLeft|minRight)/;
  const usesBinarySearch = midPattern.test(content) && /\b(left|right|low|high)\b/.test(content) && /while\s*\(/.test(content);
  const usesLowerBound =
    usesBinarySearch &&
    /\w+\s*\[\s*mid\s*\]\s*>=\s*(?:target|x|key)[\s\S]{0,160}(?:ans|answer|result|right)\s*=/.test(content);
  const usesUpperBound =
    usesBinarySearch &&
    /\w+\s*\[\s*mid\s*\]\s*>\s*(?:target|x|key)[\s\S]{0,160}(?:ans|answer|result|right)\s*=/.test(content);

  return {
    usesBinarySearch,
    usesLowerUpperBoundPattern: boundPattern.test(content) && midPattern.test(content),
    usesLowerBound,
    usesUpperBound,
    usesFirstLastOccurrence:
      usesBinarySearch &&
      /(?:first|leftMost|firstOccurrence|lowerBound)/i.test(content) &&
      /(?:last|rightMost|lastOccurrence|upperBound)/i.test(content),
    usesSearchInsertPosition:
      usesLowerBound &&
      /return\s+(?:left|low|ans|answer|result)\s*;/.test(content),
    usesAnswerBinarySearch: answerBinaryPattern.test(content),
    usesSortedMidCheck: sortedMidCheckPattern.test(content) && midPattern.test(content),
    usesPartitionBinarySearch:
      partitionPattern.test(content) &&
      (midPattern.test(content) || /\bcut1\s*=\s*(?:low|left)\s*\+\s*\((?:high|right)\s*-\s*(?:low|left)\)\s*\/\s*2/.test(content)) &&
      /(?:left1|maxLeft1)\s*<=\s*(?:right2|minRight2)[\s\S]{0,140}(?:left2|maxLeft2)\s*<=\s*(?:right1|minRight1)/.test(content),
    usesRotatedArraySearch:
      usesBinarySearch &&
      /(?:arr|nums)\s*\[\s*(?:left|low)\s*\]\s*<=?\s*(?:arr|nums)\s*\[\s*mid\s*\]|(?:arr|nums)\s*\[\s*mid\s*\]\s*<=?\s*(?:arr|nums)\s*\[\s*(?:right|high)\s*\]/.test(content),
    usesPeakSearch:
      usesBinarySearch &&
      /(?:arr|nums)\s*\[\s*mid\s*\]\s*[<>]\s*(?:arr|nums)\s*\[\s*mid\s*\+\s*1\s*\]/.test(content),
    usesSqrtSearch:
      usesBinarySearch &&
      /(?:long\s+\w+\s*=\s*1L\s*\*\s*mid\s*\*\s*mid|1L\s*\*\s*mid\s*\*\s*mid|mid\s*<=\s*\w+\s*\/\s*mid)/.test(content),
    usesCapacitySearch:
      answerBinaryPattern.test(content) &&
      /(?:capacity|speed|days|hours|bouquets|possible|feasible|canFinish|canShip|canMake)/i.test(content)
  };
}

function detectLinkedList(content: string) {
  const usesLinkedListTraversal = /(while\s*\([^)]*null[^)]*\)[\s\S]{0,500}\b\w+\s*=\s*\w+\.next|for\s*\(\s*.*\w+\s*=\s*\w+\.next)/.test(content);
  const usesFastSlowPointers = /(slow\s*=\s*slow\.next[\s\S]*fast\s*=\s*fast\.next\.next|fast\s*=\s*fast\.next\.next[\s\S]*slow\s*=\s*slow\.next)/.test(content);
  return {
    usesLinkedListTraversal,
    usesHeadUpdate: /(head\s*=\s*new\s+\w+|new\w*\.next\s*=\s*head|head\s*=\s*head\.next)/.test(content),
    usesHeadTailUpdate: /(head\s*=\s*new\s+\w+|new\w*\.next\s*=\s*head|head\s*=\s*head\.next|tail\.next\s*=|tail\s*=\s*(?:tail\.next|new\w*)|head\s*=\s*\w+)/.test(content),
    usesNodeDeletion: /\.next\s*=\s*\w+\.next\.next|prev\.next\s*=\s*curr\.next/.test(content),
    usesLinkedListReverse: /curr\.next\s*=\s*prev|prev\s*=\s*curr;[\s\S]*curr\s*=\s*next/.test(content),
    usesFastSlowPointers,
    usesDummyNode: /\b(dummy|sentinel)\s*=\s*new\s+\w+\s*\(/.test(content),
    usesLengthCounting:
      usesLinkedListTraversal &&
      /\b(?:count|length|len|size)\w*\s*(?:\+\+|\+=\s*1)/i.test(content),
    usesSearch:
      usesLinkedListTraversal &&
      /\w+\.(?:data|val|value)\s*==\s*(?:target|key|x|value)|(?:target|key|x|value)\s*==\s*\w+\.(?:data|val|value)/.test(content),
    usesMiddlePattern:
      usesFastSlowPointers &&
      /return\s+(?:slow|slow\.(?:data|val|value))\s*;/.test(content),
    usesCycleDetection:
      usesFastSlowPointers &&
      /(?:slow\s*==\s*fast|fast\s*==\s*slow)/.test(content),
    usesSortedMerge:
      /\b(?:l1|list1|first)\b[\s\S]{0,180}\b(?:l2|list2|second)\b/.test(content) &&
      /(?:data|val|value)\s*<=?\s*\w+\.(?:data|val|value)/.test(content) &&
      /tail\.next\s*=/.test(content),
    usesDuplicateRemoval:
      /\w+\.(?:data|val|value)\s*==\s*\w+\.next\.(?:data|val|value)[\s\S]{0,120}\w+\.next\s*=\s*\w+\.next\.next/.test(content),
    hasEdgeCaseHandling: /(head\s*==\s*null|n\s*==\s*0|if\s*\(\s*head\s*==\s*null|head\s*!=\s*null)/.test(content)
  };
}

function detectQueue(content: string) {
  const hasQueueStructure = /\b(?:Queue<|Deque<|ArrayDeque<|LinkedList<|PriorityQueue<)/.test(content);
  const usesEnqueueDequeue = /\.(offer|poll|add|remove|peek|addLast|removeFirst|offerLast|pollFirst|peekFirst)\s*\(/.test(content);
  const usesDequeWindowPattern =
    /(while\s*\(\s*!?\w+\.isEmpty\(\)\s*&&[\s\S]{0,120}(peekFirst|peekLast)\s*\(\)|removeFirst\(\)|removeLast\(\)|pollFirst\(\)|pollLast\(\))/.test(content) &&
    /\b(?:Deque<|ArrayDeque<)/.test(content);

  return {
    usesEnqueueDequeue,
    usesArrayQueueImplementation:
      /\b(?:front|rear)\b/.test(content) &&
      /\w+\s*\[\s*(?:rear|front)(?:\+\+|\s*)\s*\]/.test(content) &&
      /(?:front\+\+|rear\+\+|\+\+front|\+\+rear)/.test(content),
    usesCircularQueuePattern:
      /(front|rear|size|capacity|count)[\s\S]{0,140}%|rear\s*=\s*\(rear\s*\+\s*1\)\s*%|front\s*=\s*\(front\s*\+\s*1\)\s*%/.test(content),
    usesDequeWindowPattern,
    usesBfsStyleQueue:
      hasQueueStructure &&
      /(levelSize|while\s*\(\s*!?\w+\.isEmpty\(\)\s*\)|poll\(\)|offer\(\))/.test(content),
    usesQueueSimulation:
      hasQueueStructure &&
      usesEnqueueDequeue &&
      /(?:for|while)\s*\(/.test(content),
    generatesBinaryNumbers:
      hasQueueStructure &&
      /(?:poll|remove)\s*\(\)[\s\S]{0,180}\+\s*"0"[\s\S]{0,180}\+\s*"1"/.test(content),
    usesGridBfs:
      hasQueueStructure &&
      /(?:grid|matrix|rows?|cols?|directions?|dr|dc|fresh|rotten)/i.test(content) &&
      /(?:offer|add)\s*\([^)]*(?:row|col|r|c|new\s+int\s*\[)/i.test(content),
    usesBoundedPriorityQueue:
      /\bPriorityQueue</.test(content) &&
      /(?:size\s*\(\)\s*>\s*k|size\s*\(\)\s*==\s*k|while\s*\([^)]*size\s*\(\)[^)]*k)/.test(content) &&
      /\.(?:poll|remove)\s*\(\)/.test(content),
    usesTaskScheduling:
      (/\bPriorityQueue</.test(content) && hasQueueStructure && /(?:cooldown|release|time|interval|task|frequency)/i.test(content)) ||
      (/(?:radiant|dire|senate)/i.test(content) && /(?:offer|add)\s*\([^)]*\+\s*n\s*\)/.test(content)) ||
      (hasQueueStructure && /frequency|count/i.test(content) && /while\s*\(\s*!\w+\.isEmpty\(\)/.test(content)),
    usesCircularTour:
      /(?:totalBalance|totalFuel|total|currentBalance|currentFuel|tank|start)\w*/i.test(content) &&
      /(?:currentBalance|currentFuel|tank)\w*\s*<\s*0/i.test(content) &&
      /(?:start|candidate)\w*\s*=\s*\w+\s*\+\s*1/.test(content),
    hasEdgeCaseHandling: /(isEmpty\(\)|n\s*==\s*0|length\(\)\s*==\s*0|arr\.length\s*==\s*0|null|size\s*==\s*0)/.test(content)
  };
}

function detectTree(content: string) {
  const usesTreeNodePattern =
    /(TreeNode|Node)\s+\w+|class\s+TreeNode|class\s+Node|root\.(left|right)|\w+\.(left|right)/.test(content);
  const usesRecursiveTraversal =
    /(preorder|inorder|postorder|dfs|traverse|height|depth|diameter|maxPath|isBalanced)\s*\([^)]*\)\s*\{[\s\S]{0,400}\w+\s*\(\s*\w+\.(left|right)\s*\)/.test(content);
  const usesQueueTraversal =
    usesTreeNodePattern &&
    /(Queue<|ArrayDeque<|LinkedList<)[\s\S]{0,320}(offer|poll|peek)/.test(content);

  return {
    usesTreeNodePattern,
    usesRecursiveTraversal,
    usesQueueTraversal,
    usesBstLogic:
      /(root\.val|node\.val|current\.val|data)\s*[<>]=?\s*(low|high|target|key|val)|target\s*[<>]=?\s*(root|node|current)\.val|\w+\.val\s*[<>]=?\s*\w+\.val|isValidBST|minValue|maxValue/.test(content),
    usesTreeConstruction:
      /(buildTree|construct|preorderIndex|postorderIndex|inorderMap|splitIndex|mid\s*=|new\s+TreeNode|new\s+Node)/.test(content),
    usesLcaPattern:
      /(lowestCommonAncestor|lca)\s*\(|if\s*\(\s*root\s*==\s*p\s*\|\||if\s*\(\s*root\s*==\s*q\s*\|\|left\s*!=\s*null\s*&&\s*right\s*!=\s*null/.test(content),
    hasEdgeCaseHandling:
      /(root\s*==\s*null|node\s*==\s*null|null\s*==\s*root|null\s*==\s*node|queue\.isEmpty\(\))/i.test(content)
  };
}

function detectAdvancedTreeTechniques(facts: CodeFacts, content: string): void {
  const hasTree = hasFact(facts, "tree-node");
  const structuralRecursion = /\b(\w+)\s*\([^)]*\)\s*\{[\s\S]{0,500}\1\s*\(\s*\w+\.left[\s\S]{0,260}\1\s*\(\s*\w+\.right/.test(content);
  const recursiveTraversal = hasFact(facts, "recursive-tree-traversal") || structuralRecursion;
  if (structuralRecursion && !hasFact(facts, "recursive-tree-traversal")) {
    addFact(facts, "algorithms", "recursive-tree-traversal", "high", ["same method recurses on left and right children"]);
  }

  if (
    recursiveTraversal &&
    /(?:Math\.)?max\s*\(\s*\w+\s*\(\s*\w+\.left\s*\)\s*,\s*\w+\s*\(\s*\w+\.right\s*\)\s*\)\s*\+\s*1|1\s*\+\s*(?:Math\.)?max\s*\(/.test(content)
  ) {
    addFact(facts, "algorithms", "tree-height", "high", ["one plus maximum child height"]);
  }
  if (
    recursiveTraversal &&
    /(?:diameter|maxDiameter|bestDiameter|longestPath)\w*/i.test(content) &&
    /(?:leftHeight|leftDepth|left)\s*\+\s*(?:rightHeight|rightDepth|right)/i.test(content)
  ) {
    addFact(facts, "algorithms", "tree-diameter", "high", ["left and right heights update longest path"]);
  }
  if (
    recursiveTraversal &&
    /Math\.abs\s*\(\s*\w+\s*-\s*\w+\s*\)\s*>\s*1/.test(content) &&
    /return\s+-1|(?:balanced|isBalanced)/i.test(content)
  ) {
    addFact(facts, "algorithms", "balanced-tree-check", "high", ["height difference checked and failure propagated"]);
  }
  if (
    hasTree &&
    /(?:target|key|value)\s*<\s*\w+\.val[\s\S]{0,140}\w+\s*=\s*\w+\.left|(?:target|key|value)\s*>\s*\w+\.val[\s\S]{0,140}\w+\s*=\s*\w+\.right/.test(content)
  ) {
    addFact(facts, "algorithms", "bst-search", "high", ["BST comparison chooses one child"]);
  }
  if (
    hasFact(facts, "bst-logic") &&
    /(?:insert|delete|remove)\w*\s*\(/i.test(content) &&
    /(?:root|node)\.(?:left|right)\s*=\s*\w+\s*\(\s*(?:root|node)\.(?:left|right)/.test(content)
  ) {
    addFact(facts, "algorithms", "bst-mutation", "high", ["BST child link updated recursively"]);
  }
  if (
    hasFact(facts, "level-order-tree-traversal") &&
    (/(?:levelSize|size)\s*=\s*\w+\.size\s*\(\)[\s\S]{0,260}(?:i\s*==\s*0|i\s*==\s*(?:levelSize|size)\s*-\s*1)/.test(content) ||
      /(?:horizontalDistance|hd|column)\w*[\s\S]{0,240}(?:Map<|TreeMap<|putIfAbsent|containsKey)/.test(content))
  ) {
    addFact(facts, "algorithms", "tree-view", "high", ["one visible node retained per level or horizontal distance"]);
  }
  if (
    hasTree &&
    /(?:preorder|postorder)\s*\[[^\]]+\][\s\S]{0,300}(?:inorder|inorderMap|indexMap)/.test(content) &&
    /new\s+(?:TreeNode|Node)\s*\(/.test(content)
  ) {
    addFact(facts, "algorithms", "tree-construction", "high", ["traversal root creates node and inorder splits ranges"]);
  }
  if (
    hasFact(facts, "level-order-tree-traversal") &&
    /["']#["']|["']null["']/.test(content) &&
    /(?:StringBuilder|List<String>|tokens|serialized|output)/i.test(content)
  ) {
    addFact(facts, "algorithms", "tree-serialization", "high", ["level order emits explicit null markers"]);
  }
  if (
    recursiveTraversal &&
    /(?:height|depth)\s*\(\s*\w+\.(?:left|right)\s*\)/.test(content) &&
    (content.match(/(?:height|depth)\s*\(/g)?.length ?? 0) >= 4
  ) {
    addFact(facts, "antiPatterns", "repeated-tree-height", "medium", ["height recomputed from multiple nodes"]);
    addFact(facts, "complexitySignals", "quadratic-candidate", "medium", ["repeated subtree height traversal"]);
  }
}

function detectGraph(content: string) {
  const usesGraphAdjacency =
    /(ArrayList<.*>.*graph|List<.*>.*graph|\badj\b|adjacency|neighbors|edges)/.test(content);
  const hasVisitedState = /(visited|vis)\s*\[/.test(content);
  const hasQueue = /\b(?:Queue<|ArrayDeque<|Deque<)/.test(content);
  const hasStack = /\bStack<|Deque<|ArrayDeque</.test(content);
  const hasBfsName = /\bbfs\s*\(/i.test(content);
  const hasDfsName = /\bdfs\s*\(/i.test(content);
  const hasNeighborIteration = /(?:graph|adj|neighbors)\s*\.get\s*\(|for\s*\([^:]+:\s*(?:graph|adj|neighbors)/.test(content);
  const usesGraphTraversal =
    hasVisitedState ||
    hasBfsName ||
    hasDfsName ||
    (usesGraphAdjacency && (hasQueue || hasStack || hasNeighborIteration));

  return {
    usesGraphAdjacency,
    usesGraphTraversal,
    usesBfsTraversal: usesGraphAdjacency && (hasBfsName || (hasQueue && /\.(offer|poll)\s*\(/.test(content))),
    usesDfsTraversal: usesGraphAdjacency && (hasDfsName || (hasStack && /\.(push|pop)\s*\(/.test(content))),
    usesTopologicalSort:
      /(indegree|inDegree|topo|topological|Queue<.*>\s+\w+.*indegree|dfsOrder|stack\.push)/.test(content),
    usesShortestPath:
      /(dist\s*\[|distance|PriorityQueue<|relax|weight|dijkstra|bellman|floyd)/i.test(content),
    usesDisjointSet:
      /(parent\s*\[|rank\s*\[|size\s*\[|find\s*\(|union\s*\(|path compression)/i.test(content),
    usesMstLogic:
      /(kruskal|prim|PriorityQueue<|mst|minimum spanning|union\s*\()/i.test(content),
    hasEdgeCaseHandling:
      /(n\s*==\s*0|graph\.size\(\)\s*==\s*0|visited|queue\.isEmpty\(\)|pq\.isEmpty\(\)|null)/.test(content)
  };
}

function detectAdvancedGraphTechniques(facts: CodeFacts, content: string): void {
  const hasAdjacency = hasFact(facts, "graph-adjacency");
  const hasBfs =
    hasFact(facts, "graph-bfs") ||
    hasFact(facts, "bfs-grid-processing");
  const hasDfs = hasFact(facts, "graph-dfs");

  if (
    hasDfs &&
    /for\s*\([^)]*(?:i|node|vertex)[^)]*\)[\s\S]{0,240}!\s*(?:visited|vis)\s*\[[^\]]+\][\s\S]{0,180}(?:components|count)\s*\+\+/i.test(content)
  ) {
    addFact(facts, "algorithms", "connected-components", "high", ["new traversal launched for each unvisited vertex"]);
  }
  if (
    (hasDfs && /(?:neighbor|nei)\s*!=\s*parent|parent\s*!=\s*(?:neighbor|nei)/.test(content)) ||
    /(?:recStack|inPath|pathVisited|state)\s*\[[^\]]+\]|processed\w*\s*<\s*n/i.test(content)
  ) {
    addFact(facts, "algorithms", "graph-cycle-detection", "high", ["parent, recursion state, or processed-count cycle check"]);
  }
  if (
    /(?:grid|matrix|rows?|cols?|directions?|dr|dc)/i.test(content) &&
    (hasBfs || hasDfs || hasFact(facts, "bfs-grid-processing")) &&
    /(?:row|col|nextRow|nextCol|nr|nc)/i.test(content)
  ) {
    addFact(facts, "algorithms", "grid-graph-traversal", "high", ["row/column states expanded through direction offsets"]);
  }
  if (
    hasBfs &&
    /(?:dist|distance)(?:\s*\[[^\]]+\])+\s*=\s*(?:dist|distance)(?:\s*\[[^\]]+\])+\s*\+\s*1/.test(content)
  ) {
    addFact(facts, "algorithms", "unweighted-shortest-path", "high", ["BFS distance increases by one edge"]);
  }
  if (
    /PriorityQueue</.test(content) &&
    /(?:dist|distance)\s*\[[^\]]+\]\s*>\s*(?:dist|distance)\s*\[[^\]]+\]\s*\+\s*(?:weight|w)|(?:dist|distance)\s*\[[^\]]+\]\s*\+\s*(?:weight|w)\s*<\s*(?:dist|distance)\s*\[[^\]]+\]/.test(content)
  ) {
    addFact(facts, "algorithms", "dijkstra", "high", ["min-priority queue performs weighted distance relaxation"]);
  }
  if (
    hasFact(facts, "disjoint-set-union") &&
    /parent\s*\[[^\]]+\]\s*=\s*(?:find|findParent)\s*\(\s*parent\s*\[[^\]]+\]\s*\)/.test(content) &&
    /(?:rank|size)\s*\[/.test(content)
  ) {
    addFact(facts, "algorithms", "union-find-optimized", "high", ["path compression with rank or size"]);
  }
  if (
    (hasFact(facts, "disjoint-set-union") && hasFact(facts, "sorting") && /(?:cost|weight|mst)\s*\+=/i.test(content)) ||
    (/PriorityQueue</.test(content) && /(?:visited|inMst|mst)\s*\[[^\]]+\]/i.test(content) && /(?:cost|weight|total)\s*\+=/i.test(content))
  ) {
    addFact(facts, "algorithms", "minimum-spanning-tree", "high", ["Kruskal or Prim selects lightest cycle-free edges"]);
  }
}

function detectDynamicProgramming(content: string) {
  const memoPattern = /(memo|dp)\s*\[|HashMap<.*>\s+\w+|Map<.*>\s+\w+[\s\S]{0,180}return\s+\w+\[/;
  const dpState = String.raw`dp(?:\s*\[[^\]]+\])+`;
  const bottomUpPattern = new RegExp(`${dpState}\\s*=|for\\s*\\(\\s*int\\s+i\\s*=\\s*1|for\\s*\\(\\s*int\\s+idx\\s*=\\s*1`);
  const stateTransitionPattern =
    new RegExp(`${dpState}\\s*=\\s*Math\\.(?:max|min)|${dpState}\\s*=\\s*${dpState}\\s*[+\\-*\\/]|take|notTake|pick|skip`);
  const spaceOptPattern = /(prev|curr|next)\b|rolling|oneD|1d dp|dp\s*=\s*new\s+int\s*\[/i;
  const knapsackPattern = /(capacity|weight|weights|values|target|sum)\b[\s\S]{0,220}dp\s*\[/i;
  const intervalPattern =
    /(gap|len|length)\b[\s\S]{0,220}for\s*\(\s*int\s+i|for\s*\(\s*int\s+j\s*=/;
  const recursivePattern =
    /\b\w+\s*\(\s*[^)]*\)\s*\{[\s\S]{0,500}\b\w+\s*\(\s*[^)]*\)/;

  return {
    usesMemoTable: memoPattern.test(content) && recursivePattern.test(content),
    usesBottomUpDp: bottomUpPattern.test(content),
    usesStateTransition: stateTransitionPattern.test(content),
    usesSpaceOptimization: spaceOptPattern.test(content) && bottomUpPattern.test(content),
    usesKnapsackPattern: knapsackPattern.test(content) && bottomUpPattern.test(content),
    usesIntervalDp: intervalPattern.test(content),
    hasEdgeCaseHandling:
      /(n\s*==\s*0|index\s*<\s*0|target\s*==\s*0|if\s*\(\s*\w+\s*==\s*null|arr\.length\s*==\s*0)/.test(content)
  };
}

function detectAdvancedDynamicProgramming(facts: CodeFacts, content: string): void {
  const functionNames = detectMethodNames(content);
  const recursiveCalls = functionNames.reduce(
    (highest, name) => Math.max(highest, content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0),
    0
  );
  const hasMemoization = hasFact(facts, "dp-memoization");
  const hasRollingState =
    /\b(?:prev|prev1|prev2|previous|curr|current|next)\w*\b/i.test(content) &&
    /\b(?:for|while)\s*\(/.test(content) &&
    /(?:prev|previous|curr|current|next)\w*\s*=\s*[^;]*(?:prev|previous|curr|current)/i.test(content);

  if (hasRollingState) {
    addFact(facts, "algorithms", "bottom-up-dp", "high", ["iterative recurrence filled in dependency order"]);
    addFact(facts, "algorithms", "dp-state-transition", "high", ["rolling state derived from previous states"]);
    addFact(facts, "algorithms", "dp-space-optimization", "high", ["constant-size rolling DP state"]);
    addFact(facts, "complexitySignals", "reduced-dp-space", "high", ["full DP table replaced by rolling variables"]);
  }
  if (
    /(?:int|long|boolean|double)\s*\[\]\s*\[\]\s+(?:dp|memo)|(?:dp|memo)\s*\[[^\]]+\]\s*\[[^\]]+\]/.test(content) &&
    /(?:row|col|grid|\bi\b|\bj\b)/i.test(content) &&
    /(?:\[[^\]]*-\s*1\]\s*\[[^\]]+\]|\[[^\]]+\]\s*\[[^\]]*-\s*1\])/.test(content)
  ) {
    addFact(facts, "algorithms", "grid-dp", "high", ["two-dimensional state depends on neighboring cells"]);
  }
  if (
    /(?:nums|arr|values|sequence)\s*\[\s*j\s*\]\s*[<>]\s*(?:nums|arr|values|sequence)\s*\[\s*i\s*\]/i.test(content) &&
    /dp\s*\[\s*i\s*\][\s\S]{0,120}dp\s*\[\s*j\s*\]\s*\+\s*1/.test(content)
  ) {
    addFact(facts, "algorithms", "sequence-dp", "high", ["best sequence ending at i extends a valid state ending at j"]);
  }
  if (
    /(?:charAt\s*\(|\.length\s*\(\)|String\b)/.test(content) &&
    /(?:dp|memo)\s*\[[^\]]+\]\s*\[[^\]]+\]/.test(content) &&
    /(?:charAt\s*\([^)]*-\s*1\)|charAt\s*\(\s*i\s*\)|charAt\s*\(\s*j\s*\))/.test(content)
  ) {
    addFact(facts, "algorithms", "string-dp", "high", ["two-dimensional states compare string characters"]);
  }
  if (recursiveCalls >= 3 && !hasMemoization) {
    addFact(facts, "antiPatterns", "exponential-dp-recursion", "high", ["overlapping recursive branches are not cached"]);
  }
}

function detectBitManipulation(content: string) {
  const normalBitMaskPattern = /(1\s*<<|>>\s*1|&\s*1|\|\s*\(|\^\s*\()/;
  const hardcodedBranchPattern = /if\s*\(\s*[\w\s<>=!&|()+-]+\)\s*return\s+\d+\s*;/g;
  const hardcodedAssignmentPattern = /\b(?:int|long)\s+\w+\s*=\s*\d+\s*;/g;
  const hardcodedBranchCount = content.match(hardcodedBranchPattern)?.length ?? 0;
  const hardcodedAssignmentCount = content.match(hardcodedAssignmentPattern)?.length ?? 0;
  const usesBitwiseOperators = /[&|^~]|<<|>>/.test(content);

  return {
    usesAnd: /&/.test(content) && !/&&/.test(content),
    usesOr: /\|/.test(content) && !/\|\|/.test(content),
    usesXor: /\^/.test(content),
    usesLeftShift: /<</.test(content),
    usesRightShift: />>/.test(content),
    usesNot: /~/.test(content),
    usesPowerOfTwoPattern:
      /n\s*&\s*\(\s*n\s*-\s*1\s*\)|\w+\s*&=\s*\(\s*\w+\s*-\s*1\s*\)/.test(content),
    usesStringConversion:
      /(Integer\.toBinaryString|toString\(\s*n\s*,\s*2\s*\)|StringBuilder|StringBuffer)/.test(content),
    usesModuloDivision: /[%\/]\s*2/.test(content),
    hasBitHardcoding:
      (!usesBitwiseOperators && hardcodedBranchCount >= 1) ||
      (hardcodedAssignmentCount >= 2 && !normalBitMaskPattern.test(content)),
    hasEdgeCaseHandling:
      /(n\s*<=?\s*0|n\s*==\s*0|if\s*\(\s*\w+\s*<\s*0|\bnull\b)/.test(content)
  };
}

function estimateNestedLoopDepth(content: string): number {
  const lines = content.split(/\r?\n/);
  let depth = 0;
  let maxLoopDepth = 0;
  const loopBraceDepths: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/\b(for|while)\s*\(/.test(trimmed)) {
      loopBraceDepths.push(depth);
      maxLoopDepth = Math.max(maxLoopDepth, loopBraceDepths.length);
    }

    depth += (line.match(/\{/g) ?? []).length;
    depth -= (line.match(/\}/g) ?? []).length;

    while (loopBraceDepths.length > 0 && depth <= loopBraceDepths[loopBraceDepths.length - 1]) {
      loopBraceDepths.pop();
    }
  }

  return maxLoopDepth;
}

function hasPoorVariableNames(variableNames: string[]): boolean {
  const poorNames = new Set(["a", "b", "x", "y", "temp", "ans", "st", "res"]);
  return variableNames.some((name) => poorNames.has(name)) && variableNames.length > 3;
}
