import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getProblemById } from "../services/storage";
import { effectiveProblemForPracticeMode, ensureProblemWorkspace, resetProblemWorkspace } from "../services/workspace";

test("start workspace generation creates a stable Main.java template", () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-workspace-test-"));

  try {
    const first = ensureProblemWorkspace(problem);
    const second = ensureProblemWorkspace(problem);

    assert.ok(fs.existsSync(first.filePath));
    assert.equal(first.filePath, second.filePath);
    assert.equal(second.created, false);

    const content = fs.readFileSync(first.filePath, "utf-8");
    assert.match(content, /public class Main/);
    assert.match(content, /Problem: Convert Decimal to Binary/);
  } finally {
    if (originalBaseDir === undefined) {
      delete process.env.DSA_SHEET_HOME;
    } else {
      process.env.DSA_SHEET_HOME = originalBaseDir;
    }
  }
});

test("workspace generation keeps Java and C++ solutions separately", () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-workspace-language-test-"));

  try {
    const javaWorkspace = ensureProblemWorkspace(problem, "java");
    const cppWorkspace = ensureProblemWorkspace(problem, "cpp");

    assert.match(javaWorkspace.filePath, /Main\.java$/);
    assert.match(cppWorkspace.filePath, /main\.cpp$/);
    assert.notEqual(javaWorkspace.filePath, cppWorkspace.filePath);
    const cppContent = fs.readFileSync(cppWorkspace.filePath, "utf-8");
    assert.match(cppContent, /#include <iostream>/);
    assert.doesNotMatch(cppContent, /bits\/stdc\+\+\.h/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("existing C++ workspaces migrate away from non-portable GCC headers", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-workspace-migration-test-"));

  try {
    const workspace = ensureProblemWorkspace(problem, "cpp");
    fs.writeFileSync(workspace.filePath, "#include <bits/stdc++.h>\nusing namespace std;\nint main() { return 0; }\n", "utf-8");

    ensureProblemWorkspace(problem, "cpp");
    const migrated = fs.readFileSync(workspace.filePath, "utf-8");
    assert.match(migrated, /#include <iostream>/);
    assert.doesNotMatch(migrated, /bits\/stdc\+\+\.h/);
    assert.match(migrated, /int main\(\) \{ return 0; \}/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("guided function workspaces expose only the student solution file", () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-function-workspace-test-"));

  try {
    const javaWorkspace = ensureProblemWorkspace(problem, "java");
    const cppWorkspace = ensureProblemWorkspace(problem, "cpp");

    assert.match(javaWorkspace.filePath, /Solution\.java$/);
    assert.match(cppWorkspace.filePath, /solution\.cpp$/);
    assert.match(fs.readFileSync(javaWorkspace.filePath, "utf-8"), /public Node reverse\(Node head\)/);
    assert.match(fs.readFileSync(cppWorkspace.filePath, "utf-8"), /Node\* reverse\(Node\* head\)/);
    assert.doesNotMatch(fs.readFileSync(javaWorkspace.filePath, "utf-8"), /static void main/);
    assert.doesNotMatch(fs.readFileSync(cppWorkspace.filePath, "utf-8"), /int main/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("practice modes keep beginner function files and pro program files separate", () => {
  const problem = getProblemById("arr-003");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-practice-mode-workspace-"));

  try {
    const beginnerWorkspace = ensureProblemWorkspace(problem, "java", "beginner");
    const proWorkspace = ensureProblemWorkspace(problem, "java", "pro");
    const proProblem = effectiveProblemForPracticeMode(problem, "pro");

    assert.match(beginnerWorkspace.filePath, /Solution\.java$/);
    assert.match(proWorkspace.filePath, /Main\.java$/);
    assert.notEqual(beginnerWorkspace.filePath, proWorkspace.filePath);
    assert.match(fs.readFileSync(beginnerWorkspace.filePath, "utf-8"), /public void reverse\(int\[\] nums\)/);
    assert.match(fs.readFileSync(proWorkspace.filePath, "utf-8"), /public class Main/);
    assert.equal(proProblem.solutionMode, "complete-program");
    assert.equal(proProblem.functionContract, undefined);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("workspace reset restores the starter template for the selected mode", () => {
  const problem = getProblemById("arr-003");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-reset-workspace-"));

  try {
    const workspace = ensureProblemWorkspace(problem, "java", "pro");
    fs.writeFileSync(workspace.filePath, "public class Main { /* user code */ }", "utf-8");

    const reset = resetProblemWorkspace(problem, "java", "pro");
    const resetContent = fs.readFileSync(reset.filePath, "utf-8");

    assert.equal(reset.filePath, workspace.filePath);
    assert.equal(reset.workspaceCode, resetContent);
    assert.match(resetContent, /public class Main/);
    assert.match(resetContent, /Problem: Reverse the Array/);
    assert.doesNotMatch(resetContent, /user code/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("array and tree function templates expose the expected signatures", () => {
  const arrayProblem = getProblemById("arr-003");
  const treeProblem = getProblemById("tr-001");
  assert.ok(arrayProblem);
  assert.ok(treeProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-multi-harness-workspace-"));

  try {
    const arrayWorkspace = ensureProblemWorkspace(arrayProblem, "java");
    const treeWorkspace = ensureProblemWorkspace(treeProblem, "cpp");

    assert.match(fs.readFileSync(arrayWorkspace.filePath, "utf-8"), /public void reverse\(int\[\] nums\)/);
    assert.match(fs.readFileSync(treeWorkspace.filePath, "utf-8"), /vector<int> preorder\(TreeNode\* root\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("array beginner scaffolds cover traversal frequency prefix and two-pointer functions", () => {
  const sortedProblem = getProblemById("arr-002");
  const secondLargestProblem = getProblemById("arr-004");
  const frequencyProblem = getProblemById("arr-005");
  const rangeSumProblem = getProblemById("arr-006");
  const maxSubarrayProblem = getProblemById("arr-007");
  const moveZeroesProblem = getProblemById("arr-008");
  const removeDuplicatesProblem = getProblemById("arr-009");
  const longestSumProblem = getProblemById("arr-010");
  const stockProfitProblem = getProblemById("arr-011");
  const productExceptSelfProblem = getProblemById("arr-012");
  const countPositiveProblem = getProblemById("arr-013");
  const runningSumProblem = getProblemById("arr-014");
  const pairSumProblem = getProblemById("arr-015");
  const leftRotateProblem = getProblemById("arr-016");
  const maxOnesProblem = getProblemById("arr-017");
  assert.ok(sortedProblem);
  assert.ok(secondLargestProblem);
  assert.ok(frequencyProblem);
  assert.ok(rangeSumProblem);
  assert.ok(maxSubarrayProblem);
  assert.ok(moveZeroesProblem);
  assert.ok(removeDuplicatesProblem);
  assert.ok(longestSumProblem);
  assert.ok(stockProfitProblem);
  assert.ok(productExceptSelfProblem);
  assert.ok(countPositiveProblem);
  assert.ok(runningSumProblem);
  assert.ok(pairSumProblem);
  assert.ok(leftRotateProblem);
  assert.ok(maxOnesProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-array-beginner-workspace-"));

  try {
    const sortedWorkspace = ensureProblemWorkspace(sortedProblem, "java");
    const secondLargestWorkspace = ensureProblemWorkspace(secondLargestProblem, "cpp");
    const frequencyWorkspace = ensureProblemWorkspace(frequencyProblem, "java");
    const rangeSumWorkspace = ensureProblemWorkspace(rangeSumProblem, "java");
    const maxSubarrayWorkspace = ensureProblemWorkspace(maxSubarrayProblem, "cpp");
    const moveZeroesWorkspace = ensureProblemWorkspace(moveZeroesProblem, "java");
    const removeDuplicatesWorkspace = ensureProblemWorkspace(removeDuplicatesProblem, "cpp");
    const longestSumWorkspace = ensureProblemWorkspace(longestSumProblem, "java");
    const stockProfitWorkspace = ensureProblemWorkspace(stockProfitProblem, "cpp");
    const productExceptSelfWorkspace = ensureProblemWorkspace(productExceptSelfProblem, "java");
    const countPositiveWorkspace = ensureProblemWorkspace(countPositiveProblem, "cpp");
    const runningSumWorkspace = ensureProblemWorkspace(runningSumProblem, "java");
    const pairSumWorkspace = ensureProblemWorkspace(pairSumProblem, "java");
    const leftRotateWorkspace = ensureProblemWorkspace(leftRotateProblem, "cpp");
    const maxOnesWorkspace = ensureProblemWorkspace(maxOnesProblem, "java");

    assert.match(fs.readFileSync(sortedWorkspace.filePath, "utf-8"), /boolean isSorted\(int\[\] nums\)/);
    assert.match(fs.readFileSync(secondLargestWorkspace.filePath, "utf-8"), /int secondLargest\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(frequencyWorkspace.filePath, "utf-8"), /int highestFrequency\(int\[\] nums\)/);
    assert.match(fs.readFileSync(rangeSumWorkspace.filePath, "utf-8"), /long rangeSum\(int\[\] nums, int left, int right\)/);
    assert.match(fs.readFileSync(maxSubarrayWorkspace.filePath, "utf-8"), /int maxSubarraySum\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(moveZeroesWorkspace.filePath, "utf-8"), /void moveZeroes\(int\[\] nums\)/);
    assert.match(fs.readFileSync(removeDuplicatesWorkspace.filePath, "utf-8"), /int removeDuplicates\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(longestSumWorkspace.filePath, "utf-8"), /int longestSubarraySumK\(int\[\] nums, int target\)/);
    assert.match(fs.readFileSync(stockProfitWorkspace.filePath, "utf-8"), /int maxProfit\(vector<int>& prices\)/);
    assert.match(fs.readFileSync(productExceptSelfWorkspace.filePath, "utf-8"), /int\[\] productExceptSelf\(int\[\] nums\)/);
    assert.match(fs.readFileSync(countPositiveWorkspace.filePath, "utf-8"), /int countPositive\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(runningSumWorkspace.filePath, "utf-8"), /int\[\] runningSum\(int\[\] nums\)/);
    assert.match(fs.readFileSync(pairSumWorkspace.filePath, "utf-8"), /boolean hasPairWithSum\(int\[\] nums, int target\)/);
    assert.match(fs.readFileSync(leftRotateWorkspace.filePath, "utf-8"), /void leftRotateOne\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(maxOnesWorkspace.filePath, "utf-8"), /int maxConsecutiveOnes\(int\[\] nums\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("stack queue and binary-search templates expose focused function signatures", () => {
  const stackProblem = getProblemById("st-002");
  const queueProblem = getProblemById("q-003");
  const searchProblem = getProblemById("bs-001");
  assert.ok(stackProblem);
  assert.ok(queueProblem);
  assert.ok(searchProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-structure-harness-workspace-"));

  try {
    const stackWorkspace = ensureProblemWorkspace(stackProblem, "java");
    const queueWorkspace = ensureProblemWorkspace(queueProblem, "cpp");
    const searchWorkspace = ensureProblemWorkspace(searchProblem, "java");

    assert.match(fs.readFileSync(stackWorkspace.filePath, "utf-8"), /boolean isBalanced\(String value\)/);
    assert.match(fs.readFileSync(queueWorkspace.filePath, "utf-8"), /vector<int> reverseFirstK\(vector<int>& values, int k\)/);
    assert.match(fs.readFileSync(searchWorkspace.filePath, "utf-8"), /int search\(int\[\] values, int target\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("recursion graph and DP templates expose focused function signatures", () => {
  const recursionProblem = getProblemById("rec-003");
  const graphProblem = getProblemById("gr-003");
  const dpProblem = getProblemById("dp-001");
  assert.ok(recursionProblem);
  assert.ok(graphProblem);
  assert.ok(dpProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-algorithm-harness-workspace-"));

  try {
    const recursionWorkspace = ensureProblemWorkspace(recursionProblem, "java");
    const graphWorkspace = ensureProblemWorkspace(graphProblem, "cpp");
    const dpWorkspace = ensureProblemWorkspace(dpProblem, "java");

    assert.match(fs.readFileSync(recursionWorkspace.filePath, "utf-8"), /int factorial\(int n\)/);
    assert.match(fs.readFileSync(graphWorkspace.filePath, "utf-8"), /vector<int> bfs\(int n, const vector<vector<int>>& graph\)/);
    assert.match(fs.readFileSync(dpWorkspace.filePath, "utf-8"), /int fibonacci\(int n\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit manipulation template exposes a focused check-bit function", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-harness-workspace-"));

  try {
    const javaWorkspace = ensureProblemWorkspace(problem, "java");
    const cppWorkspace = ensureProblemWorkspace(problem, "cpp");

    assert.match(fs.readFileSync(javaWorkspace.filePath, "utf-8"), /int checkBit\(int n, int index\)/);
    assert.match(fs.readFileSync(cppWorkspace.filePath, "utf-8"), /int checkBit\(int n, int index\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});
