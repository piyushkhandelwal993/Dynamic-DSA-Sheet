import test from "node:test";
import assert from "node:assert/strict";
import { analyzeBinarySearchJavaContent, detectBinarySearchConcepts } from "../services/topics/binarySearchHooks";
import { getProblemById } from "../services/storage";

test("binary-search analyzer detects lower-bound pattern", () => {
  const analysis = analyzeBinarySearchJavaContent(`
    public class Main {
      public static void main(String[] args) {
        int[] arr = {1, 2, 4, 4, 9};
        int target = 4;
        int left = 0;
        int right = arr.length - 1;
        int ans = arr.length;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (arr[mid] >= target) {
            ans = mid;
            right = mid - 1;
          } else {
            left = mid + 1;
          }
        }
      }
    }
  `);

  assert.equal(analysis.signals.usesBinarySearch, true);
  assert.equal(analysis.signals.usesLowerUpperBoundPattern, true);
});

test("binary-search concept detector recognizes answer-space search", () => {
  const problem = getProblemById("bs-009");
  assert.ok(problem);

  const analysis = analyzeBinarySearchJavaContent(`
    public class Main {
      static boolean canFinish(int[] piles, int h, int speed) { return true; }
      public static void main(String[] args) {
        int left = 1;
        int right = 100;
        int ans = right;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (canFinish(new int[] {3, 6, 7, 11}, 8, mid)) {
            ans = mid;
            right = mid - 1;
          } else {
            left = mid + 1;
          }
        }
      }
    }
  `);

  const detection = detectBinarySearchConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("answer-binary-search"), true);
  assert.equal(detection.matchedConcepts.includes("capacity-search"), true);
});
