import { addFact, CodeFacts, createEmptyCodeFacts } from "../facts";
import { detectOpposingPointerMovement } from "./pointerMovement";

const variableDeclarationRegex =
  /\b(?:int|long|long long|bool|char|string|auto|vector<[^;=]+>|map<[^;=]+>|unordered_map<[^;=]+>|set<[^;=]+>|unordered_set<[^;=]+>|stack<[^;=]+>|queue<[^;=]+>|deque<[^;=]+>|priority_queue<[^;=]+>|ListNode\s*\*|TreeNode\s*\*|Node\s*\*)\s+([a-zA-Z_]\w*)/g;

export function extractCppCodeFacts(content: string): CodeFacts {
  const facts = createEmptyCodeFacts("cpp");
  const loopMatches = content.match(/\b(for|while)\s*\(/g) ?? [];
  const arrayAccessMatches = content.match(/\[[^\]]+\]/g) ?? [];

  facts.metrics.loopCount = loopMatches.length;
  facts.metrics.nestedLoopDepth = estimateNestedLoopDepth(content);
  facts.metrics.methodCount = detectFunctionNames(content).length;
  facts.metrics.variableNames = extractVariableNames(content);
  facts.metrics.arrayAccessCount = arrayAccessMatches.length;

  if (loopMatches.length > 0) addFact(facts, "controlFlow", "loop", "high", loopMatches);
  if (facts.metrics.nestedLoopDepth >= 2) {
    addFact(facts, "controlFlow", "nested-loop", "medium", ["loop inside loop"]);
    addFact(facts, "complexitySignals", "quadratic-candidate", "medium", ["nested loop"]);
  } else if (loopMatches.length === 1) {
    addFact(facts, "complexitySignals", "single-pass", "medium", ["one loop"]);
  }

  detectCollections(facts, content, arrayAccessMatches);
  detectArrayAlgorithms(facts, content);
  detectStackAndQueue(facts, content);
  detectRecursion(facts, content);
  detectBinarySearch(facts, content);
  detectLinkedList(facts, content);
  detectTree(facts, content);
  detectGraph(facts, content);
  detectDynamicProgramming(facts, content);
  detectBitManipulation(facts, content);

  if (/(n\s*==\s*0|\.empty\s*\(\)|nullptr|target\s*==\s*0|\.size\s*\(\)\s*==\s*0)/.test(content)) {
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

function detectCollections(facts: CodeFacts, content: string, arrayAccessMatches: string[]): void {
  if (arrayAccessMatches.length > 0 || /\b(?:vector|array)<|new\s+\w+\s*\[/.test(content)) {
    addFact(facts, "dataStructures", "array", "high", arrayAccessMatches.slice(0, 4));
    addFact(facts, "structures", "indexed-access", "high", arrayAccessMatches.slice(0, 4));
  }
  if (/\b(?:map|unordered_map)</.test(content)) addFact(facts, "dataStructures", "hash-map", "high", ["map/unordered_map"]);
  if (/\b(?:set|unordered_set)</.test(content)) addFact(facts, "dataStructures", "hash-set", "high", ["set/unordered_set"]);
  if (/\b(?:stack|deque)</.test(content)) addFact(facts, "dataStructures", "stack-like", "high", ["stack/deque"]);
  if (/\b(?:queue|deque)</.test(content)) addFact(facts, "dataStructures", "queue-like", "high", ["queue/deque"]);
  if (/\bpriority_queue</.test(content)) addFact(facts, "dataStructures", "priority-queue", "high", ["priority_queue"]);
}

function detectArrayAlgorithms(facts: CodeFacts, content: string): void {
  if (/(prefix|pref)\s*\[|runningSum|sum\s*\+=\s*\w+\s*\[/.test(content)) {
    addFact(facts, "algorithms", "prefix-sum", "high", ["prefix/running sum"]);
  }
  if (detectTwoPointerMovement(content)) {
    addFact(facts, "algorithms", "two-pointers", "high", ["opposite pointer movement"]);
    addFact(facts, "complexitySignals", "single-pass", "medium", ["pointer scan"]);
  }
  if (/(windowSum|curr(?:ent)?Sum|while\s*\(\s*\w*sum\w*\s*>|\w*sum\w*\s*-=|\w*sum\w*\s*\+=)/i.test(content) && /\b(for|while)\s*\(/.test(content)) {
    addFact(facts, "algorithms", "sliding-window", "medium", ["window sum adjustment"]);
    addFact(facts, "complexitySignals", "linear-amortized", "medium", ["window boundaries move forward"]);
  }
  if (/\b(?:sort|stable_sort)\s*\(/.test(content)) {
    addFact(facts, "algorithms", "sorting", "high", ["sort call"]);
    addFact(facts, "complexitySignals", "n-log-n-candidate", "medium", ["sort call"]);
  }
  detectArrayTechniques(facts, content);
}

function detectArrayTechniques(facts: CodeFacts, content: string): void {
  const hasArrayLoop = facts.metrics.loopCount > 0 && facts.dataStructures.some((item) => item.id === "array");
  if (hasArrayLoop) {
    addFact(facts, "algorithms", "array-traversal", "high", ["loop with indexed array access"]);
  }

  if (
    hasArrayLoop &&
    (/\b(?:min|max|minimum|maximum|largest|smallest|best)\w*\b\s*=\s*(?:std::)?(?:min|max)\s*\(/i.test(content) ||
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

  if (/\bswap\s*\(\s*\w+\s*\[[^\]]+\]\s*,\s*\w+\s*\[[^\]]+\]\s*\)/.test(content) && hasFactInBuckets(facts, "two-pointers")) {
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
    hasFactInBuckets(facts, "hash-map") &&
    /(?:\+\+\s*(?:freq|count|frequency)\w*\s*\[|(?:freq|count|frequency)\w*\s*\[[^\]]+\]\s*(?:\+\+|\+=)|\.find\s*\(|\.count\s*\()/i.test(content)
  ) {
    addFact(facts, "algorithms", "frequency-counting", "high", ["map count updated per value"]);
  }

  if (
    /\b(?:currentSum|currSum|maxEndingHere|localMax|runningMax)\b/i.test(content) &&
    /(?:std::)?max\s*\([^,]+,\s*[^)]*\+[^)]*\)|\b(?:currentSum|currSum|maxEndingHere|localMax)\b\s*=\s*(?:std::)?max/i.test(content)
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
    /(?:(?:std::)?min|<[\s\S]{0,100}(?:minPrice|lowestPrice|buyPrice))/.test(content)
  ) {
    addFact(facts, "algorithms", "stock-profit", "high", ["minimum price and best profit tracked"]);
  }
}

function hasFactInBuckets(facts: CodeFacts, id: string): boolean {
  return [
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].some((item) => item.id === id);
}

function detectStackAndQueue(facts: CodeFacts, content: string): void {
  const stackOperations = /\.(push|pop|top|push_back|pop_back|back)\s*\(/.test(content);
  const queueOperations = /\.(push|pop|front|push_back|pop_front|front)\s*\(/.test(content);
  if (stackOperations) addFact(facts, "structures", "stack-operations", "high", ["push/pop/top or deque back operation"]);
  if (queueOperations) addFact(facts, "structures", "queue-operations", "high", ["push/pop/front queue operation"]);

  if (
    /\b(?:stack|deque)</.test(content) &&
    /while\s*\(\s*!\w+\.empty\s*\(\)\s*&&[\s\S]{0,180}(?:top|back)\s*\(\)[\s\S]{0,100}[<>]=?/.test(content)
  ) {
    addFact(facts, "algorithms", "monotonic-stack", "high", ["stack top comparison inside while"]);
    addFact(facts, "complexitySignals", "linear-amortized", "medium", ["each element pushed/popped around once"]);
  }
  if (/[\(\)\[\]\{\}]/.test(content) && stackOperations) {
    addFact(facts, "algorithms", "parenthesis-matching", "medium", ["bracket characters with stack operations"]);
  }
  if (/(precedence|isOperator|postfix|infix|prefix|isalnum|isdigit)/.test(content) && stackOperations) {
    addFact(facts, "algorithms", "expression-conversion", "medium", ["operator precedence/expression tokens"]);
  }
  if (/(minStack|minValues|minHistory|currentMin)/.test(content) && stackOperations) {
    addFact(facts, "algorithms", "min-stack", "medium", ["minimum tracking with stack operations"]);
  }
  if (/(front|rear|size|capacity|count)[\s\S]{0,140}%|rear\s*=\s*\(rear\s*\+\s*1\)\s*%|front\s*=\s*\(front\s*\+\s*1\)\s*%/.test(content)) {
    addFact(facts, "algorithms", "circular-queue", "high", ["front/rear index wraps with modulo"]);
  }
  if (
    /\b(?:front|rear)\b/.test(content) &&
    /\w+\s*\[\s*(?:rear|front)(?:\+\+|\s*)\s*\]/.test(content) &&
    /(?:front\+\+|rear\+\+|\+\+front|\+\+rear)/.test(content)
  ) {
    addFact(facts, "dataStructures", "array-queue-implementation", "high", ["array with front and rear pointers"]);
    addFact(facts, "structures", "queue-operations", "high", ["front/rear array enqueue and dequeue"]);
  }
  if (
    /\bdeque</.test(content) &&
    /while\s*\(\s*!\w+\.empty\s*\(\)\s*&&[\s\S]{0,180}(?:front|back)\s*\(\)[\s\S]{0,160}(?:pop_front|pop_back)\s*\(/.test(content)
  ) {
    addFact(facts, "algorithms", "deque-window", "high", ["deque removes expired or noncompetitive entries"]);
    addFact(facts, "complexitySignals", "linear-amortized", "medium", ["window entries enter and leave deque at most once"]);
  }
  if (/\b(?:queue|deque)</.test(content) && /while\s*\(\s*!\w+\.empty\s*\(\)\s*\)/.test(content)) {
    addFact(facts, "algorithms", "bfs-queue-processing", "medium", ["queue drained until empty"]);
  }
  if (/\b(?:queue|deque)</.test(content) && queueOperations && /(?:for|while)\s*\(/.test(content)) {
    addFact(facts, "algorithms", "queue-simulation", "medium", ["FIFO state repeatedly consumed and extended"]);
  }
  if (
    /\bqueue\s*<\s*string/.test(content) &&
    /\.(?:front)\s*\(\)[\s\S]{0,180}\+\s*"0"[\s\S]{0,180}\+\s*"1"/.test(content)
  ) {
    addFact(facts, "algorithms", "generate-binary-numbers", "high", ["popped string produces 0 and 1 children"]);
  }
  if (
    /\b(?:queue|deque)</.test(content) &&
    /(?:grid|matrix|rows?|cols?|directions?|dr|dc|fresh|rotten)/i.test(content) &&
    /\.(?:push|push_back)\s*\([^)]*(?:row|col|r|c|make_pair|\{)/i.test(content)
  ) {
    addFact(facts, "algorithms", "bfs-grid-processing", "high", ["queued row/column states expanded through directions"]);
  }
  if (
    /\bpriority_queue</.test(content) &&
    /(?:size\s*\(\)\s*>\s*k|size\s*\(\)\s*==\s*k|while\s*\([^)]*size\s*\(\)[^)]*k)/.test(content) &&
    /\.pop\s*\(\)/.test(content)
  ) {
    addFact(facts, "algorithms", "bounded-priority-queue", "high", ["heap maintained at size k"]);
  }
  if (
    (/\bpriority_queue</.test(content) && /\b(?:queue|deque)</.test(content) && /(?:cooldown|release|time|interval|task|frequency)/i.test(content)) ||
    (/(?:radiant|dire|senate)/i.test(content) && /\.(?:push|push_back)\s*\([^)]*\+\s*n\s*\)/.test(content)) ||
    (/\b(?:queue|deque)</.test(content) && /frequency|count/i.test(content) && /while\s*\(\s*!\w+\.empty\s*\(\)/.test(content))
  ) {
    addFact(facts, "algorithms", "task-scheduling-queue", "high", ["queued tasks or indices re-enter after time/order advances"]);
  }
  if (
    /(?:totalBalance|totalFuel|total|currentBalance|currentFuel|tank|start)\w*/i.test(content) &&
    /(?:currentBalance|currentFuel|tank)\w*\s*<\s*0/i.test(content) &&
    /(?:start|candidate)\w*\s*=\s*\w+\s*\+\s*1/.test(content)
  ) {
    addFact(facts, "algorithms", "circular-tour", "high", ["running balance resets candidate start"]);
  }
  if (/(\.empty\s*\(\)|size\s*==\s*0|n\s*==\s*0)/.test(content)) {
    addFact(facts, "edgeCaseSignals", "queue-edge-check", "medium", ["empty queue/input guard"]);
  }
  detectAdvancedStackTechniques(facts, content);
}

function detectAdvancedStackTechniques(facts: CodeFacts, content: string): void {
  const hasOperations = hasFactInBuckets(facts, "stack-operations");
  const hasStack = hasFactInBuckets(facts, "stack-like") || hasOperations;

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
    /(?:\bresult\b|\boutput\b|\breversed\b|string)/i.test(content) &&
    /while\s*\(\s*!\w+\.empty\s*\(\)\s*\)[\s\S]{0,220}\.(?:top|back)\s*\(\)[\s\S]{0,100}\.(?:pop|pop_back)\s*\(\)/.test(content)
  ) {
    addFact(facts, "algorithms", "reverse-using-stack", "high", ["append values while popping stack"]);
  }

  const popCount = content.match(/\.(?:pop|pop_back)\s*\(\)/g)?.length ?? 0;
  if (
    hasOperations &&
    popCount >= 2 &&
    /(?:isdigit|isOperator|[+\-*/])/.test(content) &&
    /(?:switch\s*\(|case\s*['"][+\-*/]['"]|if\s*\([^)]*[+\-*/])/.test(content)
  ) {
    addFact(facts, "algorithms", "stack-expression-evaluation", "high", ["two operands popped and combined"]);
  }

  if (
    hasStack &&
    /(while\s*\(\s*!\w+\.empty\s*\(\)[\s\S]{0,180}\.(?:top|back|pop|pop_back)\s*\(|\.(?:top|back)\s*\(\)[\s\S]{0,160}\.(?:push|pop|push_back|pop_back)\s*\()/i.test(content)
  ) {
    addFact(facts, "algorithms", "stack-simulation", "medium", ["conditional stack state simulation"]);
  }

  if (hasFactInBuckets(facts, "monotonic-stack")) {
    if (/\bspan\b|i\s*-\s*\w+\.(?:top|back)\s*\(\)|i\s*\+\s*1/.test(content)) {
      addFact(facts, "algorithms", "stock-span", "high", ["span derived from previous greater index"]);
    }
    if (
      /(?:nextGreater|dailyTemperatures|warmer|answer|ans)\w*/i.test(content) &&
      /(?:<=|<)[\s\S]{0,100}(?:top|back)\s*\(|(?:top|back)\s*\(\)[\s\S]{0,100}(?:<=|<)/.test(content)
    ) {
      addFact(facts, "algorithms", "next-greater-element", "high", ["monotonic stack resolves greater value"]);
    }
    if (
      /(?:previousSmaller|prevSmaller|smaller|answer|ans)\w*/i.test(content) &&
      /(?:>=|>)[\s\S]{0,100}(?:top|back)\s*\(|(?:top|back)\s*\(\)[\s\S]{0,100}(?:>=|>)/.test(content)
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

function detectRecursion(facts: CodeFacts, content: string): void {
  const methodNames = detectFunctionNames(content);
  const callCounts = methodNames.map((name) => ({
    name,
    count: content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0
  }));
  const hasRecursiveCall = callCounts.some((item) => item.count >= 2);
  const hasMultipleRecursiveCalls = callCounts.some((item) => item.count >= 3);

  if (hasRecursiveCall) addFact(facts, "controlFlow", "recursive-call", "high", methodNames);
  if (hasRecursiveCall && /(if\s*\([^)]*(==|<=|>=|<|>)[^)]*\)\s*(return|{)|return\s+\w+\s*;)/.test(content)) {
    addFact(facts, "controlFlow", "base-case", "medium", ["conditional return"]);
    addFact(facts, "edgeCaseSignals", "recursive-base-case", "medium", ["conditional return"]);
  }
  if (hasMultipleRecursiveCalls) {
    addFact(facts, "controlFlow", "multiple-recursive-calls", "high", methodNames);
    addFact(facts, "algorithms", "tree-recursion", "medium", ["function called more than once"]);
  }
  if (/(dp\s*\[|memo|unordered_map|map<)/.test(content) && hasRecursiveCall) {
    addFact(facts, "algorithms", "memoization", "medium", ["memo/DP map or table"]);
  }
  if (/(\.pop_back\s*\(|used\s*\[\w+\]\s*=\s*false|swap\s*\([^)]*\)\s*;[\s\S]*swap\s*\([^)]*\)\s*;|(?:board|grid)\s*\[[^\]]+\]\s*\[[^\]]+\]\s*=\s*(?:0|'\.'|"\."))/.test(content)) {
    addFact(facts, "algorithms", "backtracking-undo", "high", ["pop/reset/swap undo"]);
  }
  if (hasMultipleRecursiveCalls && /(mid\s*=|merge\s*\(|partition\s*\()/.test(content)) {
    addFact(facts, "algorithms", "divide-and-conquer", "medium", ["mid/partition/merge with recursive branching"]);
  }
  const recursiveCallPattern = methodNames.map(escapeRegex).join("|");
  if (hasRecursiveCall && new RegExp(`return\\s+[^;]*(?:${recursiveCallPattern})\\s*\\(`).test(content)) {
    addFact(facts, "algorithms", "functional-recursion", "high", ["recursive result returned or combined"]);
  }
  if (
    hasRecursiveCall &&
    !hasFactInBuckets(facts, "functional-recursion") &&
    new RegExp(`(?:${recursiveCallPattern})\\s*\\([^)]*,[^)]*\\)`).test(content)
  ) {
    addFact(facts, "algorithms", "parameterized-recursion", "high", ["state or accumulator carried through recursive arguments"]);
  }
  if (hasRecursiveCall && (/\bstring\b|substr\s*\(/.test(content) || (/\w+\s*\[[^\]]+\]/.test(content) && /\bchar\b/.test(content)))) {
    addFact(facts, "algorithms", "recursion-on-strings", "high", ["recursive call processes a string or character range"]);
  }
  if (hasRecursiveCall && /vector\s*<|array\s*<|\w+\s*\[[^\]]+\]/.test(content)) {
    addFact(facts, "algorithms", "recursion-on-arrays", "medium", ["recursive call processes indexed collection state"]);
  }
  if (
    hasMultipleRecursiveCalls &&
    (/(?:pick|skip|take|notTake|include|exclude|push_back)/i.test(content) ||
      hasFactInBuckets(facts, "recursion-on-arrays"))
  ) {
    addFact(facts, "algorithms", "subsequence-generation", "high", ["include/exclude recursive branches"]);
  }
  if (
    hasRecursiveCall &&
    hasFactInBuckets(facts, "backtracking-undo") &&
    facts.metrics.loopCount > 0 &&
    /(?:used\s*\[|swap\s*\(|permutation|permute)/i.test(content)
  ) {
    addFact(facts, "algorithms", "permutation-backtracking", "high", ["choose unused element, recurse, then restore"]);
  }
  if (
    hasFactInBuckets(facts, "backtracking-undo") &&
    /(?:isSafe|isValid|valid|canPlace|board|sudoku|queen|row|column)/i.test(content)
  ) {
    addFact(facts, "algorithms", "recursive-search", "high", ["validity checks prune a recursive state-space search"]);
  }
  if (hasRecursiveCall && !/(\w+\s*-\s*1|\w+\s*\+\s*1|mid|left|right|start|end|idx|index|\/\s*2|%\s*\w+)/.test(content)) {
    addFact(facts, "antiPatterns", "missing-recursive-progress", "medium", ["recursive call without obvious smaller state"]);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectBinarySearch(facts: CodeFacts, content: string): void {
  const hasMid = /\bmid\s*=/.test(content);
  const hasBounds = /\b(left|right|low|high)\b/.test(content);
  const usesBinarySearch = hasMid && hasBounds && /while\s*\(/.test(content);
  if (usesBinarySearch) {
    addFact(facts, "algorithms", "binary-search", "high", ["mid with low/high bounds"]);
    addFact(facts, "complexitySignals", "logarithmic-search", "medium", ["bounds shrink around mid"]);
  }
  if (hasMid && /(ans\s*=|first\s*=|last\s*=|lower_bound|upper_bound|leftMost|rightMost)/.test(content)) {
    addFact(facts, "algorithms", "lower-upper-bound", "medium", ["answer/boundary tracking"]);
  }
  if (hasMid && /(possible|can|isValid|isPossible|hours|capacity|days|bouquets|canFinish)/i.test(content)) {
    addFact(facts, "algorithms", "answer-space-search", "medium", ["predicate search over answer range"]);
  }
  if (hasMid && /(arr|nums|values)\s*\[\s*mid\s*\]/.test(content)) {
    addFact(facts, "algorithms", "sorted-mid-check", "high", ["array mid comparison"]);
  }
  if (
    (hasMid || /\bcut1\s*=\s*(?:low|left)\s*\+\s*\((?:high|right)\s*-\s*(?:low|left)\)\s*\/\s*2/.test(content)) &&
    /(partition|cut1|cut2|left1|left2|right1|right2|maxLeft|minRight)/.test(content)
  ) {
    if (/(?:left1|maxLeft1)\s*<=\s*(?:right2|minRight2)[\s\S]{0,140}(?:left2|maxLeft2)\s*<=\s*(?:right1|minRight1)/.test(content)) {
      addFact(facts, "algorithms", "partition-binary-search", "high", ["two-array partition boundaries cross-check"]);
    }
  }
  const usesLowerBound =
    usesBinarySearch &&
    /\w+\s*\[\s*mid\s*\]\s*>=\s*(?:target|x|key)[\s\S]{0,160}(?:ans|answer|result|right)\s*=/.test(content);
  const usesUpperBound =
    usesBinarySearch &&
    /\w+\s*\[\s*mid\s*\]\s*>\s*(?:target|x|key)[\s\S]{0,160}(?:ans|answer|result|right)\s*=/.test(content);
  if (usesLowerBound) addFact(facts, "algorithms", "lower-bound-search", "high", ["first position with value at least target"]);
  if (usesUpperBound) addFact(facts, "algorithms", "upper-bound-search", "high", ["first position with value greater than target"]);
  if (
    usesBinarySearch &&
    /(?:first|leftMost|firstOccurrence|lowerBound)/i.test(content) &&
    /(?:last|rightMost|lastOccurrence|upperBound)/i.test(content)
  ) {
    addFact(facts, "algorithms", "first-last-occurrence", "high", ["separate first and last boundary searches"]);
  }
  if (usesLowerBound && /return\s+(?:left|low|ans|answer|result)\s*;/.test(content)) {
    addFact(facts, "algorithms", "search-insert-position", "high", ["boundary pointer returned as insertion index"]);
  }
  if (
    usesBinarySearch &&
    /(?:arr|nums|values)\s*\[\s*(?:left|low)\s*\]\s*<=?\s*(?:arr|nums|values)\s*\[\s*mid\s*\]|(?:arr|nums|values)\s*\[\s*mid\s*\]\s*<=?\s*(?:arr|nums|values)\s*\[\s*(?:right|high)\s*\]/.test(content)
  ) {
    addFact(facts, "algorithms", "rotated-array-search", "high", ["sorted half selected around rotation"]);
  }
  if (
    usesBinarySearch &&
    /(?:arr|nums|values)\s*\[\s*mid\s*\]\s*[<>]\s*(?:arr|nums|values)\s*\[\s*mid\s*\+\s*1\s*\]/.test(content)
  ) {
    addFact(facts, "algorithms", "peak-element-search", "high", ["middle compared with neighboring element"]);
  }
  if (
    usesBinarySearch &&
    /(?:long long\s+\w+\s*=\s*1LL\s*\*\s*mid\s*\*\s*mid|1LL\s*\*\s*mid\s*\*\s*mid|mid\s*<=\s*\w+\s*\/\s*mid)/.test(content)
  ) {
    addFact(facts, "algorithms", "sqrt-binary-search", "high", ["middle squared against target using wide arithmetic"]);
  }
  if (
    hasMid &&
    /(possible|can|isValid|isPossible|hours|capacity|days|bouquets|canFinish|canShip|canMake)/i.test(content)
  ) {
    addFact(facts, "algorithms", "capacity-search", "high", ["monotonic feasibility predicate tested at middle answer"]);
  }
}

function detectLinkedList(facts: CodeFacts, content: string): void {
  const usesTraversal = /while\s*\([^)]*(?:nullptr|NULL)[^)]*\)[\s\S]{0,500}\b\w+\s*=\s*\w+->next/.test(content);
  const usesFastSlow = /(slow\s*=\s*slow->next[\s\S]*fast\s*=\s*fast->next->next|fast\s*=\s*fast->next->next[\s\S]*slow\s*=\s*slow->next)/.test(content);
  if (usesTraversal) {
    addFact(facts, "structures", "linked-list-traversal", "high", ["node cursor advances through ->next"]);
  }
  if (/(head\s*=\s*new\s+\w+|new\w*->next\s*=\s*head|head\s*=\s*head->next)/.test(content)) {
    addFact(facts, "structures", "head-update", "high", ["head or head-adjacent link update"]);
  }
  if (/(head\s*=\s*new\s+\w+|new\w*->next\s*=\s*head|head\s*=\s*head->next|tail->next\s*=|tail\s*=\s*(?:tail->next|new\w*)|head\s*=\s*\w+)/.test(content)) {
    addFact(facts, "structures", "head-tail-update", "high", ["head or tail link updated"]);
  }
  if (/->next\s*=\s*\w+->next->next|prev->next\s*=\s*curr->next/.test(content)) {
    addFact(facts, "structures", "node-deletion", "high", ["next pointer bypasses a node"]);
  }
  if (/curr->next\s*=\s*prev|prev\s*=\s*curr;[\s\S]*curr\s*=\s*next/.test(content)) {
    addFact(facts, "algorithms", "linked-list-reversal", "high", ["current node points to previous node"]);
  }
  if (usesFastSlow) {
    addFact(facts, "algorithms", "fast-slow-pointers", "high", ["slow advances once while fast advances twice"]);
  }
  if (/\b(dummy|sentinel)\s*=\s*new\s+\w+/.test(content)) {
    addFact(facts, "structures", "dummy-node", "high", ["dummy/sentinel node allocation"]);
  }
  if (/(head\s*==\s*(?:nullptr|NULL)|!head)/.test(content)) {
    addFact(facts, "edgeCaseSignals", "linked-list-edge-check", "medium", ["head/null guard"]);
  }
  if (usesTraversal && /\b(?:count|length|len|size)\w*\s*(?:\+\+|\+=\s*1)/i.test(content)) {
    addFact(facts, "algorithms", "linked-list-length", "high", ["counter increments while advancing node cursor"]);
  }
  if (
    usesTraversal &&
    /\w+->(?:data|val|value)\s*==\s*(?:target|key|x|value)|(?:target|key|x|value)\s*==\s*\w+->(?:data|val|value)/.test(content)
  ) {
    addFact(facts, "algorithms", "linked-list-search", "high", ["node value compared with target during traversal"]);
  }
  if (usesFastSlow && /return\s+(?:slow|slow->(?:data|val|value))\s*;/.test(content)) {
    addFact(facts, "algorithms", "linked-list-middle", "high", ["slow pointer returned after fast/slow traversal"]);
  }
  if (usesFastSlow && /(?:slow\s*==\s*fast|fast\s*==\s*slow)/.test(content)) {
    addFact(facts, "algorithms", "linked-list-cycle-detection", "high", ["fast and slow node references compared"]);
  }
  if (
    /\b(?:l1|list1|first)\b[\s\S]{0,180}\b(?:l2|list2|second)\b/.test(content) &&
    /(?:data|val|value)\s*<=?\s*\w+->(?:data|val|value)/.test(content) &&
    /tail->next\s*=/.test(content)
  ) {
    addFact(facts, "algorithms", "merge-sorted-linked-lists", "high", ["tail selects and appends from two sorted cursors"]);
  }
  if (
    /\w+->(?:data|val|value)\s*==\s*\w+->next->(?:data|val|value)[\s\S]{0,120}\w+->next\s*=\s*\w+->next->next/.test(content)
  ) {
    addFact(facts, "algorithms", "linked-list-duplicate-removal", "high", ["equal adjacent nodes skipped"]);
  }
}

function detectTree(facts: CodeFacts, content: string): void {
  const hasTreeNode = /(TreeNode|Node)\s*\*\s*\w+|struct\s+TreeNode|class\s+TreeNode|\w+->(left|right)/.test(content);
  if (hasTreeNode) addFact(facts, "dataStructures", "tree-node", "high", ["tree node with left/right links"]);
  if (hasTreeNode && /(preorder|inorder|postorder|dfs|traverse|height|depth|diameter|maxPath|isBalanced)[\s\S]{0,500}\w+\s*\(\s*\w+->(left|right)\s*\)/.test(content)) {
    addFact(facts, "algorithms", "recursive-tree-traversal", "high", ["recursive call on left or right child"]);
  }
  if (hasTreeNode && /\bqueue</.test(content) && /\.(push|pop|front)\s*\(/.test(content)) {
    addFact(facts, "algorithms", "level-order-tree-traversal", "high", ["tree nodes processed through a queue"]);
  }
  if (hasTreeNode && /(\w+->val\s*[<>]=?\s*\w+|\w+\s*[<>]=?\s*\w+->val|\w+->val\s*[<>]=?\s*\w+->val|isValidBST|minValue|maxValue)/.test(content)) {
    addFact(facts, "algorithms", "bst-logic", "high", ["value comparison selects a tree branch"]);
  }
  if (/(buildTree|construct|preorderIndex|postorderIndex|inorderMap|splitIndex|new\s+TreeNode|new\s+Node)/.test(content)) {
    addFact(facts, "algorithms", "tree-construction", "medium", ["tree node creation or traversal partition"]);
  }
  if (/(lowestCommonAncestor|lca)\s*\(|left\s*!=\s*nullptr\s*&&\s*right\s*!=\s*nullptr/.test(content)) {
    addFact(facts, "algorithms", "lowest-common-ancestor", "high", ["left/right recursive results converge"]);
  }
  if (hasTreeNode && /(root\s*==\s*nullptr|node\s*==\s*nullptr|!root|!node)/.test(content)) {
    addFact(facts, "edgeCaseSignals", "tree-edge-check", "medium", ["null root/node guard"]);
  }
  detectAdvancedTreeTechniques(facts, content);
}

function detectAdvancedTreeTechniques(facts: CodeFacts, content: string): void {
  const hasTree = hasFactInBuckets(facts, "tree-node");
  const structuralRecursion = /\b(\w+)\s*\([^)]*\)\s*\{[\s\S]{0,500}\1\s*\(\s*\w+->left[\s\S]{0,260}\1\s*\(\s*\w+->right/.test(content);
  const recursiveTraversal = hasFactInBuckets(facts, "recursive-tree-traversal") || structuralRecursion;
  if (structuralRecursion && !hasFactInBuckets(facts, "recursive-tree-traversal")) {
    addFact(facts, "algorithms", "recursive-tree-traversal", "high", ["same function recurses on left and right children"]);
  }

  if (
    recursiveTraversal &&
    /(?:std::)?max\s*\(\s*\w+\s*\(\s*\w+->left\s*\)\s*,\s*\w+\s*\(\s*\w+->right\s*\)\s*\)\s*\+\s*1|1\s*\+\s*(?:std::)?max\s*\(/.test(content)
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
    /(?:abs|std::abs)\s*\(\s*\w+\s*-\s*\w+\s*\)\s*>\s*1/.test(content) &&
    /return\s+-1|(?:balanced|isBalanced)/i.test(content)
  ) {
    addFact(facts, "algorithms", "balanced-tree-check", "high", ["height difference checked and failure propagated"]);
  }
  if (
    hasTree &&
    /(?:target|key|value)\s*<\s*\w+->val[\s\S]{0,140}\w+\s*=\s*\w+->left|(?:target|key|value)\s*>\s*\w+->val[\s\S]{0,140}\w+\s*=\s*\w+->right/.test(content)
  ) {
    addFact(facts, "algorithms", "bst-search", "high", ["BST comparison chooses one child"]);
  }
  if (
    hasFactInBuckets(facts, "bst-logic") &&
    /(?:insert|delete|remove)\w*\s*\(/i.test(content) &&
    /(?:root|node)->(?:left|right)\s*=\s*\w+\s*\(\s*(?:root|node)->(?:left|right)/.test(content)
  ) {
    addFact(facts, "algorithms", "bst-mutation", "high", ["BST child link updated recursively"]);
  }
  if (
    hasFactInBuckets(facts, "level-order-tree-traversal") &&
    (/(?:levelSize|size)\s*=\s*\w+\.size\s*\(\)[\s\S]{0,260}(?:i\s*==\s*0|i\s*==\s*(?:levelSize|size)\s*-\s*1)/.test(content) ||
      /(?:horizontalDistance|hd|column)\w*[\s\S]{0,240}(?:map<|unordered_map<|emplace|count\s*\()/i.test(content))
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
    hasFactInBuckets(facts, "level-order-tree-traversal") &&
    /["']#["']|["']null["']/.test(content) &&
    /(?:ostringstream|vector<string>|tokens|serialized|output)/i.test(content)
  ) {
    addFact(facts, "algorithms", "tree-serialization", "high", ["level order emits explicit null markers"]);
  }
  if (
    recursiveTraversal &&
    /(?:height|depth)\s*\(\s*\w+->(?:left|right)\s*\)/.test(content) &&
    (content.match(/(?:height|depth)\s*\(/g)?.length ?? 0) >= 4
  ) {
    addFact(facts, "antiPatterns", "repeated-tree-height", "medium", ["height recomputed from multiple nodes"]);
    addFact(facts, "complexitySignals", "quadratic-candidate", "medium", ["repeated subtree height traversal"]);
  }
}

function detectGraph(facts: CodeFacts, content: string): void {
  const hasAdjacency = /(vector<.*>.*graph|\badj\b|adjacency|neighbors|edges)/.test(content);
  const hasTraversal = /(visited|vis)\s*\[|\bdfs\s*\(|\bbfs\s*\(|(?:graph|adj|neighbors)\s*\[/.test(content);
  if (hasAdjacency) addFact(facts, "dataStructures", "graph-adjacency", "high", ["adjacency list, neighbors, or edges"]);
  if (hasTraversal) addFact(facts, "algorithms", "graph-traversal", "high", ["visited state with DFS/BFS or neighbor iteration"]);
  if (hasAdjacency && (/\bbfs\s*\(/.test(content) || (/\bqueue</.test(content) && /\.(push|pop|front)\s*\(/.test(content)))) {
    addFact(facts, "algorithms", "graph-bfs", "high", ["queue-based graph traversal"]);
  }
  if (hasAdjacency && (/\bdfs\s*\(/.test(content) || (/\bstack</.test(content) && /\.(push|pop|top)\s*\(/.test(content)))) {
    addFact(facts, "algorithms", "graph-dfs", "high", ["recursive or stack-based graph traversal"]);
  }
  if (/(indegree|inDegree|topo|topological|dfsOrder|stack\.push)/.test(content)) {
    addFact(facts, "algorithms", "topological-sort", "high", ["indegree or DFS finishing order"]);
  }
  if (/(dist\s*\[|distance|priority_queue<|relax|weight|dijkstra|bellman|floyd)/i.test(content)) {
    addFact(facts, "algorithms", "shortest-path-relaxation", "high", ["distance update or weighted priority processing"]);
  }
  if (/(parent\s*\[|rank\s*\[|size\s*\[|find\s*\(|unionSet\s*\(|unite\s*\(|path compression)/i.test(content)) {
    addFact(facts, "dataStructures", "disjoint-set-union", "high", ["parent/rank with find and union"]);
  }
  if (/(kruskal|prim|priority_queue<|mst|minimum spanning|unionSet\s*\(|unite\s*\()/i.test(content)) {
    addFact(facts, "algorithms", "minimum-spanning-tree", "medium", ["Kruskal/Prim style edge selection"]);
  }
  if (hasTraversal || /(n\s*==\s*0|graph\.empty\s*\(\)|pq\.empty\s*\(\))/.test(content)) {
    addFact(facts, "edgeCaseSignals", "graph-edge-check", "medium", ["empty graph, visited state, or frontier guard"]);
  }
  detectAdvancedGraphTechniques(facts, content);
}

function detectAdvancedGraphTechniques(facts: CodeFacts, content: string): void {
  const hasBfs =
    hasFactInBuckets(facts, "graph-bfs") ||
    hasFactInBuckets(facts, "bfs-grid-processing");
  const hasDfs = hasFactInBuckets(facts, "graph-dfs");

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
    (hasBfs || hasDfs || hasFactInBuckets(facts, "bfs-grid-processing")) &&
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
    /priority_queue</.test(content) &&
    /(?:dist|distance)\s*\[[^\]]+\]\s*>\s*(?:dist|distance)\s*\[[^\]]+\]\s*\+\s*(?:weight|w)|(?:dist|distance)\s*\[[^\]]+\]\s*\+\s*(?:weight|w)\s*<\s*(?:dist|distance)\s*\[[^\]]+\]/.test(content)
  ) {
    addFact(facts, "algorithms", "dijkstra", "high", ["min-priority queue performs weighted distance relaxation"]);
  }
  if (
    hasFactInBuckets(facts, "disjoint-set-union") &&
    /parent\s*\[[^\]]+\]\s*=\s*(?:find|findParent)\s*\(\s*parent\s*\[[^\]]+\]\s*\)/.test(content) &&
    /(?:rank|size)\s*\[/.test(content)
  ) {
    addFact(facts, "algorithms", "union-find-optimized", "high", ["path compression with rank or size"]);
  }
  if (
    (hasFactInBuckets(facts, "disjoint-set-union") && hasFactInBuckets(facts, "sorting") && /(?:cost|weight|mst)\s*\+=/i.test(content)) ||
    (/priority_queue</.test(content) && /(?:visited|inMst|mst)\s*\[[^\]]+\]/i.test(content) && /(?:cost|weight|total)\s*\+=/i.test(content))
  ) {
    addFact(facts, "algorithms", "minimum-spanning-tree", "high", ["Kruskal or Prim selects lightest cycle-free edges"]);
  }
}

function detectDynamicProgramming(facts: CodeFacts, content: string): void {
  const functionNames = detectFunctionNames(content);
  const hasRecursion = functionNames.some((name) => (content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0) >= 2);
  const hasDpTable = /\b(?:dp|memo)\s*\[/.test(content);
  const hasBottomUp = hasDpTable && /\b(for|while)\s*\(/.test(content);
  if (hasDpTable && hasRecursion) addFact(facts, "algorithms", "dp-memoization", "high", ["recursive state cached in a table"]);
  if (hasBottomUp) addFact(facts, "algorithms", "bottom-up-dp", "high", ["DP table filled iteratively"]);
  if (/dp(?:\s*\[[^\]]+\])+\s*=\s*(?:max|min)\s*\(|dp(?:\s*\[[^\]]+\])+\s*=\s*dp(?:\s*\[[^\]]+\])+\s*[+\-*\/]|take|notTake|pick|skip/.test(content)) {
    addFact(facts, "algorithms", "dp-state-transition", "high", ["DP state derived from prior states"]);
  }
  if (hasBottomUp && /(prev|curr|next|rolling|oneD|1d dp)/i.test(content)) {
    addFact(facts, "algorithms", "dp-space-optimization", "medium", ["rolling previous/current state"]);
    addFact(facts, "complexitySignals", "reduced-dp-space", "medium", ["full table replaced by rolling state"]);
  }
  if (hasBottomUp && /(capacity|weight|weights|values|target|sum)\b[\s\S]{0,260}dp\s*\[/i.test(content)) {
    addFact(facts, "algorithms", "knapsack-dp", "high", ["capacity/target state with take or skip transition"]);
  }
  if (/(gap|len|length)\b[\s\S]{0,260}for\s*\([^)]*(?:i|j)/.test(content)) {
    addFact(facts, "algorithms", "interval-dp", "high", ["states filled by increasing interval length"]);
  }
  if (/(n\s*==\s*0|index\s*<\s*0|target\s*==\s*0|values\.empty\s*\(\))/.test(content)) {
    addFact(facts, "edgeCaseSignals", "dp-edge-check", "medium", ["empty/base target or index guard"]);
  }
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
    /vector\s*<\s*vector\s*<[^>]+>\s*>\s+(?:dp|memo)|(?:dp|memo)\s*\[[^\]]+\]\s*\[[^\]]+\]/.test(content) &&
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
    /\bstring\b/.test(content) &&
    /(?:dp|memo)\s*\[[^\]]+\]\s*\[[^\]]+\]/.test(content) &&
    /(?:\w+\s*\[\s*i\s*-\s*1\s*\]|\w+\s*\[\s*j\s*-\s*1\s*\])/.test(content)
  ) {
    addFact(facts, "algorithms", "string-dp", "high", ["two-dimensional states compare string characters"]);
  }
  if (hasRecursion && functionNames.some((name) => (content.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0) >= 3) && !hasDpTable) {
    addFact(facts, "antiPatterns", "exponential-dp-recursion", "high", ["overlapping recursive branches are not cached"]);
  }
}

function detectBitManipulation(facts: CodeFacts, content: string): void {
  const shiftContent = content
    .split("\n")
    .filter((line) => !/\b(?:cin|cout|cerr|clog)\s*(?:<<|>>)/.test(line))
    .join("\n");

  if (/(^|[^&])&([^&]|$)/m.test(content)) addFact(facts, "structures", "bitwise-and", "high", ["single & operator"]);
  if (/(^|[^|])\|([^|]|$)/m.test(content)) addFact(facts, "structures", "bitwise-or", "high", ["single | operator"]);
  if (/\^/.test(content)) addFact(facts, "structures", "bitwise-xor", "high", ["^ operator"]);
  if (/<<(?!=)/.test(shiftContent)) addFact(facts, "structures", "left-shift", "high", ["<< operator"]);
  if (/>>(?!=)/.test(shiftContent)) addFact(facts, "structures", "right-shift", "high", [">> operator"]);
  if (/~/.test(content)) addFact(facts, "structures", "bitwise-not", "high", ["~ operator"]);
  if (/\w+\s*&=\s*\(\s*\w+\s*-\s*1\s*\)|\w+\s*&\s*\(\s*\w+\s*-\s*1\s*\)/.test(content)) {
    addFact(facts, "algorithms", "clear-lowest-set-bit", "high", ["n & (n - 1) pattern"]);
  }
  if (/(bitset<|to_string\s*\()/.test(content)) {
    addFact(facts, "antiPatterns", "binary-string-conversion", "medium", ["binary/string conversion API"]);
  }
  if (/[%\/]\s*2/.test(content)) {
    addFact(facts, "antiPatterns", "modulo-division-by-two", "high", ["% 2 or / 2"]);
  }
  if (/(n\s*<=?\s*0|n\s*==\s*0|index\s*<\s*0|nullptr)/.test(content)) {
    addFact(facts, "edgeCaseSignals", "bit-edge-check", "medium", ["zero, negative, or null guard"]);
  }
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

function detectFunctionNames(content: string): string[] {
  const regex = /\b(?:void|int|long|long long|bool|string|double|float|char|auto|vector<[^>]+>|ListNode\s*\*|TreeNode\s*\*|Node\s*\*)\s+([a-zA-Z_]\w*)\s*\([^;{}]*\)\s*\{/g;
  const names: string[] = [];
  let match = regex.exec(content);
  while (match) {
    names.push(match[1]);
    match = regex.exec(content);
  }
  return Array.from(new Set(names));
}

function detectTwoPointerMovement(content: string): boolean {
  return detectOpposingPointerMovement(content);
}

function estimateNestedLoopDepth(content: string): number {
  const lines = content.split(/\r?\n/);
  let depth = 0;
  let maxLoopDepth = 0;
  const loopBraceDepths: number[] = [];

  for (const line of lines) {
    if (/\b(for|while)\s*\(/.test(line)) {
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
