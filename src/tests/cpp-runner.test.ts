import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { getProblemById } from "../services/storage";
import { runCppSubmission, runCppWithCustomInput } from "../services/cppRunner";

const compilerAvailable = spawnSync("g++", ["--version"], { encoding: "utf-8" }).status === 0;

test("cpp runner compiles and passes configured test cases", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-pass-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
public:
  int checkBit(int n, int index) {
    return (n & (1 << index)) != 0 ? 1 : 0;
  }
};
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp runner reports compiler errors", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-fail-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(filePath, "int main() { this does not compile; }", "utf-8");

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, false);
  assert.ok(result.compileError);
});

test("cpp runner supports custom input", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-custom-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(
    filePath,
    `#include <iostream>
using namespace std;
int main() { int value; cin >> value; cout << value * 2; }
`,
    "utf-8"
  );

  const result = runCppWithCustomInput(problem, filePath, "21\n");
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.actualOutput, "42");
});

test("cpp runner normalizes bits/stdc++.h for Apple Clang compatibility", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-portable-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(
    filePath,
    `#include <bits/stdc++.h>
using namespace std;
int main() {
  int n;
  cin >> n;
  if (n == 0) {
    cout << 0;
    return 0;
  }
  string result;
  while (n > 0) {
    result.push_back(char('0' + (n & 1)));
    n >>= 1;
  }
  reverse(result.begin(), result.end());
  cout << result;
}
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp runner stops infinite loops", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-timeout-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(filePath, `int main() { while (true) { asm volatile("" ::: "memory"); } }`, "utf-8");

  const result = runCppWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.resourceLimit, "time");
});

test("cpp runner stops excessive output", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-output-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(
    filePath,
    `#include <iostream>
    int main() { while (true) std::cout << "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; }`,
    "utf-8"
  );

  const result = runCppWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.outputLimitExceeded, true);
  assert.equal(result.resourceLimit, "output");
});

test("cpp function harness provides linked-list types and driver", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-runner-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      Node* reverse(Node* head) {
        Node* previous = nullptr;
        Node* current = head;
        while (current != nullptr) {
          Node* next = current->next;
          current->next = previous;
          previous = current;
          current = next;
        }
        return previous;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports linked-list length", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("ll-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-length-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int length(Node* head) {
        int count = 0;
        for (Node* current = head; current != nullptr; current = current->next) ++count;
        return count;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports array scalar returns", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("arr-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-array-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int findMaximum(vector<int>& nums) {
        int answer = nums[0];
        for (int value : nums) answer = max(answer, value);
        return answer;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness provides TreeNode and executes recursive height", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("tr-005");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-tree-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int height(TreeNode* root) {
        if (root == nullptr) return 0;
        return 1 + max(height(root->left), height(root->right));
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports queue prefix reversal", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("q-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-queue-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      vector<int> reverseFirstK(vector<int>& values, int k) {
        reverse(values.begin(), values.begin() + k);
        return values;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports binary search contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bs-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-binary-search-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int search(vector<int>& values, int target) {
        int left = 0, right = static_cast<int>(values.size()) - 1;
        while (left <= right) {
          int middle = left + (right - left) / 2;
          if (values[middle] == target) return middle;
          if (values[middle] < target) left = middle + 1;
          else right = middle - 1;
        }
        return -1;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp graph harness provides adjacency construction", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("gr-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-graph-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      vector<int> bfs(int n, const vector<vector<int>>& graph) {
        vector<int> order;
        vector<bool> visited(n, false);
        queue<int> nodes;
        nodes.push(0);
        visited[0] = true;
        while (!nodes.empty()) {
          int node = nodes.front();
          nodes.pop();
          order.push_back(node);
          for (int next : graph[node]) {
            if (!visited[next]) {
              visited[next] = true;
              nodes.push(next);
            }
          }
        }
        return order;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports DP scalar contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("dp-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-dp-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int fibonacci(int n) {
        if (n <= 1) return n;
        int previous = 0, current = 1;
        for (int value = 2; value <= n; ++value) {
          int next = previous + current;
          previous = current;
          current = next;
        }
        return current;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});
