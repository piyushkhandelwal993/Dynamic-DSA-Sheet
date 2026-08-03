export interface TargetRoadmapBenchmarkFixture {
  id: string;
  inputUrl: string;
  problemStatement?: string;
  expectedTopicId: string;
  expectedConceptIds: string[];
  allowedAlternateTopicIds?: string[];
}

export const targetRoadmapBenchmarkFixtures: TargetRoadmapBenchmarkFixture[] = [
  {
    id: "uncataloged-binary-search-slug",
    inputUrl: "https://leetcode.com/problems/search-in-nearly-sorted-array/",
    expectedTopicId: "binary-search",
    expectedConceptIds: ["binary-search-intro", "sorted-mid-check"],
    allowedAlternateTopicIds: ["two-pointers"]
  },
  {
    id: "uncataloged-sliding-window-statement",
    inputUrl: "https://leetcode.com/problems/alpha-problem/",
    problemStatement: "Given a string s, find the length of the longest substring without repeating characters using a sliding window technique.",
    expectedTopicId: "sliding-window",
    expectedConceptIds: ["sliding-window", "variable-size-window"]
  },
  {
    id: "uncataloged-stock-profit-statement",
    inputUrl: "https://leetcode.com/problems/beta-problem/",
    problemStatement: "You are given stock prices for each day. Find the maximum profit from one buy and one sell.",
    expectedTopicId: "arrays",
    expectedConceptIds: ["stock-profit", "min-max-array"]
  },
  {
    id: "uncataloged-prefix-sum-statement",
    inputUrl: "https://leetcode.com/problems/gamma-problem/",
    problemStatement: "Count the number of subarrays whose sum equals k.",
    expectedTopicId: "prefix-suffix",
    expectedConceptIds: ["prefix-sum", "prefix-balance"]
  },
  {
    id: "uncataloged-answer-binary-search-statement",
    inputUrl: "https://leetcode.com/problems/delta-problem/",
    problemStatement: "Find the minimum capacity needed to ship all packages within d days. The answer space is monotonic.",
    expectedTopicId: "binary-search",
    expectedConceptIds: ["answer-binary-search", "capacity-search"]
  },
  {
    id: "uncataloged-two-pointers-slug",
    inputUrl: "https://leetcode.com/problems/valid-palindrome-cleanup/",
    expectedTopicId: "two-pointers",
    expectedConceptIds: ["two-pointers"]
  },
  {
    id: "uncataloged-search-insert-slug",
    inputUrl: "https://leetcode.com/problems/search-insert-target-position/",
    expectedTopicId: "binary-search",
    expectedConceptIds: ["search-insert-position", "binary-search-intro"],
    allowedAlternateTopicIds: ["two-pointers"]
  },
  {
    id: "uncataloged-rotated-search-statement",
    inputUrl: "https://leetcode.com/problems/omega-problem/",
    problemStatement: "Given a sorted array that is rotated at an unknown pivot, search for a target in O(log n).",
    expectedTopicId: "binary-search",
    expectedConceptIds: ["rotated-array-search", "binary-search-intro"]
  },
  {
    id: "uncataloged-prefix-query-statement",
    inputUrl: "https://leetcode.com/problems/theta-problem/",
    problemStatement: "Answer multiple range sum queries using a running prefix sum array.",
    expectedTopicId: "prefix-suffix",
    expectedConceptIds: ["prefix-sum"]
  },
  {
    id: "uncataloged-product-except-self-statement",
    inputUrl: "https://leetcode.com/problems/lambda-problem/",
    problemStatement: "Return an array where each index stores the product of all other elements using prefix and suffix products.",
    expectedTopicId: "prefix-suffix",
    expectedConceptIds: ["prefix-suffix-product", "prefix-sum"]
  },
  {
    id: "uncataloged-subarray-sum-divisible-k-statement",
    inputUrl: "https://leetcode.com/problems/sigma-problem/",
    problemStatement: "Count subarrays whose sum is divisible by k using prefix sums and modulo buckets.",
    expectedTopicId: "prefix-suffix",
    expectedConceptIds: ["prefix-sum", "prefix-modulo"]
  },
  {
    id: "uncataloged-minimum-window-substring-statement",
    inputUrl: "https://leetcode.com/problems/psi-problem/",
    problemStatement: "Find the minimum window substring that contains all characters of t using a sliding window.",
    expectedTopicId: "sliding-window",
    expectedConceptIds: ["sliding-window", "variable-size-window"]
  },
  {
    id: "uncataloged-subarray-window-at-most-k-statement",
    inputUrl: "https://leetcode.com/problems/eta-problem/",
    problemStatement: "Find the longest subarray with at most k zeroes by expanding and shrinking a window.",
    expectedTopicId: "sliding-window",
    expectedConceptIds: ["sliding-window", "variable-size-window"]
  },
  {
    id: "uncataloged-two-sum-sorted-statement",
    inputUrl: "https://leetcode.com/problems/nu-problem/",
    problemStatement: "Given a sorted array, find two numbers whose sum equals target using one pointer from each side.",
    expectedTopicId: "two-pointers",
    expectedConceptIds: ["two-pointers"]
  },
  {
    id: "uncataloged-sorted-array-pair-sum-slug",
    inputUrl: "https://leetcode.com/problems/pair-sum-in-sorted-array/",
    expectedTopicId: "two-pointers",
    expectedConceptIds: ["two-pointers"],
    allowedAlternateTopicIds: ["binary-search"]
  },
  {
    id: "uncataloged-stock-profit-slug",
    inputUrl: "https://leetcode.com/problems/max-profit-stock-scan/",
    expectedTopicId: "arrays",
    expectedConceptIds: ["stock-profit", "min-max-array"]
  }
];
