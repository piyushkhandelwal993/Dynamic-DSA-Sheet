import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRecursionContent } from "../services/analyzer";
import { detectConceptsForTopic } from "../services/conceptDetector";
import { getProblemById } from "../services/storage";
import { scoreSubmission } from "../services/scoring";

test("recursion analyzer detects recursive call and base case", () => {
  const analysis = analyzeRecursionContent(`
    public class Demo {
      public static int factorial(int n) {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }
    }
  `);

  assert.equal(analysis.signals.hasRecursiveCall, true);
  assert.equal(analysis.signals.hasBaseCase, true);
  assert.equal(analysis.signals.hasMultipleRecursiveCalls, false);
});

test("recursion analyzer detects backtracking undo", () => {
  const analysis = analyzeRecursionContent(`
    import java.util.*;
    class Demo {
      void dfs(int index, int[] nums, List<Integer> path) {
        if (index == nums.length) return;
        path.add(nums[index]);
        dfs(index + 1, nums, path);
        path.remove(path.size() - 1);
        dfs(index + 1, nums, path);
      }
    }
  `);

  assert.equal(analysis.signals.hasRecursiveCall, true);
  assert.equal(analysis.signals.hasMultipleRecursiveCalls, true);
  assert.equal(analysis.signals.usesBacktrackingUndo, true);
});

