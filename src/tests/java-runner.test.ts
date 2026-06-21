import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getProblemById } from "../services/storage";
import { runJavaSubmission, runJavaWithCustomInput } from "../services/javaRunner";

test("java runner compiles and passes configured test cases", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-pass-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public int checkBit(int n, int index) {
        return (n & (1 << index)) != 0 ? 1 : 0;
    }
}
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
  assert.equal(result.failedCases.length, 0);
});

test("java runner reports compilation failure cleanly", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-fail-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `public class Main {
    public static void main(String[] args) {
        System.out.println("oops")
    }
}
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.usedTestCases, true);
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.passedCount, 0);
  assert.ok(result.compileError);
});

test("java runner stops infinite loops", () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-timeout-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `public class Main {
      public static void main(String[] args) {
        while (true) {}
      }
    }`,
    "utf-8"
  );

  const result = runJavaWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.resourceLimit, "time");
});

test("java runner stops excessive output", () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-output-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `public class Main {
      public static void main(String[] args) {
        while (true) System.out.print("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
      }
    }`,
    "utf-8"
  );

  const result = runJavaWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.outputLimitExceeded, true);
  assert.equal(result.resourceLimit, "output");
});

test("java function harness provides linked-list types and driver", () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-runner-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public Node reverse(Node head) {
        Node previous = null;
        Node current = head;
        while (current != null) {
          Node next = current.next;
          current.next = previous;
          previous = current;
          current = next;
        }
        return previous;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports linked-list search formatting", () => {
  const problem = getProblemById("ll-002");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-search-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public boolean contains(Node head, int target) {
        for (Node current = head; current != null; current = current.next) {
          if (current.data == target) return true;
        }
        return false;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports in-place array mutation", () => {
  const problem = getProblemById("arr-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-array-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public void reverse(int[] nums) {
        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
          int value = nums[left];
          nums[left++] = nums[right];
          nums[right--] = value;
        }
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness provides TreeNode and serializes traversal results", () => {
  const problem = getProblemById("tr-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-tree-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;
    class Solution {
      public List<Integer> preorder(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        visit(root, result);
        return result;
      }

      private void visit(TreeNode node, List<Integer> result) {
        if (node == null) return;
        result.add(node.val);
        visit(node.left, result);
        visit(node.right, result);
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports stack string contracts", () => {
  const problem = getProblemById("st-002");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-stack-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;
    class Solution {
      public boolean isBalanced(String value) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char current : value.toCharArray()) {
          if (current == '(' || current == '[' || current == '{') stack.push(current);
          else {
            if (stack.isEmpty()) return false;
            char open = stack.pop();
            if ((current == ')' && open != '(') || (current == ']' && open != '[') || (current == '}' && open != '{')) return false;
          }
        }
        return stack.isEmpty();
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports array plus target contracts", () => {
  const problem = getProblemById("bs-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-binary-search-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public int search(int[] values, int target) {
        int left = 0, right = values.length - 1;
        while (left <= right) {
          int middle = left + (right - left) / 2;
          if (values[middle] == target) return middle;
          if (values[middle] < target) left = middle + 1;
          else right = middle - 1;
        }
        return -1;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports recursive scalar contracts", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-recursion-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java graph harness provides an adjacency list", () => {
  const problem = getProblemById("gr-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-graph-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;
    class Solution {
      public List<Integer> bfs(int n, List<List<Integer>> graph) {
        List<Integer> order = new ArrayList<>();
        boolean[] visited = new boolean[n];
        Queue<Integer> queue = new ArrayDeque<>();
        queue.add(0);
        visited[0] = true;
        while (!queue.isEmpty()) {
          int node = queue.remove();
          order.add(node);
          for (int next : graph.get(node)) {
            if (!visited[next]) {
              visited[next] = true;
              queue.add(next);
            }
          }
        }
        return order;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});
