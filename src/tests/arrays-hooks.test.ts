import test from "node:test";
import assert from "node:assert/strict";
import { analyzeArraysJavaContent, detectArraysConcepts } from "../services/topics/arraysHooks";
import { getProblemById } from "../services/storage";

test("arrays analyzer detects prefix sum structure", () => {
  const analysis = analyzeArraysJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
          arr[i] = sc.nextInt();
          prefix[i + 1] = prefix[i] + arr[i];
        }
        int l = sc.nextInt();
        int r = sc.nextInt();
        System.out.print(prefix[r + 1] - prefix[l]);
      }
    }
  `);

  assert.equal(analysis.signals.usesPrefixSum, true);
  assert.equal(analysis.signals.usesArrayTraversal, true);
});

test("arrays concept detector recognizes two-pointer array updates", () => {
  const problem = getProblemById("arr-008");
  assert.ok(problem);

  const analysis = analyzeArraysJavaContent(`
    public class Main {
      public static void main(String[] args) {
        int left = 0;
        int right = 4;
        while (left < right) {
          left++;
          right--;
        }
      }
    }
  `);

  const detection = detectArraysConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("two-pointers"), true);
});

test("arrays analyzer distinguishes fixed and variable sliding-window variants", () => {
  const analysis = analyzeArraysJavaContent(`
    class Solution {
      public int longestOnesAfterFlip(int[] nums, int k) {
        int left = 0;
        int zeroCount = 0;
        int best = 0;
        for (int right = 0; right < nums.length; right++) {
          if (nums[right] == 0) zeroCount++;
          while (zeroCount > k) {
            if (nums[left] == 0) zeroCount--;
            left++;
          }
          best = Math.max(best, right - left + 1);
        }
        return best;
      }
    }
  `);

  assert.equal(analysis.signals.usesSlidingWindow, true);
  assert.equal(analysis.signals.usesVariableWindow, true);
});

test("arrays concept detector recognizes prefix modulo counting", () => {
  const problem = {
    expectedConcepts: ["prefix-sum", "frequency-counting", "prefix-modulo"]
  } as ReturnType<typeof getProblemById> extends infer T ? NonNullable<T> : never;

  const analysis = analyzeArraysJavaContent(`
    import java.util.*;
    class Solution {
      public long countSubarraysDivisibleByK(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        freq.put(0, 1);
        int prefix = 0;
        long answer = 0;
        for (int value : nums) {
          prefix += value;
          int mod = ((prefix % k) + k) % k;
          answer += freq.getOrDefault(mod, 0);
          freq.put(mod, freq.getOrDefault(mod, 0) + 1);
        }
        return answer;
      }
    }
  `);

  const detection = detectArraysConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("prefix-modulo"), true);
});