test("recursion concept detector recognizes factorial concepts", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    public class Demo {
      public static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
      }
    }
  `);

  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("functional-recursion"), true);
  assert.equal(detection.matchedConcepts.includes("base-case"), true);
});

test("recursion scoring penalizes non-recursive submissions", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);

  const score = scoreSubmission(
    problem,
    analyzeRecursionContent(`
      public class Demo {
        public static int factorial(int n) {
          int ans = 1;
          for (int i = 1; i <= n; i++) ans *= i;
          return ans;
        }
      }
    `),
    {
      matchedConcepts: [],
      missingConcepts: problem.expectedConcepts
    }
  );

  assert.ok(score.correctnessScore <= 35);
  assert.ok(score.finalScore < 60);
});

test("combination sum without reuse does not earn full backtracking concepts", () => {
  const problem = getProblemById("rec-015");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    import java.util.*;
    class Demo {
      void dfs(int[] candidates, int index, int remaining, List<Integer> path, List<List<Integer>> answer) {
        if (remaining == 0) {
          answer.add(new ArrayList<>(path));
          return;
        }
        if (remaining < 0 || index == candidates.length) {
          return;
        }
        path.add(candidates[index]);
        dfs(candidates, index + 1, remaining - candidates[index], path, answer);
        path.remove(path.size() - 1);
        dfs(candidates, index + 1, remaining, path, answer);
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("subsequence-generation"), false);
  assert.equal(detection.matchedConcepts.includes("backtracking-basics"), false);
});

test("permutation recursion requires used markers or swap state", () => {
  const problem = getProblemById("rec-016");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    import java.util.*;
    class Demo {
      void backtrack(int[] nums, List<Integer> path, List<List<Integer>> answer) {
        if (path.size() == nums.length) {
          answer.add(new ArrayList<>(path));
          return;
        }
        for (int value : nums) {
          path.add(value);
          backtrack(nums, path, answer);
          path.remove(path.size() - 1);
        }
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("permutations"), false);
});

test("hardcoded recursion cheats are flagged", () => {
  const analysis = analyzeRecursionContent(`
    class Demo {
      void towerOfHanoi(int n, char source, char auxiliary, char destination) {
        if (n == 3) {
          System.out.println(source + "->" + destination);
          System.out.println(source + "->" + auxiliary);
        }
      }
    }
  `);
  assert.equal(analysis.signals.hasHardcoding, true);
});

test("sudoku backtracking earns recursive search and backtracking", () => {
  const problem = getProblemById("rec-023");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      boolean solveSudoku(char[][] board) {
        for (int row = 0; row < 9; row++) {
          for (int col = 0; col < 9; col++) {
            if (board[row][col] == '.') {
              for (char digit = '1'; digit <= '9'; digit++) {
                if (isValid(board, row, col, digit)) {
                  board[row][col] = digit;
                  if (solveSudoku(board)) return true;
                  board[row][col] = '.';
                }
              }
              return false;
            }
          }
        }
        return true;
      }
      boolean isValid(char[][] board, int row, int col, char digit) {
        for (int index = 0; index < 9; index++) {
          if (board[row][index] == digit || board[index][col] == digit) return false;
        }
        int startRow = (row / 3) * 3;
        int startCol = (col / 3) * 3;
        for (int r = startRow; r < startRow + 3; r++) {
          for (int c = startCol; c < startCol + 3; c++) {
            if (board[r][c] == digit) return false;
          }
        }
        return true;
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("recursive-search"), true);
  assert.equal(detection.matchedConcepts.includes("backtracking-basics"), true);
});

test("n queens row search earns permutations and backtracking", () => {
  const problem = getProblemById("rec-024");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      void place(int row, char[][] board) {
        if (row == board.length) return;
        for (int col = 0; col < board.length; col++) {
          if (isSafe(board, row, col)) {
            board[row][col] = 'Q';
            place(row + 1, board);
            board[row][col] = '.';
          }
        }
      }
      boolean isSafe(char[][] board, int row, int col) { return true; }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("permutations"), true);
  assert.equal(detection.matchedConcepts.includes("backtracking-basics"), true);
});

test("merge sort without merge misses divide and conquer concept", () => {
  const problem = getProblemById("rec-021");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      void sort(int[] nums, int left, int right) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        sort(nums, left, mid);
        sort(nums, mid + 1, right);
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("divide-and-conquer"), false);
});

test("quick sort partitioning earns divide and conquer", () => {
  const problem = getProblemById("rec-022");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      void sort(int[] nums, int low, int high) {
        if (low >= high) return;
        int pivot = nums[low + (high - low) / 2];
        int left = low;
        int right = high;
        while (left <= right) {
          while (nums[left] < pivot) left++;
          while (nums[right] > pivot) right--;
          if (left <= right) {
            swap(nums, left, right);
            left++;
            right--;
          }
        }
        sort(nums, low, right);
        sort(nums, left, high);
      }
      void swap(int[] nums, int i, int j) {}
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("divide-and-conquer"), true);
});

test("josephus wrong shift does not earn functional recursion for that problem", () => {
  const problem = getProblemById("rec-018");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      int solve(int n, int k) {
        if (n == 1) return 0;
        return (solve(n - 1, k) + n) % n;
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("functional-recursion"), false);
});

test("wrong tribonacci base cases do not earn memoization concept", () => {
  const problem = getProblemById("rec-020");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      int solve(int n, Integer[] memo) {
        if (n <= 2) return 1;
        if (memo[n] != null) return memo[n];
        memo[n] = solve(n - 1, memo) + solve(n - 2, memo) + solve(n - 3, memo);
        return memo[n];
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("memoization"), false);
});

test("tower of hanoi with wrong rod order does not earn full intro concept for that problem", () => {
  const problem = getProblemById("rec-017");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      void solve(int n, char source, char auxiliary, char destination) {
        if (n == 1) {
          System.out.println(source + "->" + destination);
          return;
        }
        solve(n - 1, source, auxiliary, destination);
        System.out.println(source + "->" + destination);
        solve(n - 1, source, auxiliary, destination);
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("recursion-intro"), false);
});

test("row-only sudoku validation does not earn recursive search", () => {
  const problem = getProblemById("rec-023");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    class Demo {
      boolean solveSudoku(char[][] board) {
        for (int row = 0; row < 9; row++) {
          for (int col = 0; col < 9; col++) {
            if (board[row][col] == '.') {
              for (char digit = '1'; digit <= '9'; digit++) {
                if (isRowValid(board, row, digit)) {
                  board[row][col] = digit;
                  if (solveSudoku(board)) return true;
                  board[row][col] = '.';
                }
              }
              return false;
            }
          }
        }
        return true;
      }
      boolean isRowValid(char[][] board, int row, char digit) { return true; }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("recursive-search"), false);
});

test("set-based n queens still earns permutations", () => {
  const problem = getProblemById("rec-024");
  assert.ok(problem);
  const analysis = analyzeRecursionContent(`
    import java.util.*;
    class Demo {
      void backtrack(int row, char[][] board, Set<Integer> columns, Set<Integer> diag1, Set<Integer> diag2) {
        if (row == board.length) return;
        for (int col = 0; col < board.length; col++) {
          int firstDiag = row - col;
          int secondDiag = row + col;
          if (columns.contains(col) || diag1.contains(firstDiag) || diag2.contains(secondDiag)) continue;
          columns.add(col);
          diag1.add(firstDiag);
          diag2.add(secondDiag);
          board[row][col] = 'Q';
          backtrack(row + 1, board, columns, diag1, diag2);
          board[row][col] = '.';
          columns.remove(col);
          diag1.remove(firstDiag);
          diag2.remove(secondDiag);
        }
      }
    }
  `);
  const detection = detectConceptsForTopic(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("permutations"), true);
});
