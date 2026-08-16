import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTreeJavaContent, detectTreeConcepts } from "../services/topics/treeHooks";
import { getProblemById } from "../services/storage";

test("tree analyzer detects recursive traversal pattern", () => {
  const analysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static int height(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(height(root.left), height(root.right));
      }
    }
  `);

  assert.equal(analysis.signals.usesTreeNodePattern, true);
  assert.equal(analysis.signals.usesRecursiveTraversal, true);
});

test("tree concept detector recognizes BST search logic", () => {
  const problem = getProblemById("tr-008");
  assert.ok(problem);

  const analysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static boolean search(TreeNode root, int target) {
        while (root != null) {
          if (root.val == target) return true;
          if (target < root.val) root = root.left;
          else root = root.right;
        }
        return false;
      }
    }
  `);

  const detection = detectTreeConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("bst-search"), true);
});

test("tree concept detector requires real diameter evidence", () => {
  const problem = getProblemById("tr-006");
  assert.ok(problem);

  const wrongAnalysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static int diameter(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(diameter(root.left), diameter(root.right));
      }
    }
  `);

  const correctAnalysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static int best = 0;
      static int diameter(TreeNode root) {
        best = 0;
        height(root);
        return best;
      }
      static int height(TreeNode node) {
        if (node == null) return 0;
        int leftHeight = height(node.left);
        int rightHeight = height(node.right);
        best = Math.max(best, leftHeight + rightHeight);
        return 1 + Math.max(leftHeight, rightHeight);
      }
    }
  `);

  assert.equal(detectTreeConcepts(problem, wrongAnalysis).matchedConcepts.includes("tree-diameter"), false);
  assert.equal(detectTreeConcepts(problem, correctAnalysis).matchedConcepts.includes("tree-diameter"), true);
});

test("tree concept detector requires real balanced-tree evidence", () => {
  const problem = getProblemById("tr-007");
  assert.ok(problem);

  const wrongAnalysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static boolean isBalanced(TreeNode root) {
        if (root == null) return true;
        int leftHeight = height(root.left);
        int rightHeight = height(root.right);
        return Math.abs(leftHeight - rightHeight) <= 1;
      }
      static int height(TreeNode node) {
        if (node == null) return 0;
        return 1 + Math.max(height(node.left), height(node.right));
      }
    }
  `);

  const correctAnalysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static boolean isBalanced(TreeNode root) {
        return height(root) != -1;
      }
      static int height(TreeNode node) {
        if (node == null) return 0;
        int left = height(node.left);
        if (left == -1) return -1;
        int right = height(node.right);
        if (right == -1) return -1;
        if (Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
      }
    }
  `);

  assert.equal(detectTreeConcepts(problem, wrongAnalysis).matchedConcepts.includes("balanced-tree-check"), false);
  assert.equal(detectTreeConcepts(problem, correctAnalysis).matchedConcepts.includes("balanced-tree-check"), true);
});

test("tree concept detector requires directionally correct BST search", () => {
  const problem = getProblemById("tr-008");
  assert.ok(problem);

  const recursiveCorrect = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static boolean searchBST(TreeNode root, int target) {
        if (root == null) return false;
        if (root.val == target) return true;
        if (target < root.val) return searchBST(root.left, target);
        return searchBST(root.right, target);
      }
    }
  `);

  const wrongDirection = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static boolean searchBST(TreeNode root, int target) {
        while (root != null) {
          if (root.val == target) return true;
          if (target < root.val) root = root.right;
          else root = root.left;
        }
        return false;
      }
    }
  `);

  assert.equal(detectTreeConcepts(problem, recursiveCorrect).matchedConcepts.includes("bst-search"), true);
  assert.equal(detectTreeConcepts(problem, wrongDirection).matchedConcepts.includes("bst-search"), false);
});

test("tree concept detector distinguishes left view from right view", () => {
  const problem = getProblemById("tr-009");
  assert.ok(problem);

  const leftViewAnalysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static List<Integer> leftView(TreeNode root) {
        List<Integer> answer = new ArrayList<>();
        if (root == null) return answer;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
          int size = queue.size();
          for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (i == 0) answer.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
          }
        }
        return answer;
      }
    }
  `);

  const rightViewAnalysis = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; }
    public class Main {
      static List<Integer> leftView(TreeNode root) {
        List<Integer> answer = new ArrayList<>();
        if (root == null) return answer;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
          int size = queue.size();
          for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (i == size - 1) answer.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
          }
        }
        return answer;
      }
    }
  `);

  const leftDetection = detectTreeConcepts(problem, leftViewAnalysis);
  const rightDetection = detectTreeConcepts(problem, rightViewAnalysis);
  assert.equal(leftDetection.matchedConcepts.includes("tree-view"), true);
  assert.equal(rightDetection.matchedConcepts.includes("tree-view"), false);
});

test("tree concept detector requires real BST mutation evidence", () => {
  const problem = getProblemById("tr-010");
  assert.ok(problem);

  const recursiveInsert = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }
    public class Main {
      static TreeNode insertBST(TreeNode root, int x) {
        if (root == null) return new TreeNode(x);
        if (x < root.val) root.left = insertBST(root.left, x);
        else if (x > root.val) root.right = insertBST(root.right, x);
        return root;
      }
    }
  `);

  const wrongDirection = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }
    public class Main {
      static TreeNode insertBST(TreeNode root, int x) {
        if (root == null) return new TreeNode(x);
        if (x < root.val) root.right = insertBST(root.right, x);
        else if (x > root.val) root.left = insertBST(root.left, x);
        return root;
      }
    }
  `);

  assert.equal(detectTreeConcepts(problem, recursiveInsert).matchedConcepts.includes("bst-insert-delete"), true);
  assert.equal(detectTreeConcepts(problem, wrongDirection).matchedConcepts.includes("bst-insert-delete"), false);
});

test("tree concept detector requires real BST delete handling", () => {
  const problem = getProblemById("tr-011");
  assert.ok(problem);

  const correctDelete = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }
    public class Main {
      static TreeNode deleteBST(TreeNode root, int key) {
        if (root == null) return null;
        if (key < root.val) root.left = deleteBST(root.left, key);
        else if (key > root.val) root.right = deleteBST(root.right, key);
        else {
          if (root.left == null) return root.right;
          if (root.right == null) return root.left;
          TreeNode successor = root.right;
          while (successor.left != null) successor = successor.left;
          root.val = successor.val;
          root.right = deleteBST(root.right, successor.val);
        }
        return root;
      }
    }
  `);

  const wrongDelete = analyzeTreeJavaContent(`
    class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }
    public class Main {
      static TreeNode deleteBST(TreeNode root, int key) {
        if (root == null) return null;
        if (key < root.val) root.left = deleteBST(root.left, key);
        else if (key > root.val) root.right = deleteBST(root.right, key);
        else return root.left;
        return root;
      }
    }
  `);

  assert.equal(detectTreeConcepts(problem, correctDelete).matchedConcepts.includes("bst-insert-delete"), true);
  assert.equal(detectTreeConcepts(problem, wrongDelete).matchedConcepts.includes("bst-insert-delete"), false);
});
