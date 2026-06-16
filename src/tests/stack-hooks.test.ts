import test from "node:test";
import assert from "node:assert/strict";
import { analyzeStackJavaContent, detectStackConcepts } from "../services/topics/stackHooks";
import { getProblemById } from "../services/storage";

test("stack analyzer detects balanced-bracket stack usage", () => {
  const analysis = analyzeStackJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        Deque<Character> st = new ArrayDeque<>();
        String s = "()";
        for (char ch : s.toCharArray()) {
          if (ch == '(') st.push(ch);
          else if (!st.isEmpty()) st.pop();
        }
      }
    }
  `);

  assert.equal(analysis.signals.usesStackStructure, true);
  assert.equal(analysis.signals.usesPushPop, true);
  assert.equal(analysis.signals.usesParenthesisMatching, true);
});

test("stack concept detector recognizes monotonic stack pattern", () => {
  const problem = getProblemById("st-009");
  assert.ok(problem);

  const analysis = analyzeStackJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        int[] arr = {4, 5, 2, 10};
        Deque<Integer> st = new ArrayDeque<>();
        int[] ans = new int[arr.length];
        for (int i = arr.length - 1; i >= 0; i--) {
          while (!st.isEmpty() && st.peek() <= arr[i]) {
            st.pop();
          }
          ans[i] = st.isEmpty() ? -1 : st.peek();
          st.push(arr[i]);
        }
      }
    }
  `);

  const detection = detectStackConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("monotonic-stack"), true);
  assert.equal(detection.matchedConcepts.includes("next-greater-element"), true);
});
