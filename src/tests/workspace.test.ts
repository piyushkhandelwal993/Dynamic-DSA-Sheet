import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getProblemById } from "../services/storage";
import { effectiveProblemForPracticeMode, ensureProblemWorkspace, resetProblemWorkspace } from "../services/workspace";

test("start workspace generation creates a stable Main.java template", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-workspace-test-"));

  try {
    const problem = getProblemById("rec-001");
    assert.ok(problem);
    const first = ensureProblemWorkspace(problem, "java", "pro");
    const second = ensureProblemWorkspace(problem, "java", "pro");

    assert.ok(fs.existsSync(first.filePath));
    assert.equal(first.filePath, second.filePath);
    assert.equal(second.created, false);

    const content = fs.readFileSync(first.filePath, "utf-8");
    assert.match(content, /public class Main/);
    assert.match(content, /Problem: Print Name N Times/);
  } finally {
    if (originalBaseDir === undefined) {
      delete process.env.DSA_SHEET_HOME;
    } else {
      process.env.DSA_SHEET_HOME = originalBaseDir;
    }
  }
});

test("workspace generation keeps Java and C++ solutions separately", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-workspace-language-test-"));

  try {
    const problem = getProblemById("rec-001");
    assert.ok(problem);
    const javaWorkspace = ensureProblemWorkspace(problem, "java", "pro");
    const cppWorkspace = ensureProblemWorkspace(problem, "cpp", "pro");

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

test("linked-list beginner scaffolds cover insert delete middle cycle merge and cleanup signatures", () => {
  const insertHeadProblem = getProblemById("ll-003");
  const insertTailProblem = getProblemById("ll-004");
  const deletePositionProblem = getProblemById("ll-005");
  const middleProblem = getProblemById("ll-007");
  const cycleProblem = getProblemById("ll-008");
  const mergeProblem = getProblemById("ll-009");
  const dedupeProblem = getProblemById("ll-010");
  assert.ok(insertHeadProblem);
  assert.ok(insertTailProblem);
  assert.ok(deletePositionProblem);
  assert.ok(middleProblem);
  assert.ok(cycleProblem);
  assert.ok(mergeProblem);
  assert.ok(dedupeProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-linked-list-expanded-"));

  try {
    const insertHeadWorkspace = ensureProblemWorkspace(insertHeadProblem, "java");
    const insertTailWorkspace = ensureProblemWorkspace(insertTailProblem, "cpp");
    const deletePositionWorkspace = ensureProblemWorkspace(deletePositionProblem, "java");
    const middleWorkspace = ensureProblemWorkspace(middleProblem, "cpp");
    const cycleWorkspace = ensureProblemWorkspace(cycleProblem, "java");
    const mergeWorkspace = ensureProblemWorkspace(mergeProblem, "cpp");
    const dedupeWorkspace = ensureProblemWorkspace(dedupeProblem, "java");

    assert.match(fs.readFileSync(insertHeadWorkspace.filePath, "utf-8"), /public Node insertAtHead\(Node head, int value\)/);
    assert.match(fs.readFileSync(insertTailWorkspace.filePath, "utf-8"), /Node\* insertAtTail\(Node\* head, int value\)/);
    assert.match(fs.readFileSync(deletePositionWorkspace.filePath, "utf-8"), /public Node deleteAtPosition\(Node head, int position\)/);
    assert.match(fs.readFileSync(middleWorkspace.filePath, "utf-8"), /int middleValue\(Node\* head\)/);
    assert.match(fs.readFileSync(cycleWorkspace.filePath, "utf-8"), /public boolean hasCycle\(Node head\)/);
    assert.match(fs.readFileSync(mergeWorkspace.filePath, "utf-8"), /Node\* mergeSorted\(Node\* first, Node\* second\)/);
    assert.match(fs.readFileSync(dedupeWorkspace.filePath, "utf-8"), /public Node removeDuplicates\(Node head\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("recursion beginner scaffolds cover print, string, backtracking, sorting, and board signatures", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-recursion-expanded-"));

  try {
    const printProblem = getProblemById("rec-001");
    const palindromeProblem = getProblemById("rec-007");
    const subsequenceProblem = getProblemById("rec-013");
    const hanoiProblem = getProblemById("rec-017");
    const mergeSortProblem = getProblemById("rec-021");
    const sudokuProblem = getProblemById("rec-023");
    const nQueensProblem = getProblemById("rec-024");
    assert.ok(printProblem);
    assert.ok(palindromeProblem);
    assert.ok(subsequenceProblem);
    assert.ok(hanoiProblem);
    assert.ok(mergeSortProblem);
    assert.ok(sudokuProblem);
    assert.ok(nQueensProblem);
    const printWorkspace = ensureProblemWorkspace(printProblem, "java");
    const palindromeWorkspace = ensureProblemWorkspace(palindromeProblem, "cpp");
    const subsequenceWorkspace = ensureProblemWorkspace(subsequenceProblem, "java");
    const hanoiWorkspace = ensureProblemWorkspace(hanoiProblem, "cpp");
    const mergeSortWorkspace = ensureProblemWorkspace(mergeSortProblem, "java");
    const sudokuWorkspace = ensureProblemWorkspace(sudokuProblem, "cpp");
    const nQueensWorkspace = ensureProblemWorkspace(nQueensProblem, "java");

    assert.match(fs.readFileSync(printWorkspace.filePath, "utf-8"), /public void printNameNTimes\(String name, int n\)/);
    assert.match(fs.readFileSync(palindromeWorkspace.filePath, "utf-8"), /bool isPalindrome\(string s\)/);
    assert.match(fs.readFileSync(subsequenceWorkspace.filePath, "utf-8"), /public List<List<Integer>> generateSubsequences\(int\[\] nums\)/);
    assert.match(fs.readFileSync(hanoiWorkspace.filePath, "utf-8"), /vector<string> towerOfHanoi\(int n\)/);
    assert.match(fs.readFileSync(mergeSortWorkspace.filePath, "utf-8"), /public int\[\] mergeSort\(int\[\] nums\)/);
    assert.match(fs.readFileSync(sudokuWorkspace.filePath, "utf-8"), /void solveSudoku\(vector<vector<int>>& board\)/);
    assert.match(fs.readFileSync(nQueensWorkspace.filePath, "utf-8"), /public List<List<String>> solveNQueens\(int n\)/);
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

test("resource budget DP scaffolds expose grid plus budget signatures", () => {
  const problem = getProblemById("dp-021");
  assert.ok(problem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-dp-budget-workspace-"));

  try {
    const javaWorkspace = ensureProblemWorkspace(problem, "java");
    const cppWorkspace = ensureProblemWorkspace(problem, "cpp");

    assert.match(
      fs.readFileSync(javaWorkspace.filePath, "utf-8"),
      /public boolean canReachWithObstacleEliminations\(int\[\]\[\] grid, int k\)/
    );
    assert.match(
      fs.readFileSync(cppWorkspace.filePath, "utf-8"),
      /bool canReachWithObstacleEliminations\(vector<vector<int>>& grid, int k\)/
    );
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("new array beginner scaffolds cover int, boolean, long, array, void, and double signatures", () => {
  const minLenProblem = getProblemById("arr-018");
  const zeroSumProblem = getProblemById("arr-021");
  const sortedSquaresProblem = getProblemById("arr-023");
  const rotateRightProblem = getProblemById("arr-026");
  const countSubarraysProblem = getProblemById("arr-027");
  const maxAverageProblem = getProblemById("arr-030");
  assert.ok(minLenProblem);
  assert.ok(zeroSumProblem);
  assert.ok(sortedSquaresProblem);
  assert.ok(rotateRightProblem);
  assert.ok(countSubarraysProblem);
  assert.ok(maxAverageProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-array-beginner-expanded-"));

  try {
    const minLenWorkspace = ensureProblemWorkspace(minLenProblem, "java");
    const zeroSumWorkspace = ensureProblemWorkspace(zeroSumProblem, "cpp");
    const sortedSquaresWorkspace = ensureProblemWorkspace(sortedSquaresProblem, "java");
    const rotateRightWorkspace = ensureProblemWorkspace(rotateRightProblem, "cpp");
    const countSubarraysWorkspace = ensureProblemWorkspace(countSubarraysProblem, "java");
    const maxAverageWorkspace = ensureProblemWorkspace(maxAverageProblem, "cpp");

    assert.match(fs.readFileSync(minLenWorkspace.filePath, "utf-8"), /public int minSubarrayLen\(int\[\] nums, int target\)/);
    assert.match(fs.readFileSync(zeroSumWorkspace.filePath, "utf-8"), /bool hasZeroSumSubarray\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(sortedSquaresWorkspace.filePath, "utf-8"), /public int\[\] sortedSquares\(int\[\] nums\)/);
    assert.match(fs.readFileSync(rotateRightWorkspace.filePath, "utf-8"), /void rotateRight\(vector<int>& nums, int k\)/);
    assert.match(fs.readFileSync(countSubarraysWorkspace.filePath, "utf-8"), /public long countSubarraysWithSumK\(int\[\] nums, int k\)/);
    assert.match(fs.readFileSync(maxAverageWorkspace.filePath, "utf-8"), /double maxAverageSubarray\(vector<int>& nums, int k\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("array beginner scaffolds cover sliding-window, two-pointer, and prefix-suffix signatures", () => {
  const minLenProblem = getProblemById("arr-018");
  const windowSumProblem = getProblemById("arr-024");
  const maxAverageProblem = getProblemById("arr-030");
  const pairSumProblem = getProblemById("arr-015");
  const sortedSquaresProblem = getProblemById("arr-023");
  const productExceptSelfProblem = getProblemById("arr-012");
  const equilibriumProblem = getProblemById("arr-020");
  assert.ok(minLenProblem);
  assert.ok(windowSumProblem);
  assert.ok(maxAverageProblem);
  assert.ok(pairSumProblem);
  assert.ok(sortedSquaresProblem);
  assert.ok(productExceptSelfProblem);
  assert.ok(equilibriumProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-array-pattern-beginner-"));

  try {
    const minLenWorkspace = ensureProblemWorkspace(minLenProblem, "java");
    const windowSumWorkspace = ensureProblemWorkspace(windowSumProblem, "cpp");
    const maxAverageWorkspace = ensureProblemWorkspace(maxAverageProblem, "java");
    const pairSumWorkspace = ensureProblemWorkspace(pairSumProblem, "cpp");
    const sortedSquaresWorkspace = ensureProblemWorkspace(sortedSquaresProblem, "java");
    const productExceptSelfWorkspace = ensureProblemWorkspace(productExceptSelfProblem, "cpp");
    const equilibriumWorkspace = ensureProblemWorkspace(equilibriumProblem, "java");

    assert.match(fs.readFileSync(minLenWorkspace.filePath, "utf-8"), /public int minSubarrayLen\(int\[\] nums, int target\)/);
    assert.match(fs.readFileSync(windowSumWorkspace.filePath, "utf-8"), /int maxWindowSum\(vector<int>& nums, int k\)/);
    assert.match(fs.readFileSync(maxAverageWorkspace.filePath, "utf-8"), /public double maxAverageSubarray\(int\[\] nums, int k\)/);
    assert.match(fs.readFileSync(pairSumWorkspace.filePath, "utf-8"), /bool hasPairWithSum\(vector<int>& nums, int target\)/);
    assert.match(fs.readFileSync(sortedSquaresWorkspace.filePath, "utf-8"), /public int\[\] sortedSquares\(int\[\] nums\)/);
    assert.match(fs.readFileSync(productExceptSelfWorkspace.filePath, "utf-8"), /vector<int> productExceptSelf\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(equilibriumWorkspace.filePath, "utf-8"), /public int equilibriumIndex\(int\[\] nums\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("array beginner scaffolds cover deeper two-pointer, sliding-window, and prefix-modulo signatures", () => {
  const containerProblem = getProblemById("arr-031");
  const sortColorsProblem = getProblemById("arr-032");
  const flipProblem = getProblemById("arr-033");
  const moduloProblem = getProblemById("arr-035");
  assert.ok(containerProblem);
  assert.ok(sortColorsProblem);
  assert.ok(flipProblem);
  assert.ok(moduloProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-array-depth-workspace-"));

  try {
    const containerWorkspace = ensureProblemWorkspace(containerProblem, "java");
    const sortColorsWorkspace = ensureProblemWorkspace(sortColorsProblem, "cpp");
    const flipWorkspace = ensureProblemWorkspace(flipProblem, "java");
    const moduloWorkspace = ensureProblemWorkspace(moduloProblem, "cpp");

    assert.match(fs.readFileSync(containerWorkspace.filePath, "utf-8"), /public int maxContainerArea\(int\[\] heights\)/);
    assert.match(fs.readFileSync(sortColorsWorkspace.filePath, "utf-8"), /void sortColors\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(flipWorkspace.filePath, "utf-8"), /public int longestOnesAfterFlip\(int\[\] nums, int k\)/);
    assert.match(fs.readFileSync(moduloWorkspace.filePath, "utf-8"), /long long countSubarraysDivisibleByK\(vector<int>& nums, int k\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover set clear toggle and right-shift extraction", () => {
  const setBitProblem = getProblemById("bit-004");
  const clearBitProblem = getProblemById("bit-005");
  const toggleBitProblem = getProblemById("bit-006");
  const extractBitProblem = getProblemById("bit-007");
  assert.ok(setBitProblem);
  assert.ok(clearBitProblem);
  assert.ok(toggleBitProblem);
  assert.ok(extractBitProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-beginner-workspace-"));

  try {
    const setBitWorkspace = ensureProblemWorkspace(setBitProblem, "java");
    const clearBitWorkspace = ensureProblemWorkspace(clearBitProblem, "cpp");
    const toggleBitWorkspace = ensureProblemWorkspace(toggleBitProblem, "java");
    const extractBitWorkspace = ensureProblemWorkspace(extractBitProblem, "cpp");

    assert.match(fs.readFileSync(setBitWorkspace.filePath, "utf-8"), /public int setBit\(int n, int index\)/);
    assert.match(fs.readFileSync(clearBitWorkspace.filePath, "utf-8"), /int clearBit\(int n, int index\)/);
    assert.match(fs.readFileSync(toggleBitWorkspace.filePath, "utf-8"), /public int toggleBit\(int n, int index\)/);
    assert.match(fs.readFileSync(extractBitWorkspace.filePath, "utf-8"), /int extractBit\(int n, int index\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover odd-even, counting, and power-of-two signatures", () => {
  const oddEvenProblem = getProblemById("bit-002");
  const countBitsProblem = getProblemById("bit-008");
  const countBitsFastProblem = getProblemById("bit-009");
  const powerOfTwoProblem = getProblemById("bit-010");
  assert.ok(oddEvenProblem);
  assert.ok(countBitsProblem);
  assert.ok(countBitsFastProblem);
  assert.ok(powerOfTwoProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-foundation-workspace-"));

  try {
    const oddEvenWorkspace = ensureProblemWorkspace(oddEvenProblem, "java");
    const countBitsWorkspace = ensureProblemWorkspace(countBitsProblem, "cpp");
    const countBitsFastWorkspace = ensureProblemWorkspace(countBitsFastProblem, "java");
    const powerOfTwoWorkspace = ensureProblemWorkspace(powerOfTwoProblem, "cpp");

    assert.match(fs.readFileSync(oddEvenWorkspace.filePath, "utf-8"), /public boolean isOdd\(int n\)/);
    assert.match(fs.readFileSync(countBitsWorkspace.filePath, "utf-8"), /int countSetBits\(int n\)/);
    assert.match(fs.readFileSync(countBitsFastWorkspace.filePath, "utf-8"), /public int countSetBitsFast\(int n\)/);
    assert.match(fs.readFileSync(powerOfTwoWorkspace.filePath, "utf-8"), /bool isPowerOfTwo\(int n\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover binary string, xor pattern, and single-number signatures", () => {
  const binaryProblem = getProblemById("bit-001");
  const xorPatternProblem = getProblemById("bit-011");
  const singleNumberProblem = getProblemById("bit-012");
  assert.ok(binaryProblem);
  assert.ok(xorPatternProblem);
  assert.ok(singleNumberProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-xor-workspace-"));

  try {
    const binaryWorkspace = ensureProblemWorkspace(binaryProblem, "java");
    const xorPatternWorkspace = ensureProblemWorkspace(xorPatternProblem, "cpp");
    const singleNumberWorkspace = ensureProblemWorkspace(singleNumberProblem, "java");

    assert.match(fs.readFileSync(binaryWorkspace.filePath, "utf-8"), /public String toBinary\(int n\)/);
    assert.match(fs.readFileSync(xorPatternWorkspace.filePath, "utf-8"), /int xorFromOneToN\(int n\)/);
    assert.match(fs.readFileSync(singleNumberWorkspace.filePath, "utf-8"), /public int singleNumber\(int\[\] nums\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover two-unique, missing-number, and decode-xor signatures", () => {
  const twoUniqueProblem = getProblemById("bit-013");
  const missingNumberProblem = getProblemById("bit-014");
  const decodeProblem = getProblemById("bit-038");
  assert.ok(twoUniqueProblem);
  assert.ok(missingNumberProblem);
  assert.ok(decodeProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-xor-advanced-workspace-"));

  try {
    const twoUniqueWorkspace = ensureProblemWorkspace(twoUniqueProblem, "java");
    const missingNumberWorkspace = ensureProblemWorkspace(missingNumberProblem, "cpp");
    const decodeWorkspace = ensureProblemWorkspace(decodeProblem, "java");

    assert.match(fs.readFileSync(twoUniqueWorkspace.filePath, "utf-8"), /public int\[\] findTwoUnique\(int\[\] nums\)/);
    assert.match(fs.readFileSync(missingNumberWorkspace.filePath, "utf-8"), /int missingNumber\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(decodeWorkspace.filePath, "utf-8"), /public int\[\] decodeXoredArray\(int\[\] encoded, int first\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover invert, complement, power-of-four, and count-bits signatures", () => {
  const invertProblem = getProblemById("bit-015");
  const complementProblem = getProblemById("bit-016");
  const powerOfFourProblem = getProblemById("bit-024");
  const countBitsProblem = getProblemById("bit-039");
  assert.ok(invertProblem);
  assert.ok(complementProblem);
  assert.ok(powerOfFourProblem);
  assert.ok(countBitsProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-not-dp-workspace-"));

  try {
    const invertWorkspace = ensureProblemWorkspace(invertProblem, "java");
    const complementWorkspace = ensureProblemWorkspace(complementProblem, "cpp");
    const powerOfFourWorkspace = ensureProblemWorkspace(powerOfFourProblem, "java");
    const countBitsWorkspace = ensureProblemWorkspace(countBitsProblem, "cpp");

    assert.match(fs.readFileSync(invertWorkspace.filePath, "utf-8"), /public int invertBits\(int n\)/);
    assert.match(fs.readFileSync(complementWorkspace.filePath, "utf-8"), /int bitwiseComplement\(int n\)/);
    assert.match(fs.readFileSync(powerOfFourWorkspace.filePath, "utf-8"), /public boolean isPowerOfFour\(int n\)/);
    assert.match(fs.readFileSync(countBitsWorkspace.filePath, "utf-8"), /vector<int> countBits\(int n\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover odd-count, xor-swap, hamming-distance, number-complement, and min-bit-flips signatures", () => {
  const oddCountProblem = getProblemById("bit-017");
  const swapProblem = getProblemById("bit-020");
  const hammingProblem = getProblemById("bit-032");
  const complementProblem = getProblemById("bit-033");
  const minFlipsProblem = getProblemById("bit-040");
  assert.ok(oddCountProblem);
  assert.ok(swapProblem);
  assert.ok(hammingProblem);
  assert.ok(complementProblem);
  assert.ok(minFlipsProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-next-batch-workspace-"));

  try {
    const oddCountWorkspace = ensureProblemWorkspace(oddCountProblem, "java");
    const swapWorkspace = ensureProblemWorkspace(swapProblem, "cpp");
    const hammingWorkspace = ensureProblemWorkspace(hammingProblem, "java");
    const complementWorkspace = ensureProblemWorkspace(complementProblem, "cpp");
    const minFlipsWorkspace = ensureProblemWorkspace(minFlipsProblem, "java");

    assert.match(fs.readFileSync(oddCountWorkspace.filePath, "utf-8"), /public int countOddNumbers\(int\[\] nums\)/);
    assert.match(fs.readFileSync(swapWorkspace.filePath, "utf-8"), /vector<int> swapUsingXor\(int a, int b\)/);
    assert.match(fs.readFileSync(hammingWorkspace.filePath, "utf-8"), /public int hammingDistance\(int x, int y\)/);
    assert.match(fs.readFileSync(complementWorkspace.filePath, "utf-8"), /int findComplement\(int n\)/);
    assert.match(fs.readFileSync(minFlipsWorkspace.filePath, "utf-8"), /public int minBitFlips\(int start, int goal\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover clear-rightmost, kernighan-array, range-and, and get-sum signatures", () => {
  const clearProblem = getProblemById("bit-021");
  const countBitsProblem = getProblemById("bit-023");
  const rangeAndProblem = getProblemById("bit-035");
  const sumProblem = getProblemById("bit-036");
  assert.ok(clearProblem);
  assert.ok(countBitsProblem);
  assert.ok(rangeAndProblem);
  assert.ok(sumProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-range-sum-batch-workspace-"));

  try {
    const clearWorkspace = ensureProblemWorkspace(clearProblem, "java");
    const countBitsWorkspace = ensureProblemWorkspace(countBitsProblem, "cpp");
    const rangeAndWorkspace = ensureProblemWorkspace(rangeAndProblem, "java");
    const sumWorkspace = ensureProblemWorkspace(sumProblem, "cpp");

    assert.match(fs.readFileSync(clearWorkspace.filePath, "utf-8"), /public int clearRightmostSetBit\(int n\)/);
    assert.match(fs.readFileSync(countBitsWorkspace.filePath, "utf-8"), /vector<int> countBitsKernighan\(int n\)/);
    assert.match(fs.readFileSync(rangeAndWorkspace.filePath, "utf-8"), /public int rangeBitwiseAnd\(int left, int right\)/);
    assert.match(fs.readFileSync(sumWorkspace.filePath, "utf-8"), /int getSum\(int a, int b\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover query-range, batch-set, single-number-ii, repeat-missing, subset-sum, and visited-mask signatures", () => {
  const checkProblem = getProblemById("bit-018");
  const setQueriesProblem = getProblemById("bit-019");
  const toggleRangeProblem = getProblemById("bit-022");
  const singleNumberTwoProblem = getProblemById("bit-025");
  const repeatMissingProblem = getProblemById("bit-026");
  const missingBucketsProblem = getProblemById("bit-027");
  const subsetSumProblem = getProblemById("bit-029");
  const visitedCitiesProblem = getProblemById("bit-030");
  assert.ok(checkProblem);
  assert.ok(setQueriesProblem);
  assert.ok(toggleRangeProblem);
  assert.ok(singleNumberTwoProblem);
  assert.ok(repeatMissingProblem);
  assert.ok(missingBucketsProblem);
  assert.ok(subsetSumProblem);
  assert.ok(visitedCitiesProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-large-batch-workspace-"));

  try {
    const checkWorkspace = ensureProblemWorkspace(checkProblem, "java");
    const setQueriesWorkspace = ensureProblemWorkspace(setQueriesProblem, "cpp");
    const toggleRangeWorkspace = ensureProblemWorkspace(toggleRangeProblem, "java");
    const singleNumberTwoWorkspace = ensureProblemWorkspace(singleNumberTwoProblem, "cpp");
    const repeatMissingWorkspace = ensureProblemWorkspace(repeatMissingProblem, "java");
    const missingBucketsWorkspace = ensureProblemWorkspace(missingBucketsProblem, "cpp");
    const subsetSumWorkspace = ensureProblemWorkspace(subsetSumProblem, "java");
    const visitedCitiesWorkspace = ensureProblemWorkspace(visitedCitiesProblem, "cpp");

    assert.match(fs.readFileSync(checkWorkspace.filePath, "utf-8"), /public int checkBitInQuery\(int n, int index\)/);
    assert.match(fs.readFileSync(setQueriesWorkspace.filePath, "utf-8"), /int setBitsFromQueries\(int n, vector<int>& positions\)/);
    assert.match(fs.readFileSync(toggleRangeWorkspace.filePath, "utf-8"), /public int toggleRange\(int n, int left, int right\)/);
    assert.match(fs.readFileSync(singleNumberTwoWorkspace.filePath, "utf-8"), /int singleNumberII\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(repeatMissingWorkspace.filePath, "utf-8"), /public int\[\] findRepeatingAndMissing\(int\[\] nums\)/);
    assert.match(fs.readFileSync(missingBucketsWorkspace.filePath, "utf-8"), /int missingNumberBuckets\(vector<int>& nums\)/);
    assert.match(fs.readFileSync(subsetSumWorkspace.filePath, "utf-8"), /public int countSubsetSum\(int\[\] nums, int target\)/);
    assert.match(fs.readFileSync(visitedCitiesWorkspace.filePath, "utf-8"), /int countDistinctVisitedCities\(vector<int>& cities\)/);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
  }
});

test("bit beginner scaffolds cover subsets, assignment-mask, reverse-bits, and maximum-xor signatures", () => {
  const subsetsProblem = getProblemById("bit-028");
  const assignmentProblem = getProblemById("bit-031");
  const reverseBitsProblem = getProblemById("bit-034");
  const maxXorProblem = getProblemById("bit-037");
  assert.ok(subsetsProblem);
  assert.ok(assignmentProblem);
  assert.ok(reverseBitsProblem);
  assert.ok(maxXorProblem);
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-bit-final-batch-workspace-"));

  try {
    const subsetsWorkspace = ensureProblemWorkspace(subsetsProblem, "java");
    const assignmentWorkspace = ensureProblemWorkspace(assignmentProblem, "cpp");
    const reverseBitsWorkspace = ensureProblemWorkspace(reverseBitsProblem, "java");
    const maxXorWorkspace = ensureProblemWorkspace(maxXorProblem, "cpp");

    assert.match(fs.readFileSync(subsetsWorkspace.filePath, "utf-8"), /public List<List<Integer>> subsets\(int\[\] nums\)/);
    assert.match(fs.readFileSync(assignmentWorkspace.filePath, "utf-8"), /int countAssignments\(vector<vector<int>>& availability\)/);
    assert.match(fs.readFileSync(reverseBitsWorkspace.filePath, "utf-8"), /public int reverseBits\(int n\)/);
    assert.match(fs.readFileSync(maxXorWorkspace.filePath, "utf-8"), /int maximumXorPair\(vector<int>& nums\)/);
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

test("expanded stack beginner scaffolds cover queries strings arrays matrices and paired inputs", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-stack-expanded-"));

  try {
    const queryProblem = getProblemById("st-001");
    const reverseProblem = getProblemById("st-003");
    const spanProblem = getProblemById("st-008");
    const matrixProblem = getProblemById("st-015");
    const compareProblem = getProblemById("st-026");
    const removeDigitsProblem = getProblemById("st-030");
    assert.ok(queryProblem);
    assert.ok(reverseProblem);
    assert.ok(spanProblem);
    assert.ok(matrixProblem);
    assert.ok(compareProblem);
    assert.ok(removeDigitsProblem);

    const queryWorkspace = ensureProblemWorkspace(queryProblem, "java");
    const reverseWorkspace = ensureProblemWorkspace(reverseProblem, "cpp");
    const spanWorkspace = ensureProblemWorkspace(spanProblem, "java");
    const matrixWorkspace = ensureProblemWorkspace(matrixProblem, "cpp");
    const compareWorkspace = ensureProblemWorkspace(compareProblem, "java");
    const removeDigitsWorkspace = ensureProblemWorkspace(removeDigitsProblem, "cpp");

    assert.match(fs.readFileSync(queryWorkspace.filePath, "utf-8"), /public int\[\] processQueries\(String\[\] queries\)/);
    assert.match(fs.readFileSync(reverseWorkspace.filePath, "utf-8"), /string reverseWord\(string value\)/);
    assert.match(fs.readFileSync(spanWorkspace.filePath, "utf-8"), /public int\[\] stockSpan\(int\[\] prices\)/);
    assert.match(fs.readFileSync(matrixWorkspace.filePath, "utf-8"), /int maximalRectangle\(vector<vector<int>>& matrix\)/);
    assert.match(fs.readFileSync(compareWorkspace.filePath, "utf-8"), /public boolean backspaceCompare\(String s, String t\)/);
    assert.match(fs.readFileSync(removeDigitsWorkspace.filePath, "utf-8"), /string removeKDigits\(string number, int k\)/);
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
