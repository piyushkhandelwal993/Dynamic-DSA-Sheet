import { SupportedAnalysisLanguage } from "../services/analysis-engine/facts";

export interface AnalyzerBenchmarkFixture {
  id: string;
  language: SupportedAnalysisLanguage;
  category: string;
  code: string;
  expectedFacts: string[];
  forbiddenFacts: string[];
  parityGroup?: string;
}

export const analyzerBenchmarkFixtures: AnalyzerBenchmarkFixture[] = [
  {
    id: "cpp-stream-io",
    language: "cpp",
    category: "false-positive",
    code: `
      #include <iostream>
      int main() {
        int value;
        std::cin >> value;
        std::cout << value;
        return 0;
      }
    `,
    expectedFacts: [],
    forbiddenFacts: ["left-shift", "right-shift", "recursive-call", "base-case"]
  },
  {
    id: "cpp-bit-shift",
    language: "cpp",
    category: "operators",
    code: `int shift(int value, int count) { return value << count; }`,
    expectedFacts: ["left-shift"],
    forbiddenFacts: ["right-shift"]
  },
  {
    id: "java-bit-shift",
    language: "java",
    category: "operators",
    parityGroup: "bit-shift",
    code: `int shift(int value, int count) { return value << count; }`,
    expectedFacts: ["left-shift"],
    forbiddenFacts: ["right-shift"]
  },
  {
    id: "cpp-bit-shift-parity",
    language: "cpp",
    category: "operators",
    parityGroup: "bit-shift",
    code: `int shift(int value, int count) { return value << count; }`,
    expectedFacts: ["left-shift"],
    forbiddenFacts: ["right-shift"]
  },
  {
    id: "java-linear-search",
    language: "java",
    category: "strategy",
    parityGroup: "linear-search",
    code: `
      int search(int[] values, int target) {
        for (int index = 0; index < values.length; index++) {
          if (values[index] == target) return index;
        }
        return -1;
      }
    `,
    expectedFacts: ["array", "indexed-access", "loop"],
    forbiddenFacts: ["binary-search", "left-shift", "right-shift", "recursive-call"]
  },
  {
    id: "cpp-linear-search",
    language: "cpp",
    category: "strategy",
    parityGroup: "linear-search",
    code: `
      int search(vector<int>& values, int target) {
        for (int index = 0; index < values.size(); index++) {
          if (values[index] == target) return index;
        }
        return -1;
      }
    `,
    expectedFacts: ["array", "indexed-access", "loop"],
    forbiddenFacts: ["binary-search", "left-shift", "right-shift", "recursive-call"]
  },
  {
    id: "java-binary-search",
    language: "java",
    category: "strategy",
    parityGroup: "binary-search",
    code: `
      int search(int[] values, int target) {
        int low = 0, high = values.length - 1;
        while (low <= high) {
          int mid = low + (high - low) / 2;
          if (values[mid] == target) return mid;
          if (values[mid] < target) low = mid + 1;
          else high = mid - 1;
        }
        return -1;
      }
    `,
    expectedFacts: ["binary-search", "sorted-mid-check", "logarithmic-search"],
    forbiddenFacts: ["recursive-call"]
  },
  {
    id: "cpp-binary-search",
    language: "cpp",
    category: "strategy",
    parityGroup: "binary-search",
    code: `
      int search(vector<int>& values, int target) {
        int low = 0, high = values.size() - 1;
        while (low <= high) {
          int mid = low + (high - low) / 2;
          if (values[mid] == target) return mid;
          if (values[mid] < target) low = mid + 1;
          else high = mid - 1;
        }
        return -1;
      }
    `,
    expectedFacts: ["binary-search", "sorted-mid-check", "logarithmic-search"],
    forbiddenFacts: ["recursive-call"]
  },
  {
    id: "java-factorial",
    language: "java",
    category: "recursion",
    parityGroup: "factorial",
    code: `int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }`,
    expectedFacts: ["recursive-call", "base-case", "functional-recursion"],
    forbiddenFacts: ["multiple-recursive-calls", "loop"]
  },
  {
    id: "cpp-factorial",
    language: "cpp",
    category: "recursion",
    parityGroup: "factorial",
    code: `int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }`,
    expectedFacts: ["recursive-call", "base-case", "functional-recursion"],
    forbiddenFacts: ["multiple-recursive-calls", "loop"]
  },
  {
    id: "java-fibonacci",
    language: "java",
    category: "recursion",
    parityGroup: "fibonacci",
    code: `int fibonacci(int n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }`,
    expectedFacts: ["recursive-call", "base-case", "multiple-recursive-calls", "tree-recursion"],
    forbiddenFacts: ["loop", "memoization"]
  },
  {
    id: "cpp-fibonacci",
    language: "cpp",
    category: "recursion",
    parityGroup: "fibonacci",
    code: `int fibonacci(int n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }`,
    expectedFacts: ["recursive-call", "base-case", "multiple-recursive-calls", "tree-recursion"],
    forbiddenFacts: ["loop", "memoization"]
  },
  {
    id: "java-nested-loops",
    language: "java",
    category: "complexity",
    parityGroup: "nested-loops",
    code: `
      int pairs(int[] values) {
        int count = 0;
        for (int i = 0; i < values.length; i++) {
          for (int j = 0; j < values.length; j++) count += values[i] == values[j] ? 1 : 0;
        }
        return count;
      }
    `,
    expectedFacts: ["loop", "nested-loop", "quadratic-candidate", "array"],
    forbiddenFacts: ["single-pass", "binary-search"]
  },
  {
    id: "cpp-nested-loops",
    language: "cpp",
    category: "complexity",
    parityGroup: "nested-loops",
    code: `
      int pairs(vector<int>& values) {
        int count = 0;
        for (int i = 0; i < values.size(); i++) {
          for (int j = 0; j < values.size(); j++) count += values[i] == values[j] ? 1 : 0;
        }
        return count;
      }
    `,
    expectedFacts: ["loop", "nested-loop", "quadratic-candidate", "array"],
    forbiddenFacts: ["single-pass", "binary-search"]
  },
  {
    id: "java-memoized-dp",
    language: "java",
    category: "dynamic-programming",
    parityGroup: "memoized-dp",
    code: `
      int solve(int index, int[] values, int[] memo) {
        if (index < 0) return 0;
        if (memo[index] != -1) return memo[index];
        int pick = values[index] + solve(index - 2, values, memo);
        int skip = solve(index - 1, values, memo);
        return memo[index] = Math.max(pick, skip);
      }
    `,
    expectedFacts: ["dp-memoization", "dp-state-transition", "recursive-call"],
    forbiddenFacts: ["bottom-up-dp"]
  },
  {
    id: "cpp-memoized-dp",
    language: "cpp",
    category: "dynamic-programming",
    parityGroup: "memoized-dp",
    code: `
      int solve(int index, vector<int>& values, vector<int>& memo) {
        if (index < 0) return 0;
        if (memo[index] != -1) return memo[index];
        int pick = values[index] + solve(index - 2, values, memo);
        int skip = solve(index - 1, values, memo);
        return memo[index] = max(pick, skip);
      }
    `,
    expectedFacts: ["dp-memoization", "dp-state-transition", "recursive-call"],
    forbiddenFacts: ["bottom-up-dp"]
  },
  {
    id: "java-queue-not-stack",
    language: "java",
    category: "data-structure",
    code: `
      int first(Queue<Integer> queue) {
        if (queue.isEmpty()) return -1;
        queue.offer(1);
        return queue.poll();
      }
    `,
    expectedFacts: ["queue-like", "queue-operations"],
    forbiddenFacts: ["priority-queue", "monotonic-stack"]
  },
  {
    id: "cpp-queue-not-priority",
    language: "cpp",
    category: "data-structure",
    code: `
      int first(queue<int>& values) {
        if (values.empty()) return -1;
        values.push(1);
        int result = values.front();
        values.pop();
        return result;
      }
    `,
    expectedFacts: ["queue-like", "queue-operations"],
    forbiddenFacts: ["priority-queue", "monotonic-stack"]
  }
];
