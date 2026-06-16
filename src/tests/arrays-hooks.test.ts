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
