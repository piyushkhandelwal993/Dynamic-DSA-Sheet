import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getProblemById } from "../services/storage";
import { runJavaSubmission } from "../services/javaRunner";

test("java runner compiles and passes configured test cases", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-pass-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int i = sc.nextInt();
        int mask = 1 << i;
        System.out.print((n & mask) != 0 ? 1 : 0);
        sc.close();
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
