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
