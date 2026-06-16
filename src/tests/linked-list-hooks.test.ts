import test from "node:test";
import assert from "node:assert/strict";
import { analyzeLinkedListJavaContent, detectLinkedListConcepts } from "../services/topics/linkedListHooks";
import { getProblemById } from "../services/storage";

test("linked-list analyzer detects reversal pointers", () => {
  const analysis = analyzeLinkedListJavaContent(`
    class Node { int data; Node next; }
    public class Main {
      public static Node reverse(Node head) {
        Node prev = null;
        Node curr = head;
        while (curr != null) {
          Node next = curr.next;
          curr.next = prev;
          prev = curr;
          curr = next;
        }
        return prev;
      }
    }
  `);

  assert.equal(analysis.signals.usesLinkedListReverse, true);
  assert.equal(analysis.signals.usesLinkedListTraversal, true);
});

test("linked-list concept detector recognizes fast-slow middle logic", () => {
  const problem = getProblemById("ll-007");
  assert.ok(problem);

  const analysis = analyzeLinkedListJavaContent(`
    class Node { int data; Node next; }
    public class Main {
      public static int middle(Node head) {
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
          slow = slow.next;
          fast = fast.next.next;
        }
        return slow.data;
      }
    }
  `);

  const detection = detectLinkedListConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("ll-middle"), true);
  assert.equal(detection.matchedConcepts.includes("ll-fast-slow"), true);
});
