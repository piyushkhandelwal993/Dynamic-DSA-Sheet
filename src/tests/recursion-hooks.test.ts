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
