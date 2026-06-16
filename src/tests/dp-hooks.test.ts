import test from "node:test";
import assert from "node:assert/strict";
import { analyzeDpJavaContent, detectDpConcepts } from "../services/topics/dpHooks";
import { getProblemById } from "../services/storage";

test("dp analyzer detects bottom-up state transition", () => {
  const analysis = analyzeDpJavaContent(`
    public class Main {
      public static void main(String[] args) {
        int n = 7;
        int[] dp = new int[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
          dp[i] = dp[i - 1] + dp[i - 2];
        }
      }
    }
  `);

  assert.equal(analysis.signals.usesBottomUpDp, true);
  assert.equal(analysis.signals.usesStateTransition, true);
});

test("dp concept detector recognizes knapsack pattern", () => {
  const problem = getProblemById("dp-008");
  assert.ok(problem);

  const analysis = analyzeDpJavaContent(`
    public class Main {
      public static void main(String[] args) {
        int[] nums = {3, 34, 4, 12, 5, 2};
        int target = 9;
        boolean[][] dp = new boolean[nums.length + 1][target + 1];
        for (int i = 0; i <= nums.length; i++) dp[i][0] = true;
        for (int i = 1; i <= nums.length; i++) {
          for (int t = 1; t <= target; t++) {
            dp[i][t] = dp[i - 1][t];
            if (nums[i - 1] <= t) {
              dp[i][t] = dp[i][t] || dp[i - 1][t - nums[i - 1]];
            }
          }
        }
      }
    }
  `);

  const detection = detectDpConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("knapsack-dp"), true);
});
