import test from "node:test";
import assert from "node:assert/strict";
import { analyzeQueueJavaContent, detectQueueConcepts } from "../services/topics/queueHooks";
import { getProblemById } from "../services/storage";

test("queue analyzer detects queue generation flow", () => {
  const analysis = analyzeQueueJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        Queue<String> q = new ArrayDeque<>();
        q.offer("1");
        String cur = q.poll();
        q.offer(cur + "0");
        q.offer(cur + "1");
      }
    }
  `);

  assert.equal(analysis.signals.usesQueueStructure, true);
  assert.equal(analysis.signals.usesEnqueueDequeue, true);
});

test("queue concept detector recognizes deque sliding-window pattern", () => {
  const problem = getProblemById("q-008");
  assert.ok(problem);

  const analysis = analyzeQueueJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        int[] arr = {1, 3, -1, -3, 5, 3, 6, 7};
        Deque<Integer> dq = new ArrayDeque<>();
        for (int i = 0; i < arr.length; i++) {
          while (!dq.isEmpty() && dq.peekFirst() <= i - 3) dq.pollFirst();
          while (!dq.isEmpty() && arr[dq.peekLast()] <= arr[i]) dq.pollLast();
          dq.offerLast(i);
        }
      }
    }
  `);

  const detection = detectQueueConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("sliding-window-queue"), true);
  assert.equal(detection.matchedConcepts.includes("deque-technique"), true);
});
